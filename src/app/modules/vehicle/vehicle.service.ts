import { AdminApprovedStatus, Prisma, Vehicle as VehicleInformation } from "@prisma/client";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import { jwtHelpers } from "../../../helpars/jwtHelpers";
import config from "../../../config";
import { paginationHelper } from "../../../helpars/paginationHelper";
import { vehicleSeachableableFields } from "./vehicle.constant";
import { IPaginationOptions } from "../../../interfaces/paginations";
import { IGenericResponse, IVehicleFilters } from "./vehicle.interface";
import { get } from "lodash";


// ✅ Step 1: Create Vehicle
// const createVehicle = async (userId: string, vehicleData: any) => {
//   const vehicle = await prisma.vehicle.create({
//     data: {
//       userId,
//       manufacturer: vehicleData.manufacturer,
//       model: vehicleData.model,
//       year: vehicleData.year,
//       color: vehicleData.color,
//       licensePlateNumber: vehicleData.licensePlateNumber,
//       bh: vehicleData.bh,
//       reversalCode: vehicleData.reversalCode,
//     },
//   });

//   return vehicle;
// };
// const createVehicle = async (
//   userToken: string,
//   payload: ICreateVehicle
// ): Promise<VehicleInformation> => {
//   const decodedToken = jwtHelpers.verifyToken(
//     userToken,
//     config.jwt.jwt_secret!
//   );

//   // Check if user exists
//   const existingUser = await prisma.user.findUnique({
//     where: {
//       id: decodedToken.id,
//     },
//   });

//   if (!existingUser) {
//     throw new ApiError(httpStatus.NOT_FOUND, "User not found");
//   }

//   const result = await prisma.vehicleInformation.create({
//     data: {
//       ...payload,
//       userId: decodedToken.id,
//     },
//   });
//   return result;
// };

const createVehicle = async (
  userToken: string,
  payload: any
): Promise<any> => {
  const decodedToken = jwtHelpers.verifyToken(
    userToken,
    config.jwt.jwt_secret!
  );

  // Check user exists
  const existingUser = await prisma.user.findUnique({
    where: { id: decodedToken.id },
  });

  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

 // Check if user is a DRIVER
  if (existingUser.role !== "DRIVER") {
    throw new ApiError(httpStatus.FORBIDDEN, "Only drivers can create vehicles");
  }

  // Check if driver is approved by admin
  // if (existingUser.adminApprovedStatus !== "APPROVED") {
  //   throw new ApiError(
  //     httpStatus.FORBIDDEN,
  //     "Driver is not approved by admin yet"
  //   );
  // }

  // Vehicle create
  const result = await prisma.vehicle.create({
    data: {
      ...payload,
      userId: decodedToken.id,
    },
  });

  return result;
};

const getAllVehicles = async (
  filters: IVehicleFilters,
  options: IPaginationOptions
): Promise<IGenericResponse<VehicleInformation[]>> => {
  const { searchTerm, ...filterData } = filters;
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const andConditions: any[] = [];

  // Search by text
  if (searchTerm) {
    andConditions.push({
      OR: vehicleSeachableableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  // Filter by other fields
  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: {
          equals: (filterData as any)[key],
        },
      })),
    });
  }

//   // Only include vehicles of drivers approved by admin
//   andConditions.push({
//     user: {
//       adminApprovedStatus: "APPROVED",
//     },
//   });

//   const whereConditions: Prisma.VehicleWhereInput =
//     andConditions.length > 0 ? { AND: andConditions } : {};

//   const result = await prisma.vehicle.findMany({
//     include: {
//       driver: {
//         select: {
//           id: true,
//           fullName: true,
//           email: true,
//           profileImage: true,
//         },
//       },
//     },
//     where: whereConditions,
//     skip,
//     take: limit,
//     orderBy: {
//       [sortBy]: sortOrder,
//     },
//   });

//   const total = await prisma.vehicle.count({
//     where: whereConditions,
//   });

//   return {
//     meta: {
//       page,
//       limit,
//       total,
//     },
//     data: result,
//   };
// };
// Prisma query
  const whereConditions = andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.vehicle.findMany({
    include: {
      driver: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImage: true,
          adminApprovedStatus: true,
          address: true,
          // licensePlate: true,
          // drivingLicense: true,
          licenseFrontSide: true,
          licenseBackSide: true,
        },
      },
    },
    where: {
      ...whereConditions,
      driver: {
        adminApprovedStatus: "APPROVED", // Only vehicles of approved drivers
      },
    },
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
  });

  const total = await prisma.vehicle.count({
    where: {
      ...whereConditions,
      driver: {
        adminApprovedStatus: "APPROVED",
      },
    },
  });

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: result,
  };

}

// const getUserVehicles = async (
//   userToken: string,
//   filters: IVehicleFilters,
//   options: IPaginationOptions
// ): Promise<IGenericResponse<VehicleInformation[]>> => {
//   // Decode JWT token
//   const decodedToken = jwtHelpers.verifyToken(
//     userToken,
//     config.jwt.jwt_secret!
//   );
//   const userId = decodedToken.id;

//   const { searchTerm } = filters;
//   const { page, limit, skip, sortBy, sortOrder } =
//     paginationHelper.calculatePagination(options);

//   const andConditions: any[] = [];

//   // Only the vehicles of the logged-in user
//   andConditions.push({ userId });

//   // Searchable fields
//   if (searchTerm) {
//     andConditions.push({
//       OR: vehicleSeachableableFields.map((field) => ({
//         [field]: {
//           contains: searchTerm,
//           mode: "insensitive",
//         },
//       })),
//     });
//   }

 
// const whereConditions = andConditions.length > 0 ? { AND: andConditions } : {};
//   // Fetch vehicles
//   const result = await prisma.vehicle.findMany({
//     include: {
//       driver: {
//         select: {
//           id: true,
//           fullName: true,
//           email: true,
//           profileImage: true,
//         },
//       },
//     },
//     where: whereConditions,
//     skip,
//     take: limit,
//     orderBy: {
//       [sortBy]: sortOrder,
//     },
//   });

//   // Total count
//   const total = await prisma.vehicle.count({
//     where: whereConditions,
//   });

//   return {
//     meta: {
//       page,
//       limit,
//       total,
//     },
//     data: result,
//   };
// };


// ✅ Step 2: Complete Driver Signup

const getUserVehicles = async (
  userToken: string,
  filters: IVehicleFilters,
  options: IPaginationOptions
): Promise<IGenericResponse<VehicleInformation[]>> => {
  const decodedToken = jwtHelpers.verifyToken(userToken, config.jwt.jwt_secret!);
  const userId = decodedToken.id;
  const { searchTerm } = filters;
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const whereConditions: Prisma.VehicleWhereInput = {
    userId,
    ...(searchTerm
      ? {
          OR: [
            { manufacturer: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
            { model: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
            { color: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
            { licensePlateNumber: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
            { bh: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
            // { refferalCode: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {}),
  };

  const result = await prisma.vehicle.findMany({
    where: whereConditions,
    include: {
      driver: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImage: true,
          // nidNumber: true,
          dob: true,
          gender: true,
          address: true,
          adminApprovedStatus: true,
          licenseFrontSide:true,
          licenseBackSide:true,

        },
      },
    },
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
  });

  const total = await prisma.vehicle.count({ where: whereConditions });

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: result,
  };
};

const getVehicleById = async (
  id: string
): Promise<VehicleInformation | null> => {
  const result = await prisma.vehicle.findUnique({
    where: {
      id,
    },
    include: {
      driver: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImage: true,
        },
      },
    },
  });

  return result;
};

const updateVehicle = async (
  userToken: string,
  vehicleId: string,
  payload: Partial<VehicleInformation>
): Promise<VehicleInformation> => {
  const decodedToken = jwtHelpers.verifyToken(userToken, config.jwt.jwt_secret!);

  // Check if vehicle exists and belongs to the user
  const existingVehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
  });

  if (!existingVehicle) {
    throw new ApiError(httpStatus.NOT_FOUND, "Vehicle not found");
  }

  if (existingVehicle.userId !== decodedToken.id) {
    throw new ApiError(httpStatus.FORBIDDEN, "You are not allowed to update this vehicle");
  }

  // Check if driver is approved
  const driver = await prisma.user.findUnique({ where: { id: decodedToken.id } });
  if (!driver || driver.adminApprovedStatus !== "APPROVED") {
    throw new ApiError(httpStatus.FORBIDDEN, "Driver not approved by admin");
  }

  // Update vehicle
  const updatedVehicle = await prisma.vehicle.update({
    where: { id: vehicleId },
    data: payload,
  });

  return updatedVehicle;
};


// const signupAsDriver = async (userId: string, driverData: any) => {
//   const updatedUser = await prisma.user.update({
//     where: { id: userId },
//     data: {
//       fullName: driverData.fullName,
//       dob: driverData.dob,
//     //   gender: driverData.gender,
//     gender: driverData.gender && driverData.gender.trim() !== "" 
//         ? driverData.gender 
//         : null,   // ✅ খালি থাকলে null হবে
//       nidNumber: driverData.nidNumber,
//       drivingLicense: driverData.drivingLicense,
//       licenseFrontSide: driverData.licenseFrontSide,
//       licenseBackSide: driverData.licenseBackSide,
//       address: driverData.address,
//       taxiManufacturer: driverData.taxiManufacturer,
//       bhNumber: driverData.bhNumber,
//       role: "DRIVER",
//       adminApprovedStatus:AdminApprovedStatus.PENDING, // Admin approval system
//     },
//     include: {
//       vehicles: true,
//     },
//   });

//   return updatedUser;
// };

// // ✅ Step 3: Get Driver Profile
// const getDriverProfile = async (userId: string) => {
//   const driverProfile = await prisma.user.findUnique({
//     where: { id: userId },
//     include: {
//       vehicles: true,
//       ridesAsDriver: true,
//       reviewsReceived: true,
//       wallet: true,
//     },
//   });

//   return driverProfile;
// };

export const driverService = {
  createVehicle,
  getAllVehicles,
  getUserVehicles,
  getVehicleById,
  // signupAsDriver,
  // getDriverProfile,
  updateVehicle,
};