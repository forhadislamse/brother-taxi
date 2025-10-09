import httpStatus from "http-status";
import { fileUploader } from "../../../helpars/fileUploader";
import { jwtHelpers } from "../../../helpars/jwtHelpers";
import config from "../../../config";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import { calculateDistance } from "../../../shared/calculateDistance";
import { findNearbyDrivers } from "../../../shared/findNearByDrivers";
import {
  CarTransport,
  PaymentStatus,
  Prisma,
  RideType,
  TransportStatus,
  UserRole,
} from "@prisma/client";
import { paginationHelper } from "../../../helpars/paginationHelper";
import { IGenericResponse } from "../vehicle/vehicle.interface";
import { IPaginationOptions } from "../../../interfaces/paginations";
import {
  IAssignDriverReq,
  ICarTransportFilters,
  ICompleteJourneyReq,
  IConfirmArrivalReq,
  IDriverIncomeResponse,
  IDriverJobFilters,
  IDriverResponseReq,
  IStartJourneyReq,
} from "./carTransport.interface";

export async function calculateFareFromConfig(
  distance: number,
  rideTime: number,
  waitingTime: number
) {
  const activeFare = await prisma.fare.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });
  if (!activeFare) throw new Error("Active Fare not found");

  const { baseFare, costPerKm, costPerMin, minimumFare, waitingPerMin } =
    activeFare;
  console.log({ object: activeFare, distance, rideTime, waitingTime });

  if (baseFare == null) {
    throw new Error("baseFare value is missing in active fare configuration");
  }
  if (waitingPerMin == null) {
    throw new Error(
      "waitingPerMin value is missing in active fare configuration"
    );
  }
  if (costPerMin == null) {
    throw new Error("costPerMin value is missing in active fare configuration");
  }

  // 1. Distance fare
  const distanceFare = costPerKm * distance;

  // 2. Time fare
  const timeFare = costPerMin * rideTime;

  // 3. Waiting fare (first 3 min free)
  const waitingFare = waitingTime >= 4 ? (waitingTime - 4) * waitingPerMin : 0;

  // 4. Total
  let totalFare = baseFare + distanceFare + timeFare + waitingFare;

  // 5. Minimum fare check
  if (minimumFare == null) {
    throw new Error(
      "minimumFare value is missing in active fare configuration"
    );
  }
  if (totalFare < minimumFare) {
    totalFare = minimumFare;
  }

  return {
    distance: distance.toFixed(2),
    rideTime,
    waitingTime,
    totalFare: Math.round(totalFare),
  };
}

// const planCarTransport = async (payload: any) => {
//   const {pickup,dropOff, pickupLat, pickupLng, dropOffLat, dropOffLng } = payload;

//   if (!pickupLat || !pickupLng || !dropOffLat || !dropOffLng) {
//     throw new Error("Pickup and drop-off coordinates are required");
//   }

//   //  Distance
//   const distance = calculateDistance(
//     pickupLat,
//     pickupLng,
//     dropOffLat,
//     dropOffLng
//   );

//   //  Service type
//   const serviceType: RideType =
//     distance < 10 ? RideType.MiniRide : RideType.LongRide;

//   //  Ride time & waiting time
//   const rideTime = payload.rideTime ? Number(payload.rideTime) : 0;
//   const waitingTime = payload.waitingTime ? Number(payload.waitingTime) : 0;

//   //  Fare
//   const { totalFare } = await calculateFareFromConfig(
//     distance,
//     rideTime,
//     waitingTime
//   );

//   //  Nearby drivers
//   const nearbyDrivers = await findNearbyDrivers(pickupLat, pickupLng);

//   //  Map nearby drivers with vehicle info
//   const nearbyDriversWithVehicle = await Promise.all(
//     nearbyDrivers.map(async (driver) => {
//       const vehicle = await prisma.vehicle.findFirst({
//         where: { userId: driver.id, isActive: true },
//       });

//       return {
//         id: driver.id,
//         fullName: driver.fullName || "",
//         lat: driver.lat!,
//         lng: driver.lng!,
//         vehicleId: vehicle?.id || null,
//         vehicleName: vehicle
//           ? `${vehicle.manufacturer} ${vehicle.model}`
//           : null,
//         distance: calculateDistance(
//           pickupLat,
//           pickupLng,
//           driver.lat!,
//           driver.lng!
//         ),
//       };
//     })
//   );

//   return {
//     pickup,
//     dropOff,
//     pickupLat,
//     pickupLng,
//     dropOffLat,
//     dropOffLng,
//     estimatedFare: totalFare,
//     distance,
//     serviceType,
//     rideTime,
//     waitingTime,
//     nearbyDrivers: nearbyDriversWithVehicle,
//   };
// };

const planCarTransport = async (userId: string, payload: any) => {
  const { pickup, dropOff, pickupLat, pickupLng, dropOffLat, dropOffLng } =
    payload;

  if (!pickupLat || !pickupLng || !dropOffLat || !dropOffLng) {
    throw new Error("Pickup and drop-off coordinates are required");
  }

  // Distance
  const distance = calculateDistance(
    pickupLat,
    pickupLng,
    dropOffLat,
    dropOffLng
  );

  // Service type
  const serviceType: RideType =
    distance < 10 ? RideType.MiniRide : RideType.LongRide;

  // Ride time & waiting time
  const rideTime = payload.rideTime ? Number(payload.rideTime) : 0;
  const waitingTime = payload.waitingTime ? Number(payload.waitingTime) : 0;

  // Fare
  const { totalFare } = await calculateFareFromConfig(
    distance,
    rideTime,
    waitingTime
  );

  // Nearby drivers (dynamic, not saved in DB)
  const nearbyDriversRaw = await findNearbyDrivers(pickupLat, pickupLng);
  const nearbyDrivers = await Promise.all(
    nearbyDriversRaw.map(async (driver) => {
      const vehicle = await prisma.vehicle.findFirst({
        where: { userId: driver.id, isActive: true },
      });

      return {
        id: driver.id,
        fullName: driver.fullName || "",
        lat: driver.lat!,
        lng: driver.lng!,
        vehicleId: vehicle?.id || null,
        vehicleName: vehicle
          ? `${vehicle.manufacturer} ${vehicle.model}`
          : null,
        vehicleModel: vehicle?.model || null,
        distance: calculateDistance(
          pickupLat,
          pickupLng,
          driver.lat!,
          driver.lng!
        ),
      };
    })
  );

  // ✅ Save plan to DB
  const savedPlan = await prisma.ridePlan.create({
    data: {
      userId,
      pickup,
      dropOff,
      pickupLat,
      pickupLng,
      dropOffLat,
      dropOffLng,
      rideTime,
      waitingTime,
      distance,
      estimatedFare: totalFare,
      serviceType,
    },
  });

  // Return saved plan + nearby drivers
  return {
    ridePlan: savedPlan,
    nearbyDrivers,
  };
};

// const getMyRidePlans = async (userId: string) => {
//   // Fetch ride plans for the logged-in user
//   const ridePlans = await prisma.ridePlan.findMany({
//     where: { userId },
//     orderBy: { createdAt: "desc" },
//     include: {
//       carTransport: true, // Include car transport info if created
//     },
//   });

//   return ridePlans;
// };

const getMyRidePlans = async (userId: string) => {
  // Fetch ride plans for the logged-in user
  const ridePlans = await prisma.ridePlan.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      carTransport: true, // যদি carTransport এর ডিটেইল দরকার হয়
    },
  });

  // প্রতিটি প্ল্যানের জন্য fresh nearby drivers খুঁজে বের করা
  const ridePlansWithDrivers = await Promise.all(
    ridePlans.map(async (plan) => {
      const nearbyDriversRaw = await findNearbyDrivers(
        plan.pickupLat,
        plan.pickupLng
      );

      const nearbyDrivers = await Promise.all(
        nearbyDriversRaw.map(async (driver) => {
          const vehicle = await prisma.vehicle.findFirst({
            where: { userId: driver.id, isActive: true },
          });

          return {
            id: driver.id,
            fullName: driver.fullName || "",
            lat: driver.lat!,
            lng: driver.lng!,
            vehicleId: vehicle?.id || null,
            vehicleName: vehicle
              ? `${vehicle.manufacturer} ${vehicle.model}`
              : null,
            vehicleModel: vehicle?.model || null,
            distance: calculateDistance(
              plan.pickupLat,
              plan.pickupLng,
              driver.lat!,
              driver.lng!
            ),
          };
        })
      );

      return { ...plan, nearbyDrivers };
    })
  );

  return ridePlansWithDrivers;
};

const getRidePlanById = async (userId: string, planId: string) => {
  const ridePlan = await prisma.ridePlan.findFirst({
    where: {
      id: planId,
      userId, // ensures only the owner can fetch
    },
    include: {
      carTransport: true, // include associated car transports
    },
  });

  if (!ridePlan) throw new Error("Ride plan not found");

  return ridePlan;
};

// const createCarTransport = async (
//   token: string,
//   payload: any,
//   files: any[]
// ) => {
//   const decodedToken = jwtHelpers.verifyToken(token, config.jwt.jwt_secret!);
//   const userId = decodedToken.id;

//   if (!payload.ridePlanId) throw new Error("ridePlanId is required");

//   // Fetch ride plan
//   const ridePlan = await prisma.ridePlan.findUnique({
//     where: { id: payload.ridePlanId },
//   });
//   if (!ridePlan) throw new Error("Ride plan not found");

//   // Fetch vehicle
//   const vehicle = await prisma.vehicle.findUnique({
//     where: { id: payload.vehicleId },
//   });
//   if (!vehicle) throw new Error("Vehicle not found");

//   // Calculate fare & distance using ridePlan to avoid mismatch
//   const distance = ridePlan.distance;
//   const serviceType: RideType = ridePlan.serviceType as RideType;
//   const rideTime = ridePlan.rideTime;
//   const waitingTime = ridePlan.waitingTime;
//   const totalFare = ridePlan.estimatedFare;

//   // Pickup time & date
//   const now = new Date();
//   const pickupDate = payload.pickupDate?.trim() || now.toISOString().split("T")[0];
//   const pickupTime = payload.pickupTime?.trim() || now.toTimeString().split(" ")[0].slice(0, 5);

//   // Upload images
//   const uploadedImages = await Promise.all(
//     files.map((file) => fileUploader.uploadToDigitalOcean(file))
//   );

//   // Save car transport
//   const carTransport = await prisma.carTransport.create({
//     data: {
//       userId,
//       pickupTime,
//       pickupDate,
//       vehicleId: vehicle.id,
//       ridePlanId: ridePlan.id, // <-- link transport to ride plan
//       pickupLocation: ridePlan.pickup,
//       dropOffLocation: ridePlan.dropOff,
//       pickupLat: ridePlan.pickupLat,
//       pickupLng: ridePlan.pickupLng,
//       dropOffLat: ridePlan.dropOffLat,
//       dropOffLng: ridePlan.dropOffLng,

//       distance,
//       totalAmount: totalFare,
//       serviceType,
//       rideTime,
//       waitingTime,
//       beforePickupImages: uploadedImages.map((img) => img.Location),
//       assignedDriver: vehicle.userId, // assign driver if applicable
//     },
//   });

//   return { carTransport };
// };

const createCarTransport = async (
  token: string,
  payload: any
) => {
  const decodedToken = jwtHelpers.verifyToken(token, config.jwt.jwt_secret!);
  const userId = decodedToken.id;

  if (!payload.ridePlanId) throw new Error("ridePlanId is required");

  // Fetch ride plan
  const ridePlan = await prisma.ridePlan.findUnique({
    where: { id: payload.ridePlanId },
  });
  if (!ridePlan) throw new Error("Ride plan not found");

  // Fetch vehicle
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: payload.vehicleId },
  });
  if (!vehicle) throw new Error("Vehicle not found");

  // Calculate fare & distance
  const distance = ridePlan.distance;
  const serviceType: RideType = ridePlan.serviceType as RideType;
  const rideTime = ridePlan.rideTime;
  const waitingTime = ridePlan.waitingTime;
  const totalFare = ridePlan.estimatedFare;

  // Pickup time & date
  const now = new Date();
  const pickupDate = payload.pickupDate?.trim() || now.toISOString().split("T")[0];
  const pickupTime = payload.pickupTime?.trim() || now.toTimeString().split(" ")[0].slice(0, 5);

  // Save car transport (images বাদ)
  const carTransport = await prisma.carTransport.create({
    data: {
      userId,
      pickupTime,
      pickupDate,
      vehicleId: vehicle.id,
      ridePlanId: ridePlan.id,
      pickupLocation: ridePlan.pickup,
      dropOffLocation: ridePlan.dropOff,
      pickupLat: ridePlan.pickupLat,
      pickupLng: ridePlan.pickupLng,
      dropOffLat: ridePlan.dropOffLat,
      dropOffLng: ridePlan.dropOffLng,
      distance,
      totalAmount: totalFare,
      serviceType,
      rideTime,
      waitingTime,
      assignedDriver: vehicle.userId,
    },
  });

  return { carTransport };
};


const cancelRide = async (
  userId: string,
  rideId: string,
  cancelReason: string
) => {
  const ride = await prisma.carTransport.findUnique({ where: { id: rideId } });

  if (!ride) throw new ApiError(httpStatus.NOT_FOUND, "Ride not found");
  if (ride.userId !== userId)
    throw new ApiError(httpStatus.FORBIDDEN, "You cannot cancel this ride");

  return await prisma.carTransport.update({
    where: { id: rideId },
    data: {
      status: TransportStatus.CANCELLED,
      cancelReason,
    },
  });
};

const getRideDetailsById = async (rideId: string) => {
  const ride = await prisma.carTransport.findUnique({
    where: { id: rideId },
    include: {
      driver: {
        select: {
          id: true,
          fullName: true,
          phoneNumber: true,
          profileImage: true,
        },
      },
      vehicle: {
        select: {
          id: true,
          manufacturer: true,
          model: true,
          licensePlateNumber: true,
          // bh: true,
          // refferalCode: true,
          image: true,
          color: true,
          driver: {
            // vehicle এর driver info
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true,
              profileImage: true,
              location: true,
            },
          },
        },
      },
    },
  });

  if (!ride) {
    return null;
  }

  // // Ensure the user can only access their own ride details
  // if (ride.userId !== userId) {
  //   throw new ApiError(httpStatus.FORBIDDEN, "You do not have access to this ride");
  // }

  return ride;
};

const getCompletedRideFromDb = async (rideId: string, userId: string) => {
  const ride = await prisma.carTransport.findUnique({
    where: { id: rideId },
    include: {
      user: true,
      vehicle: {
        include: {
          driver: true,
        },
      },
    },
  });

  if (!ride) {
    throw new ApiError(httpStatus.NOT_FOUND, "Ride not found");
  }

  // Ensure only the rider who booked can view
  if (ride.userId !== userId) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Not authorized to view this ride"
    );
  }

  if (ride.status !== "COMPLETED") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Ride not completed yet");
  }

  

  return ride;
};

const getCarTransportById = async (id: string): Promise<any | null> => {
  const result = await prisma.carTransport.findUnique({
    where: {
      id,
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          phoneNumber: true,
          email: true,
          profileImage: true,
          location: true,
          lat: true,
          lng: true,
        },
      },
      vehicle: {
          select: {
            id: true,
            manufacturer: true,
            model: true,
            licensePlateNumber: true,
            // bh: true,
            // refferalCode: true,
            image: true,
            color: true,
            driver: {
              select: {
                id: true,
                fullName: true,
                email: true,
                referralCode:true,
                phoneNumber: true,
                profileImage: true,
                location: true,
                totalTrips:true,
                averageRating:true,
                reviewCount:true,
              },
            },
          },
        },
    },
  });

  if (!result) {
    return null;
  }

  // Fetch nearby drivers for this transport
  let nearbyDriversFromPickup: any[] = [];
  let nearbyDriversFromUser: any[] = [];

  // Only search near pickup location if coordinates exist
  if (result.pickupLat && result.pickupLng) {
    nearbyDriversFromPickup = await findNearbyDrivers(
      result.pickupLat,
      result.pickupLng
    );
  }

  // Only search near user location if coordinates exist
  if (result.user.lat && result.user.lng) {
    nearbyDriversFromUser = await findNearbyDrivers(
      result.user.lat,
      result.user.lng
    );
  }

  // Combine and remove duplicates
  const allNearbyDrivers = [
    ...nearbyDriversFromPickup,
    ...nearbyDriversFromUser,
  ];
  const uniqueDrivers = Array.from(
    new Map(allNearbyDrivers.map((driver) => [driver.id, driver])).values()
  );

  // Add recommended drivers data to the transport object
  const transportWithDrivers = {
    ...result,
    recommendedDrivers: uniqueDrivers.map((driver) => ({
      id: driver.id,
      fullName: driver.fullName,
      phone: driver.phone,
      profileImage: driver.profileImage,
      vehicleId: driver.vehicleId,
      lat: driver.lat,
      lng: driver.lng,
      distanceFromPickup:
        result.pickupLat && result.pickupLng
          ? calculateDistance(
              result.pickupLat,
              result.pickupLng,
              driver.lat || 0,
              driver.lng || 0
            )
          : null,
      // distanceFromUser:
      //   result.user.lat && result.user.lng
      //     ? calculateDistance(
      //         result.user.lat,
      //         result.user.lng,
      //         driver.lat || 0,
      //         driver.lng || 0
      //       )
      //     : null,
    })),
  };

  return transportWithDrivers;
};

const getNewCarTransportsReq = async (
  options: IPaginationOptions
): Promise<IGenericResponse<any[]>> => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const whereConditions: Prisma.CarTransportWhereInput = {
    isDriverReqCancel: true,
  };

  const transports = await prisma.carTransport.findMany({
    where: whereConditions,
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImage: true,
          location: true,
          lat: true,
          lng: true,
        },
      },
      vehicle: {
        select: {
          id: true,
          manufacturer: true,
          model: true,
          licensePlateNumber: true,
          // bh: true,
          // refferalCode: true,
          image: true,
          color: true,
          driver: {
            // vehicle এর driver info
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true,
              profileImage: true,
              location: true,
            },
          },
        },
      },
    },
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
  });

  // Get nearby drivers for each transport
  const transportWithDrivers = await Promise.all(
    transports.map(async (transport) => {
      let nearbyDriversFromPickup: any[] = [];
      let nearbyDriversFromUser: any[] = [];

      // Only search near pickup location if coordinates exist
      if (transport.pickupLat && transport.pickupLng) {
        nearbyDriversFromPickup = await findNearbyDrivers(
          transport.pickupLat,
          transport.pickupLng
        );
      }

      // Only search near user location if coordinates exist
      if (transport.user.lat && transport.user.lng) {
        nearbyDriversFromUser = await findNearbyDrivers(
          transport.user.lat,
          transport.user.lng
        );
      }

      // Combine and remove duplicates
      const allNearbyDrivers = [
        ...nearbyDriversFromPickup,
        ...nearbyDriversFromUser,
      ];
      const uniqueDrivers = Array.from(
        new Map(allNearbyDrivers.map((driver) => [driver.id, driver])).values()
      );

      return {
        ...transport,
        recommendedDrivers: uniqueDrivers.map((driver) => ({
          id: driver.id,
          fullName: driver.fullName,
          phone: driver.phone,
          profileImage: driver.profileImage,
          lat: driver.lat,
          lng: driver.lng,
          distanceFromPickup:
            transport.pickupLat &&
            transport.pickupLng &&
            driver.lat &&
            driver.lng
              ? calculateDistance(
                  transport.pickupLat,
                  transport.pickupLng,
                  driver.lat,
                  driver.lng
                )
              : null,
          // distanceFromUser:
          //   transport.user.lat && transport.user.lng && driver.lat && driver.lng
          //     ? calculateDistance(
          //         transport.user.lat,
          //         transport.user.lng,
          //         driver.lat,
          //         driver.lng
          //       )
          //     : null,
        })),
      };
    })
  );

  const total = await prisma.carTransport.count({
    where: whereConditions,
  });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: transportWithDrivers,
  };
};

// const getMyRides = async (userId: string,) => {
//   // প্রথমে ride গুলো fetch করো
//   const rides = await prisma.carTransport.findMany({
//     where: { userId, status: TransportStatus.COMPLETED },
//     orderBy: { createdAt: "desc" },
//     include: {
//             user: {
//         select: {
//           id: true,
//           fullName: true,
//           email: true,
//           profileImage: true,
//           location: true,
//           lat: true,
//           lng: true,
//         },
//       },
//       vehicle: {
//         select: {
//           id: true,
//           manufacturer: true,
//           model: true,
//           licensePlateNumber: true,
//           bh: true,
//           refferalCode: true,
//           image: true,
//           color: true,
//           driver: { // vehicle এর driver info
//             select: {
//               id: true,
//               fullName: true,
//               email: true,
//               phoneNumber: true,
//               profileImage: true,
//               location: true,
//             },
//           },
//         },
//       },
//     },
//   });

//   // প্রতিটি ride-এর জন্য nearby drivers calculate করো
//   const ridesWithNearby = await Promise.all(
//     rides.map(async (ride) => {
//       let nearbyDrivers: any[] = [];

//       if (ride.pickupLat && ride.pickupLng) {
//         const drivers = await findNearbyDrivers(ride.pickupLat, ride.pickupLng);
//         nearbyDrivers = drivers.map((driver) => ({
//           id: driver.id,
//           fullName: driver.fullName,
//           phone: driver.phone,
//           profileImage: driver.profileImage,
//           lat: driver.lat,
//           lng: driver.lng,
//           distance: calculateDistance(ride.pickupLat!, ride.pickupLng!, driver.lat!, driver.lng!),
//         }));
//       }

//       return {
//         ...ride,
//         nearbyDrivers,
//       };
//     })
//   );

//   return ridesWithNearby;
// };

// const updateUserCountStats = async (userId: string) => {
//   const stats = await prisma.carTransport.aggregate({
//     where: { userId: userId, status: TransportStatus.COMPLETED },
//     _count: { id: true }
//   });
// //   console.log("Stats result:", stats);

//   const updateUser=await prisma.user.update({
//     where: { id: userId },
//     data: {

//       totalRides: stats._count.id,
//     },
//   });
// //   console.log("Updated user:", updateUser);
// };

// শুধু count বের করার service

const getMyRides = async (userId: string, role: UserRole) => {
  let rides = [];

  if (role === "RIDER") {
    // Rider হলে userId ব্যবহার করবো
    rides = await prisma.carTransport.findMany({
      where: { userId, status: TransportStatus.COMPLETED },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profileImage: true,
            location: true,
            lat: true,
            lng: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            manufacturer: true,
            model: true,
            licensePlateNumber: true,
            // bh: true,
            // refferalCode: true,
            image: true,
            color: true,
            driver: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phoneNumber: true,
                profileImage: true,
                location: true,
              },
            },
          },
        },
      },
    });

    // nearby driver শুধু rider এর জন্য
    const ridesWithNearby = await Promise.all(
      rides.map(async (ride) => {
        let nearbyDrivers: any[] = [];

        if (ride.pickupLat && ride.pickupLng) {
          const drivers = await findNearbyDrivers(
            ride.pickupLat,
            ride.pickupLng
          );
          nearbyDrivers = drivers.map((driver) => ({
            id: driver.id,
            fullName: driver.fullName,
            phone: driver.phone,
            profileImage: driver.profileImage,
            lat: driver.lat,
            lng: driver.lng,
            distance: calculateDistance(
              ride.pickupLat!,
              ride.pickupLng!,
              driver.lat!,
              driver.lng!
            ),
          }));
        }

        return {
          ...ride,
          nearbyDrivers,
        };
      })
    );

    return ridesWithNearby;
  }

  if (role === "DRIVER") {
    // Driver হলে assignedDriver দিয়ে match করবো
    rides = await prisma.carTransport.findMany({
      where: { assignedDriver: userId, status: TransportStatus.COMPLETED },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profileImage: true,
            location: true,
            lat: true,
            lng: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            manufacturer: true,
            model: true,
            licensePlateNumber: true,
            // bh: true,
            // refferalCode: true,
            image: true,
            color: true,
            driver: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phoneNumber: true,
                profileImage: true,
                location: true,
              },
            },
          },
        },
      },
    });

    return rides;
  }

  return [];
};

const getMyPendingRides = async (userId: string, role: UserRole) => {
  let rides = [];

  if (role === "RIDER") {
    // Rider হলে userId ব্যবহার করবো
    rides = await prisma.carTransport.findMany({
      where: { userId, status: TransportStatus.PENDING },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profileImage: true,
            location: true,
            lat: true,
            lng: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            manufacturer: true,
            model: true,
            licensePlateNumber: true,
            // bh: true,
            // refferalCode: true,
            image: true,
            color: true,
            driver: {
              select: {
                id: true,
                fullName: true,
                email: true,
                referralCode:true,
                phoneNumber: true,
                profileImage: true,
                location: true,
                totalTrips:true,
                averageRating:true,
                reviewCount:true,
              },
            },
          },
        },
      },
    });

    // nearby driver শুধু rider এর জন্য
    /* const ridesWithNearby = await Promise.all(
      rides.map(async (ride) => {
        let nearbyDrivers: any[] = [];

        if (ride.pickupLat && ride.pickupLng) {
          const drivers = await findNearbyDrivers(
            ride.pickupLat,
            ride.pickupLng
          );
          nearbyDrivers = drivers.map((driver) => ({
            id: driver.id,
            fullName: driver.fullName,
            phone: driver.phone,
            profileImage: driver.profileImage,
            lat: driver.lat,
            lng: driver.lng,
            distance: calculateDistance(
              ride.pickupLat!,
              ride.pickupLng!,
              driver.lat!,
              driver.lng!
            ),
          }));
        }

        return {
          ...ride,
          nearbyDrivers,
        };
      })
    );

    return ridesWithNearby; */
  return rides
  }

  if (role === "DRIVER") {
    // Driver হলে assignedDriver দিয়ে match করবো
    rides = await prisma.carTransport.findMany({
      where: { assignedDriver: userId, status: TransportStatus.PENDING },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profileImage: true,
            location: true,
            lat: true,
            lng: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            manufacturer: true,
            model: true,
            licensePlateNumber: true,
            // bh: true,
            // refferalCode: true,
            image: true,
            color: true,
            driver: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phoneNumber: true,
                profileImage: true,
                location: true,
              },
            },
          },
        },
      },
    });

    return rides;
  }

  return [];
};

const getRideHistory = async (userId: string, role: UserRole) => {
  let rides: any[] = [];

  if (role === "RIDER") {
    rides = await prisma.carTransport.findMany({
      where: {
        userId,
        status: {
          in: [TransportStatus.CANCELLED], // rider history
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profileImage: true,
            location: true,
            lat: true,
            lng: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            manufacturer: true,
            model: true,
            licensePlateNumber: true,
            // bh: true,
            // refferalCode: true,
            image: true,
            color: true,
            driver: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phoneNumber: true,
                profileImage: true,
                location: true,
              },
            },
          },
        },
      },
    });
  }

  if (role === "DRIVER") {
    rides = await prisma.carTransport.findMany({
      where: {
        assignedDriver: userId,
        status: {
          in: [TransportStatus.CANCELLED], // driver history
          // in: [TransportStatus.COMPLETED, TransportStatus.CANCELLED], // driver history
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profileImage: true,
            location: true,
            lat: true,
            lng: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            manufacturer: true,
            model: true,
            licensePlateNumber: true,
            // bh: true,
            // refferalCode: true,
            image: true,
            color: true,
            driver: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phoneNumber: true,
                profileImage: true,
                location: true,
              },
            },
          },
        },
      },
    });
  }

  return rides; // ✅ always return rides
};

const getDriverIncome = async (
  userToken: string,
  filters: IDriverJobFilters
): Promise<IDriverIncomeResponse> => {
  // Decode token to get driverId
  const decodedToken = jwtHelpers.verifyToken(
    userToken,
    config.jwt.jwt_secret!
  );

  //  Driver-only check
  if (decodedToken.role !== "DRIVER") {
    throw new ApiError(httpStatus.FORBIDDEN, "Not authorized: driver only");
  }

  const {
    startDate,
    endDate,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = filters;

  const skip = (page - 1) * limit;

  // Build where conditions
  const whereConditions: Prisma.CarTransportWhereInput = {
    assignedDriver: decodedToken.id,
    assignedDriverReqStatus: "ACCEPTED",
    status: TransportStatus.COMPLETED,
    paymentStatus: PaymentStatus.COMPLETED,
  };

  if (startDate && endDate) {
    whereConditions.createdAt = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  // 🔹 Aggregate stats (income, distance, duration)
  const stats = await prisma.carTransport.aggregate({
    where: whereConditions,
    _sum: {
      distance: true,
      totalAmount: true,
      rideTime: true,
    },
    _count: {
      id: true,
    },
  });

  // 🔹 Fetch paginated transactions
  const transactions = await prisma.carTransport.findMany({
    where: whereConditions,
    select: {
      id: true,
      totalAmount: true,
      distance: true,
      rideTime: true,
      serviceType: true,
      status: true,
      paymentStatus: true,
      assignedDriverReqStatus: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          fullName: true,
          profileImage: true,
        },
      },
      vehicle: {
        select: {
          id: true,
          manufacturer: true,
          model: true,
          // licensePlateNumber: true,
          driver: {
            select: {
              id: true,
              fullName: true,
              phoneNumber: true,
              profileImage: true,
            },
          },
        },
      },
    },
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
  });
  // format distance for each transaction
  const formattedTransactions = transactions.map((t) => ({
    ...t,
    distance: t.distance ? parseFloat(t.distance.toFixed(2)) : 0,
  }));
  const total = await prisma.carTransport.count({
    where: whereConditions,
  });

  return {
    totalIncome: stats._sum.totalAmount || 0,
    totalDistance: stats._sum.distance
      ? parseFloat(stats._sum.distance.toFixed(2))
      : 0,
    totalDuration: stats._sum.rideTime || 0,
    totalTrips: stats._count.id || 0,
    transactions: {
      meta: {
        page,
        limit,
        total,
      },
      data: transactions,
    },
  };
};

// const getMyRidesOrTripsCount = async (userId: string, role: "RIDER" | "DRIVER") => {
//   if (role === "RIDER") {
//     // Rider এর completed rides count
//     const totalRides = await prisma.carTransport.count({
//       where: {
//         userId,
//         status: TransportStatus.COMPLETED,
//       },
//     });

//     await prisma.user.update({
//       where: { id: userId },
//       data: { totalRides },
//     });

//     return { totalRides };
//   }

//   if (role === "DRIVER") {
//     // Driver এর completed trips count
//     const totalTrips = await prisma.carTransport.count({
//       where: {
//         assignedDriver: userId, // Driver assign করা হয়েছে যেটাতে
//         status: TransportStatus.COMPLETED,
//       },
//     });

//     await prisma.user.update({
//       where: { id: userId },
//       data: { totalTrips },
//     });

//     return { totalTrips };
//   }

//   return { totalRides: 0, totalTrips: 0 };
// };

const getMyRidesOrTripsCount = async (
  userId: string,
  role: "RIDER" | "DRIVER"
) => {
  if (role === "RIDER") {
    // Rider stats
    const riderStats = await prisma.carTransport.aggregate({
      where: {
        userId,
        status: TransportStatus.COMPLETED,
        paymentStatus: PaymentStatus.COMPLETED,
      },
      _count: { id: true },
      _sum: {
        distance: true,
      },
    });

    const totalRides = riderStats._count.id || 0;
    const totalDistance = riderStats._sum.distance
      ? parseFloat(riderStats._sum.distance.toFixed(2))
      : 0;

    await prisma.user.update({
      where: { id: userId },
      data: { totalRides, totalDistance },
    });

    return { totalRides, totalDistance };
  }

  if (role === "DRIVER") {
    // Driver stats
    const driverStats = await prisma.carTransport.aggregate({
      where: {
        assignedDriver: userId,
        status: TransportStatus.COMPLETED,
        paymentStatus: PaymentStatus.COMPLETED,
      },
      _count: { id: true },
      _sum: {
        distance: true,
      },
    });

    const totalTrips = driverStats._count.id || 0;
    const totalDistance = driverStats._sum.distance
      ? parseFloat(driverStats._sum.distance.toFixed(2))
      : 0;

    await prisma.user.update({
      where: { id: userId },
      data: { totalTrips, totalDistance },
    });

    return { totalTrips, totalDistance };
  }

  return { totalRides: 0, totalTrips: 0, totalDistance: 0 };
};

const getAllCarTransports = async (
  filters: ICarTransportFilters,
  options: IPaginationOptions
): Promise<IGenericResponse<CarTransport[]>> => {
  const { searchTerm, status, paymentStatus, ...filterData } = filters;
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const andConditions: Prisma.CarTransportWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: [
        {
          pickupLocation: {
            contains: searchTerm,
            mode: Prisma.QueryMode.insensitive,
          },
        },
        {
          dropOffLocation: {
            contains: searchTerm,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      ],
    });
  }

  if (status) {
    andConditions.push({
      status: status as TransportStatus,
    });
  }

  // if (serviceType) {
  //   andConditions.push({
  //     serviceType: serviceType as ServiceType,
  //   });
  // }

  if (paymentStatus) {
    andConditions.push({
      paymentStatus: paymentStatus as PaymentStatus,
    });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: {
          equals: (filterData as any)[key],
        },
      })),
    });
  }

  const whereConditions: Prisma.CarTransportWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.carTransport.findMany({
    where: whereConditions,
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNumber: true,
          profileImage: true,
          location: true,
          lat: true,
          lng: true,
        },
      },
      vehicle: {
        select: {
          id: true,
          manufacturer: true,
          model: true,
          licensePlateNumber: true,
          // bh: true,
          // refferalCode: true,
          image: true,
          color: true,
          driver: {
            // vehicle এর driver info
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true,
              profileImage: true,
              location: true,
            },
          },
        },
      },
    },
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
  });

  const total = await prisma.carTransport.count({
    where: whereConditions,
  });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

// const getCarTransportById = async (
//   id: string
// ): Promise<CarTransport | null> => {
//   const result = await prisma.carTransport.findUnique({
//     where: {
//       id,
//     },
//     include: {
//       user: {
//         select: {
//           id: true,
//           fullName: true,
//           email: true,
//           profileImage: true,
//           location: true,
//           lat: true,
//           lng: true,
//         },
//       },
//       vehicle: true,
//     },
//   });

//   if (!result) {
//     return null;
//   }

//   // Fetch nearby technicians for this transport
//   let nearbyTechsFromPickup: User[] = [];
//   let nearbyTechsFromUser: User[] = [];

//   // Only search near pickup location if coordinates exist
//   if (result.pickupLat && result.pickupLng) {
//     nearbyTechsFromPickup = await findNearbyTechnicians(
//       result.pickupLat,
//       result.pickupLng
//     );
//   }

//   // Only search near user location if coordinates exist
//   if (result.user.lat && result.user.lng) {
//     nearbyTechsFromUser = await findNearbyTechnicians(
//       result.user.lat,
//       result.user.lng
//     );
//   }

//   // Combine and remove duplicates
//   const allNearbyTechs = [...nearbyTechsFromPickup, ...nearbyTechsFromUser];
//   const uniqueTechs = Array.from(
//     new Map(allNearbyTechs.map((tech) => [tech.id, tech])).values()
//   );

//   // Add recommended technicians data to the transport object
//   const transportWithTechnicians = {
//     ...result,
//     recommendedTechnicians: uniqueTechs.map((tech) => ({
//       id: tech.id,
//       fullName: tech.fullName,
//       phone: tech.phone,
//       profileImage: tech.profileImage,
//       location: tech.location,
//       gender: tech.gender,
//       dob: tech.dob,
//       licenseFrontSide: tech.licenseFrontSide,
//       licenseBackSide: tech.licenseBackSide,
//       distanceFromPickup:
//         result.pickupLat && result.pickupLng
//           ? calculateDistance(
//               result.pickupLat,
//               result.pickupLng,
//               tech.lat || 0,
//               tech.lng || 0
//             )
//           : null,
//       distanceFromUser:
//         result.user.lat && result.user.lng
//           ? calculateDistance(
//               result.user.lat,
//               result.user.lng,
//               tech.lat || 0,
//               tech.lng || 0
//             )
//           : null,
//     })),
//   };

//   return transportWithTechnicians;
// };

const getRideStatusById = async (id: string) => {
  const result = await prisma.carTransport.findUnique({
    where: {
      id,
    },

    select: {
      arrivalConfirmation: true,
      journeyStarted: true,
      journeyCompleted: true,
    },
    // include: {
    //   user: {
    //     select: {
    //       id: true,
    //       fullName: true,
    //       email: true,
    //       profileImage: true,
    //       location: true,
    //       lat: true,
    //       lng: true,
    //     },
    //   },
    //   vehicle: true,
    // },
  });

  return result;
};

// const assignDriver = async (payload: IAssignDriverReq) => {
//   const { carTransportId, driverId } = payload;

//   // Check if car transport exists
//   const transport = await prisma.carTransport.findUnique({
//     where: { id: carTransportId },
//   });

//   if (!transport) {
//     throw new ApiError(httpStatus.NOT_FOUND, "Car transport request not found");
//   }

//   // Check if driver exists and is active
//   const driver = await prisma.user.findFirst({
//     where: {
//       id: driverId,
//       role: UserRole.DRIVER,
//       status: "ACTIVE",
//     },
//   });

//   if (!driver) {
//     throw new ApiError(httpStatus.NOT_FOUND, "Driver not found or not active");
//   }

//   // Update car transport with assigned driver
//   const result = await prisma.carTransport.update({
//     where: { id: carTransportId },
//     data: {
//       assignedDriver: driverId,
//       assignedDriverReqStatus: "PENDING",
//       isDriverReqCancel: false,
//     },
//     include: {
//       user: {
//         select: {
//           id: true,
//           fullName: true,
//           email: true,
//           profileImage: true,
//           location: true,
//           lat: true,
//           lng: true,
//         },
//       },
//       vehicle: true,
//     },
//   });

//   return result;
// };

const assignDriver = async (payload: IAssignDriverReq) => {
  const { carTransportId, driverId } = payload;

  const transport = await prisma.carTransport.findUnique({
    where: { id: carTransportId },
  });
  if (!transport) {
    throw new ApiError(httpStatus.NOT_FOUND, "Car transport request not found");
  }

  const driver = await prisma.user.findFirst({
    where: {
      id: driverId,
      role: UserRole.DRIVER,
      status: "ACTIVE",
      adminApprovedStatus: "APPROVED", // ✅ new condition
    },
  });
  if (!driver) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "Driver not found, not active, or not admin approved"
    );
  }

  const result = await prisma.carTransport.update({
    where: { id: carTransportId },
    data: {
      assignedDriver: driverId,
      assignedDriverReqStatus: "PENDING",
      isDriverReqCancel: false,
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImage: true,
          location: true,
          lat: true,
          lng: true,
        },
      },
      vehicle: {
        select: {
          id: true,
          manufacturer: true,
          model: true,
          licensePlateNumber: true,
          // bh: true,
          // refferalCode: true,
          image: true,
          color: true,
          driver: {
            // vehicle এর driver info
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true,
              profileImage: true,
              location: true,
            },
          },
        },
      },
    },
  });

  return result;
};

const handleDriverResponse = async (
  userToken: string,
  payload: IDriverResponseReq
) => {
  const { carTransportId, response } = payload;

  // ✅ Verify the driver from token
  const decodedToken = jwtHelpers.verifyToken(
    userToken,
    config.jwt.jwt_secret!
  );

  // ✅ Check if car transport is assigned to this driver
  const transport = await prisma.carTransport.findFirst({
    where: {
      id: carTransportId,
      assignedDriver: decodedToken.id,
    },
  });

  if (!transport) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "Car transport request not found or not assigned to you"
    );
  }

  if (transport.assignedDriverReqStatus !== "PENDING") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You have already responded to this request"
    );
  }

  // ✅ Update transport based on driver's response
  const result = await prisma.carTransport.update({
    where: { id: carTransportId },
    data: {
      assignedDriverReqStatus: response, // ACCEPTED / DECLINED
      isDriverReqCancel: response === "DECLINED",
      status:
        response === "ACCEPTED"
          ? TransportStatus.ONGOING
          : // : TransportStatus.PENDING,
            TransportStatus.CANCELLED,
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImage: true,
          location: true,
          lat: true,
          lng: true,
        },
      },
      vehicle: {
        select: {
          id: true,
          manufacturer: true,
          model: true,
          licensePlateNumber: true,
          // bh: true,
          // refferalCode: true,
          image: true,
          color: true,
          driver: {
            // vehicle এর driver info
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true,
              profileImage: true,
              location: true,
            },
          },
        },
      },
    },
  });

  return result;
};

const confirmArrival = async (
  userToken: string,
  payload: IConfirmArrivalReq
) => {
  const decodedToken = jwtHelpers.verifyToken(
    userToken,
    config.jwt.jwt_secret!
  );
  const { carTransportId } = payload;

  // Check if transport exists and is assigned to this driver
  const transport = await prisma.carTransport.findFirst({
    where: {
      id: carTransportId,
      assignedDriver: decodedToken.id,
      assignedDriverReqStatus: "ACCEPTED",
      arrivalConfirmation: false,
    },
  });

  if (!transport) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "Car transport request not found or not eligible for arrival confirmation"
    );
  }

  const result = await prisma.carTransport.update({
    where: { id: carTransportId },
    data: {
      arrivalConfirmation: true,
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImage: true,
          location: true,
          lat: true,
          lng: true,
        },
      },
      vehicle: {
        select: {
          id: true,
          manufacturer: true,
          model: true,
          licensePlateNumber: true,
          // bh: true,
          // refferalCode: true,
          image: true,
          color: true,
          driver: {
            // vehicle এর driver info
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true,
              profileImage: true,
              location: true,
            },
          },
        },
      },
    },
  });

  return result;
};

const startJourney = async (userToken: string, payload: IStartJourneyReq) => {
  const decodedToken = jwtHelpers.verifyToken(
    userToken,
    config.jwt.jwt_secret!
  );
  const { carTransportId } = payload;

  // Check if transport exists and driver has confirmed arrival
  const transport = await prisma.carTransport.findFirst({
    where: {
      id: carTransportId,
      assignedDriver: decodedToken.id,
      assignedDriverReqStatus: "ACCEPTED",
      arrivalConfirmation: true,
      journeyStarted: false,
    },
  });

  if (!transport) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "Car transport request not found or not eligible to start journey"
    );
  }

  const result = await prisma.carTransport.update({
    where: { id: carTransportId },
    data: {
      journeyStarted: true,
      status: TransportStatus.ONGOING,
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImage: true,
          location: true,
          lat: true,
          lng: true,
        },
      },
      vehicle: {
        select: {
          id: true,
          manufacturer: true,
          model: true,
          licensePlateNumber: true,
          // bh: true,
          // refferalCode: true,
          image: true,
          color: true,
          driver: {
            // vehicle এর driver info
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true,
              profileImage: true,
              location: true,
            },
          },
        },
      },
    },
  });

  return result;
};

const completeJourney = async (
  userToken: string,
  payload: ICompleteJourneyReq
  // files: any[]
) => {
  const decodedToken = jwtHelpers.verifyToken(
    userToken,
    config.jwt.jwt_secret!
  );
  const { carTransportId } = payload;

  // Check if transport exists and journey is started
  const transport = await prisma.carTransport.findFirst({
    where: {
      id: carTransportId,
    },
  });

  if (!transport) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "Car transport request not found or not eligible for completion"
    );
  }

  // Upload after pickup images
  // const uploadedImages = await Promise.all(
  //   files.map((file) => fileUploader.uploadToDigitalOcean(file))
  // );

  const result = await prisma.carTransport.update({
    where: { id: carTransportId },
    data: {
      journeyCompleted: true,
      status: TransportStatus.COMPLETED,
      // afterPickupImages: uploadedImages.map((img) => img.Location),
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImage: true,
          location: true,
          lat: true,
          lng: true,
        },
      },
      vehicle: {
        select: {
          id: true,
          manufacturer: true,
          model: true,
          licensePlateNumber: true,
          // bh: true,
          // refferalCode: true,
          image: true,
          color: true,
          driver: {
            // vehicle এর driver info
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true,
              profileImage: true,
              location: true,
            },
          },
        },
      },
    },
  });

  return result;
};

export const carTransportService = {
  planCarTransport,
  getMyRidePlans,
  getRidePlanById,
  createCarTransport,
  cancelRide,
  getRideDetailsById,
  getCompletedRideFromDb,
  getNewCarTransportsReq,
  getCarTransportById,
  getMyRides,
  getMyPendingRides,
  getDriverIncome,
  getRideHistory,
  getMyRidesOrTripsCount,
  getAllCarTransports,
  getRideStatusById,
  assignDriver,
  handleDriverResponse,
  confirmArrival,
  startJourney,
  completeJourney,
  // getListFromDb,
  // getByIdFromDb,
  // updateIntoDb,
  // deleteItemFromDb,
};
