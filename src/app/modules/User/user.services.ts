import {  AdminApprovedStatus, Gender, Prisma, User, UserRole, } from "@prisma/client";
import * as bcrypt from "bcrypt";
import httpStatus from "http-status";
import config from "../../../config";
import ApiError from "../../../errors/ApiErrors";
import { fileUploader } from "../../../helpars/fileUploader";
import prisma from "../../../shared/prisma";
import { jwtHelpers } from "../../../helpars/jwtHelpers";
import { IUser, IUserFilters } from "./user.interface";
import { Secret } from "jsonwebtoken";
import { generateOtp } from "../../../shared/getTransactionId";
import { sendMessage } from "../../../shared/sendMessage";
import { get, omit } from "lodash";




// const createUserIntoDb = async (payload: User) => {
//   // check existing user
//   const existingUser = await prisma.user.findFirst({
//     where: { phoneNumber: payload.phoneNumber },
//   });

//   if (existingUser) {
//     if (existingUser.isPhoneNumberVerify === false) {
//       // পুরানো unverified user মুছে ফেলবো
//       await prisma.user.delete({
//         where: { id: existingUser.id },
//       });
//     } else {
//       throw new ApiError(
//         httpStatus.BAD_REQUEST,
//         `User with this phone number ${payload.phoneNumber} already exists`
//       );
//     }
//   }

//   // otp generate
//   const otp = generateOtp(4);
//   const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

//   // dynamic data prepare
//   const data: any = {
//     phoneNumber: payload.phoneNumber,
//     role: payload.role,
//     otp,
//     otpExpiresAt: otpExpiry,
//   };

//   // optional email
//   if (payload.email && payload.email.trim() !== "") {
//     data.email = payload.email;
//   }

//   // optional password
//   if (payload.password && payload.password.trim() !== "") {
//     const hashedPassword = await bcrypt.hash(
//       payload.password,
//       Number(config.bcrypt_salt_rounds)
//     );
//     data.password = hashedPassword;
//   }

//   // user create
//   const newUser = await prisma.user.create({
//     data,
//     select: {
//       id: true,
//       phoneNumber: true,
//       role: true,
//       email: true,
//       otp: true,
//       createdAt: true,
//       updatedAt: true,
//     },
//   });

//   console.log("✅ User created with phone:", payload.phoneNumber);

//   // otp send
//   try {
//     const messageBody = `Here is your OTP code: ${otp}. It will expire in 5 minutes.`;
//     await sendMessage(messageBody, payload.phoneNumber);
//   } catch (error) {
//     console.error("❌ Failed to send OTP:", error);
//   }

//   return newUser;
// };



// // get user profile


const createUserIntoDb = async (payload: User) => {
  // check existing user
  let existingUser = await prisma.user.findFirst({
    where: { phoneNumber: payload.phoneNumber },
  });

  // otp generate
  const otp = generateOtp(4);
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

  let user;

  if (existingUser) {
    if (existingUser.isPhoneNumberVerify === false) {
      // পুরানো unverified user এর OTP update হবে
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          otp,
          otpExpiresAt: otpExpiry,
        },
        select: {
          id: true,
          phoneNumber: true,
          role: true,
          otp: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } else {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `User with this phone number ${payload.phoneNumber} already exists`
      );
    }
  } else {
    // একদম নতুন user create
    user = await prisma.user.create({
      data: {
        phoneNumber: payload.phoneNumber,
        role: payload.role,
        otp,
        otpExpiresAt: otpExpiry,
      },
      select: {
        id: true,
        phoneNumber: true,
        role: true,
        otp: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  console.log("✅ User created/updated with phone:", payload.phoneNumber);

  // otp send
  try {
    const messageBody = `Here is your OTP code: ${otp}. It will expire in 5 minutes.`;
    await sendMessage(messageBody, payload.phoneNumber);
  } catch (error) {
    console.error("❌ Failed to send OTP:", error);
  }

  return user;
};


const getMyProfile = async (userToken: string) => {
  const decodedToken = jwtHelpers.verifyToken(
    userToken,
    config.jwt.jwt_secret!
  );

  const userProfile = await prisma.user.findUnique({
    where: {
      id: decodedToken.id,
    }
  });

  return userProfile;
};

//get all users

const getAllUsers = async (filters: IUserFilters) => {
  const {
    searchTerm,
    status,
    role,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = filters;

  const skip = (page - 1) * limit;

  const whereConditions: Prisma.UserWhereInput = {
    NOT: { role: UserRole.ADMIN }, 
  };

  if (searchTerm) {
    whereConditions.OR = [
      { fullName: { contains: searchTerm, mode: "insensitive" } },
      { email: { contains: searchTerm, mode: "insensitive" } },
      { phoneNumber: { contains: searchTerm, mode: "insensitive" } }, // phone না phoneNumber
    ];
  }

  if (status) {
    whereConditions.adminApprovedStatus = status as AdminApprovedStatus;
  }

  if (role) {
    whereConditions.role = role as UserRole;
  }

  const total = await prisma.user.count({ where: whereConditions });

  const users = await prisma.user.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
    select: {
      id: true,
      email: true,
      fullName: true,
      phoneNumber: true,
      role: true,
      status: true,
      adminApprovedStatus: true,
      city: true,
      profileImage: true,
      isUserOnline: true,
      dob: true,
      licenseFrontSide: true,
      licenseBackSide: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: users,
  };
};

//get all users length for admin dashboard
const adminDashboardUserLength = async () => {
  const totalRiders = await prisma.user.count({
    where: {
      role: "RIDER",
    },
  });
  // const totalDrivers = await prisma.user.count({
  //   where: {
  //     NOT: {
  //       role: {
  //         in: ["ADMIN", "RIDER"], // Excluding Admin and User roles
  //       },
  //     },
  //   },
  // });
  const totalDrivers = await prisma.user.count({
    where: {
      role: "DRIVER",
      adminApprovedStatus: "APPROVED", // শুধু approved driver
    },
  });

  return {
    totalRiders,
    totalDrivers,
  };
};

const updateDriverLicense = async (
  userId: string,
  licenseFrontSide?: string,
  licenseBackSide?: string
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      licenseFrontSide: licenseFrontSide || user.licenseFrontSide,
      licenseBackSide: licenseBackSide || user.licenseBackSide,
      updatedAt: new Date(),
    },
  });

  return updatedUser;
};


const updateUserProfile = async (
  userId: string,
  updateData: Partial<IUser>,
  file?: Express.Multer.File
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");

  // File upload
  if (file) {
    const uploadedImageUrl = await fileUploader.uploadToDigitalOcean(file);
    updateData.profileImage = uploadedImageUrl.Location;
  }

  // Prevent overwriting sensitive fields
  delete updateData.password;
  delete updateData.otp;
  delete updateData.otpExpiresAt;

  let genderValue: Gender | null | undefined = undefined;
  if (updateData.gender && updateData.gender.trim() !== "") {
    if (Object.values(Gender).includes(updateData.gender as Gender)) {
      genderValue = updateData.gender as Gender;
    } else {
      throw new ApiError(400, "Invalid gender value");
    }
  }
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...updateData,
      gender: genderValue,
      updatedAt: new Date(),
    },
  });

  return updatedUser;
};


// const postDemoVideo = async (file: any, userId: string) => {

//   if (!file) {
//     throw new ApiError(httpStatus.BAD_REQUEST, "Video File Requierd")

//   }

//   const videosData = await fileUploader.uploadToDigitalOcean(file)

//   if (!videosData.Location) {
//     throw new ApiError(httpStatus.BAD_REQUEST, "Filed to Upload video")
//   }


//   const user = await prisma.user.findUnique({
//     where: { id: userId },
//   });

//   if (!user) {
//     throw new ApiError(404, "User not found");
//   }

//   if(user.role !== 'TUTOR') {
//     throw new ApiError(httpStatus.BAD_REQUEST, "You are not a Tutor!, Only Tutors can upload demo videos");
//   }


//   const data = await prisma.user.update({
//     where: { id: userId },
//     data: {
//       demoClassUrl: videosData.Location
//     },
//     select: {
//       id: true,
//       fullName: true,
//       email: true,
//       phoneNumber: true,
//       profileImage: true,
//       role: true,
//       demoClassUrl: true,
//       availableDays: true,
//       about: true,
//       isTutorApproved: true,
//       status: true,
//       city: true,
//       gender: true,
//       createdAt: true,
//       updatedAt: true,
//     }
//   })


//   return data
// }

// Fetch all drivers pending admin approval

// const getDriversPendingApproval = async () => {
//   const drivers = await prisma.user.findMany({
//     where: {
//       role: "DRIVER",
//       adminApprovedStatus: "PENDING",
//     },
//     select: {
//       id: true,
//       fullName: true,
//       phoneNumber: true,
//       createdAt: true,
//       role: true,
//       adminApprovedStatus: true,
//     },
//   });

//   if (!drivers.length) {
//     throw new ApiError(httpStatus.NOT_FOUND, "No drivers pending approval");
//   }

//   return drivers;
// };

// Update driver approval status


// Get all drivers with adminApprovedStatus = PENDING (ADMIN ONLY)


const getDriversPendingApproval = async (userToken: string) => {
  // Verify admin token
  const decoded = jwtHelpers.verifyToken(userToken, process.env.JWT_SECRET!);

  const currentUser = await prisma.user.findUnique({
    where: { id: decoded.id },
  });

  if (!currentUser || currentUser.role !== "ADMIN") {
    throw new ApiError(httpStatus.FORBIDDEN, "You are not authorized");
  }

  // Now fetch only pending drivers
  const drivers = await prisma.user.findMany({
    where: {
      role: "DRIVER",
      adminApprovedStatus: "PENDING",
    },
    select: {
      id: true,
      fullName: true,
      phoneNumber: true,
      createdAt: true,
      role: true,
      adminApprovedStatus: true,
    },
  });

  if (!drivers.length) {
    throw new ApiError(httpStatus.NOT_FOUND, "No drivers pending approval");
  }

  return drivers;
};


const updateDriverApprovalStatus = async (
  userToken: string,
  userId: string,
  status: "APPROVED" | "REJECTED"
) => {
  // Verify admin token
  const decoded = jwtHelpers.verifyToken(userToken, process.env.JWT_SECRET!);

  const currentUser = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!currentUser || currentUser.role !== "ADMIN") {
    throw new ApiError(httpStatus.FORBIDDEN, "You are not authorized");
  }

  // const driver = await prisma.user.findUnique({ where: { id: userId } });
  console.log("UserID from body:", userId);
const driver = await prisma.user.findUnique({ where: { id: userId.trim() } });
console.log(driver);
  if (!driver) throw new ApiError(httpStatus.NOT_FOUND, "Driver not found");
  if (driver.role !== "DRIVER") throw new ApiError(httpStatus.BAD_REQUEST, "User is not a driver");

  // Update status
  const updatedDriver = await prisma.user.update({
    where: { id: userId },
    data: { adminApprovedStatus: status },
  });

  // Remove sensitive info
  const { password, fcmToken, ...driverSafe } = updatedDriver;
  return driverSafe;
};




// toggle user online status
const toggleUserOnlineStatus = async (
  userToken: string,
  isUserOnline: boolean
) => {
  const decodedToken = jwtHelpers.verifyToken(
    userToken,
    config.jwt.jwt_secret!
  );

  const existingUser = await prisma.user.findUnique({
    where: {
      id: decodedToken.id,
    },
  });

  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const updatedUser = await prisma.user.update({
    where: { id: decodedToken.id },
    data: {
      isUserOnline,
    },
    select: {
       id: true,
      fullName: true,
      phoneNumber: true,
      role: true,
      isUserOnline: true,
      updatedAt: true,
    },
  });

  const userWithoutSensitive = omit(updatedUser, ["password", "fcmToken"]);
  return userWithoutSensitive;
};



// toggle user online status
const toggleNotificationOnOff = async (
  userToken: string,
  isNotificationOn: boolean
) => {
  const decodedToken = jwtHelpers.verifyToken(
    userToken,
    config.jwt.jwt_secret!
  );

  const existingUser = await prisma.user.findUnique({
    where: {
      id: decodedToken.id,
    },
  });

  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const updatedUser = await prisma.user.update({
    where: { id: decodedToken.id },
    data: {
      isNotificationOn,
    },
    select: {
     id: true,
      fullName: true,
      phoneNumber: true,
      role: true,
      isNotificationOn: true,
      updatedAt: true,
    },
  });

  const userWithoutSensitive = omit(updatedUser, ["password", "fcmToken"]);
  return userWithoutSensitive;
};




export const userService = {
  createUserIntoDb,
  getMyProfile,
  getAllUsers,
  adminDashboardUserLength,
  updateDriverLicense,
  updateUserProfile,
  updateDriverApprovalStatus,
  getDriversPendingApproval,
  toggleUserOnlineStatus,
  toggleNotificationOnOff,
  // postDemoVideo
};
