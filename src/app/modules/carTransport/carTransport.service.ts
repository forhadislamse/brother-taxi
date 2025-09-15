import httpStatus from "http-status";
import { fileUploader } from "../../../helpars/fileUploader";
import { jwtHelpers } from "../../../helpars/jwtHelpers";
import config from "../../../config";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import { calculateDistance } from "../../../shared/calculateDistance";
import { findNearbyDrivers } from "../../../shared/findNearByDrivers";
import { CarTransport, PaymentStatus, Prisma, TransportStatus, UserRole } from "@prisma/client";
import { paginationHelper } from "../../../helpars/paginationHelper";
import { IGenericResponse } from "../vehicle/vehicle.interface";
import { IPaginationOptions } from "../../../interfaces/paginations";
import { IAssignDriverReq, ICarTransportFilters, IConfirmArrivalReq, IDriverResponseReq } from "./carTransport.interface";

// async function calculateFareFromConfig(distance: number) {
//   const activeFare = await prisma.fare.findFirst({
//     where: { isActive: true },
//     orderBy: { createdAt: "desc" },
//   });
//   if (!activeFare) throw new Error("Active Fare not found");

//   const basePrice = activeFare.baseFare; // 40
//   const perKm = activeFare.costPerKm; // 10
//   console.log(basePrice, perKm, distance);

//   return basePrice + perKm * distance;
// }

// // Service function
// export const createCarTransport = async (token: string, payload: any, files: any[]) => {
//   // 1️⃣ Token decode (userId বের করা)
//   const decodedToken = jwtHelpers.verifyToken(token, config.jwt.jwt_secret!);
//   const userId = decodedToken.id;

//   // 2️⃣ Vehicle check
//   const vehicle = await prisma.vehicle.findUnique({
//     where: { id: payload.vehicleId },
//   });
//   if (!vehicle) throw new Error("Vehicle not found");

//   // 3️⃣ Distance calculation
//   const distance = calculateDistance(
//     payload.pickupLat,
//     payload.pickupLng,
//     payload.dropOffLat,
//     payload.dropOffLng
//   );

//   // 4️⃣ Fare calculation
//   const totalAmount = await calculateFareFromConfig(distance);

//   // 5️⃣ Image upload
//   const uploadedImages = await Promise.all(
//     files.map((file) => fileUploader.uploadToDigitalOcean(file))
//   );

//   // 6️⃣ DB create
//   const carTransport = await prisma.carTransport.create({
//     data: {
//       ...payload,
//       userId,
//       totalAmount,
//       beforePickupImages: uploadedImages.map((img) => img.Location),
//       // driverLat/driverLng দিয়ে কিছু পাঠাবেন না
//     },
//   });

//   return carTransport;
// };

// const getListFromDb = async () => {

//     const result = await prisma.carTransport.findMany();
//     return result;
// };

// const getByIdFromDb = async (id: string) => {

//     const result = await prisma.carTransport.findUnique({ where: { id } });
//     if (!result) {
//       throw new Error('CarTransport not found');
//     }
//     return result;
//   };

// const updateIntoDb = async (id: string, data: any) => {
//   const transaction = await prisma.$transaction(async (prisma) => {
//     const result = await prisma.carTransport.update({
//       where: { id },
//       data,
//     });
//     return result;
//   });

//   return transaction;
// };

// const deleteItemFromDb = async (id: string) => {
//   const transaction = await prisma.$transaction(async (prisma) => {
//     const deletedItem = await prisma.carTransport.delete({
//       where: { id },
//     });

//     // Add any additional logic if necessary, e.g., cascading deletes
//     return deletedItem;
//   });

//   return transaction;
// };

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

// Service function
// const createCarTransport = async (
//   token: string,
//   payload: any,
//   files: any[]
// ) => {
//   const decodedToken = jwtHelpers.verifyToken(token, config.jwt.jwt_secret!);
//   const userId = decodedToken.id;

//   const vehicle = await prisma.vehicle.findUnique({
//     where: { id: payload.vehicleId },
//   });
//   if (!vehicle) throw new Error("Vehicle not found");

//   // 1️⃣ Distance (Haversine বা Google API)
//   const distance = calculateDistance(
//     payload.pickupLat,
//     payload.pickupLng,
//     payload.dropOffLat,
//     payload.dropOffLng
//   );

//   // 2️⃣ Ride time (Google Distance Matrix API দিয়ে পাওয়া যাবে)
//   // const rideTime = payload.rideTime || 20; // মিনিট (dummy/default রাখলাম)
// // const rideTime = payload.rideTime ? Number(payload.rideTime) : 20;
//   // 3️⃣ Waiting time (pickup point এ driver কতক্ষণ অপেক্ষা করেছে)
  
//   const waitingTime = payload.waitingTime ? Number(payload.waitingTime) : 0;
// const rideTime = payload.rideTime ? Number(payload.rideTime) : 20;


//   // 4️⃣ Fare calculate
//   const { totalFare } = await calculateFareFromConfig(
//     distance,
//     rideTime,
//     waitingTime
//   );

//   // 5️⃣ Image upload
//   const uploadedImages = await Promise.all(
//     files.map((file) => fileUploader.uploadToDigitalOcean(file))
//   );

//   // 6️⃣ DB save
//   const carTransport = await prisma.carTransport.create({
//     data: {
//       ...payload,
//       userId,
//       totalAmount: totalFare,
//       beforePickupImages: uploadedImages.map((img) => img.Location),
//     },
//   });

//   return carTransport;
// };

// const createCarTransport = async (
//   token: string,
//   payload: any,
//   files: any[]
// ) => {
//   const decodedToken = jwtHelpers.verifyToken(token, config.jwt.jwt_secret!);
//   const userId = decodedToken.id;

//   const vehicle = await prisma.vehicle.findUnique({
//     where: { id: payload.vehicleId },
//   });
//   if (!vehicle) throw new Error("Vehicle not found");

//   // 1️⃣ Distance calculate
//   const distance = calculateDistance(
//     payload.pickupLat,
//     payload.pickupLng,
//     payload.dropOffLat,
//     payload.dropOffLng
//   );

//   // 2️⃣ Ride time & waiting time
//   const rideTime = payload.rideTime ? Number(payload.rideTime) : 20;
//   const waitingTime = payload.waitingTime ? Number(payload.waitingTime) : 0;

//   // 3️⃣ Fare calculate
//   const { totalFare } = await calculateFareFromConfig(
//     distance,
//     rideTime,
//     waitingTime
//   );

//   // 4️⃣ Image upload
//   const uploadedImages = await Promise.all(
//     files.map((file) => fileUploader.uploadToDigitalOcean(file))
//   );

//   // 5️⃣ Save ride in DB
//   const carTransport = await prisma.carTransport.create({
//     data: {
//       ...payload,
//       userId,
//       totalAmount: totalFare,
//       beforePickupImages: uploadedImages.map((img) => img.Location),
//     },
//   });

//   // 6️⃣ Nearby drivers খুঁজে বের করা
//   let nearbyDrivers: any[] = [];
//   if (payload.pickupLat && payload.pickupLng) {
//     nearbyDrivers = await findNearbyDrivers(payload.pickupLat, payload.pickupLng);
//   }

//   // 7️⃣ Return ride + nearby drivers
//   return {
//     ride: carTransport,
//     nearbyDrivers: nearbyDrivers.map((driver) => ({
//       id: driver.id,
//       fullName: driver.fullName,
//       phone: driver.phone,
//       profileImage: driver.profileImage,
//       lat: driver.lat,
//       lng: driver.lng,
//       distance: calculateDistance(
//         payload.pickupLat,
//         payload.pickupLng,
//         driver.lat!,
//         driver.lng!
//       ),
//     })),
//   };
// };

const createCarTransport = async (token: string, payload: any, files: any[]) => {
  const decodedToken = jwtHelpers.verifyToken(token, config.jwt.jwt_secret!);
  const userId = decodedToken.id;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: payload.vehicleId },
  });
  if (!vehicle) throw new Error("Vehicle not found");

  // Distance
  const distance = calculateDistance(payload.pickupLat, payload.pickupLng, payload.dropOffLat, payload.dropOffLng);

  // Ride time & waiting time
  const rideTime = payload.rideTime ? Number(payload.rideTime) : 20;
  const waitingTime = payload.waitingTime ? Number(payload.waitingTime) : 0;

  // Fare
  const { totalFare } = await calculateFareFromConfig(distance, rideTime, waitingTime);

  // Upload images
  const uploadedImages = await Promise.all(files.map(file => fileUploader.uploadToDigitalOcean(file)));

  // Save ride
  const carTransport = await prisma.carTransport.create({
    data: {
      ...payload,
      userId,
      totalAmount: totalFare,
      beforePickupImages: uploadedImages.map(img => img.Location),
    },
  });

  // Find nearby drivers
  let nearbyDrivers: any[] = [];
  if (payload.pickupLat && payload.pickupLng) {
    nearbyDrivers = await findNearbyDrivers(payload.pickupLat, payload.pickupLng);
  }

  // Return ride + nearby drivers
  return {
    ride: carTransport,
    nearbyDrivers: nearbyDrivers.map(driver => ({
      id: driver.id,
      fullName: driver.fullName,
      phone: driver.phone,
      profileImage: driver.profileImage,
      lat: driver.lat,
      lng: driver.lng,
      distance: calculateDistance(payload.pickupLat, payload.pickupLng, driver.lat!, driver.lng!),
    })),
  };
};


const cancelRide = async (userId: string, rideId: string, cancelReason: string) => {
  const ride = await prisma.carTransport.findUnique({ where: { id: rideId } });

  if (!ride) throw new ApiError(httpStatus.NOT_FOUND, "Ride not found");
  if (ride.userId !== userId)
    throw new ApiError(httpStatus.FORBIDDEN, "You cannot cancel this ride");

  return await prisma.carTransport.update({
    where: { id: rideId },
    data: {
      status: "CANCELLED",
      cancelReason,
    },
  });
}

const getRideDetailsById = async (rideId: string, ) => {
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
          bh: true,
          refferalCode: true,
          image: true,
          color: true,
          driver: { // vehicle এর driver info
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
}   


const getMyRides = async (userId: string) => {
  // প্রথমে ride গুলো fetch করো
  const rides = await prisma.carTransport.findMany({
    where: { userId },
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
          bh: true,
          refferalCode: true,
          image: true,
          color: true,
          driver: { // vehicle এর driver info
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

  // প্রতিটি ride-এর জন্য nearby drivers calculate করো
  const ridesWithNearby = await Promise.all(
    rides.map(async (ride) => {
      let nearbyDrivers: any[] = [];

      if (ride.pickupLat && ride.pickupLng) {
        const drivers = await findNearbyDrivers(ride.pickupLat, ride.pickupLng);
        nearbyDrivers = drivers.map((driver) => ({
          id: driver.id,
          fullName: driver.fullName,
          phone: driver.phone,
          profileImage: driver.profileImage,
          lat: driver.lat,
          lng: driver.lng,
          distance: calculateDistance(ride.pickupLat!, ride.pickupLng!, driver.lat!, driver.lng!),
        }));
      }

      return {
        ...ride,
        nearbyDrivers,
      };
    })
  );

  return ridesWithNearby;
};

// src/app/modules/carTransport/carTransport.service.ts

const getAllCarTransports = async (
  filters: ICarTransportFilters,
  options: IPaginationOptions
): Promise<IGenericResponse<CarTransport[]>> => {
  const { searchTerm, status, paymentStatus, ...filterData } =
    filters;
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
          bh: true,
          refferalCode: true,
          image: true,
          color: true,
          driver: { // vehicle এর driver info
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

const getRideStatusById = async (
  id: string
) => {
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
          bh: true,
          refferalCode: true,
          image: true,
          color: true,
          driver: { // vehicle এর driver info
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
          : TransportStatus.PENDING,
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
          bh: true,
          refferalCode: true,
          image: true,
          color: true,
          driver: { // vehicle এর driver info
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
          bh: true,
          refferalCode: true,
          image: true,
          color: true,
          driver: { // vehicle এর driver info
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
  createCarTransport,
  cancelRide,
  getRideDetailsById,
  getMyRides,
  getAllCarTransports,
  getRideStatusById,
  assignDriver,
  handleDriverResponse,
  confirmArrival,
  // getListFromDb,
  // getByIdFromDb,
  // updateIntoDb,
  // deleteItemFromDb,
};
