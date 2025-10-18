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
import { generateOtp, generateReferralCode } from "../../../shared/getTransactionId";
import { sendMessage } from "../../../shared/sendMessage";
import { get, omit } from "lodash";
import dayjs from "dayjs";





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


// const createUserIntoDb = async (payload: User) => {
//   // check existing user
//   let existingUser = await prisma.user.findFirst({
//     where: { phoneNumber: payload.phoneNumber },
//   });

//   // otp generate
//   const otp = generateOtp(4);
//   const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

//   let user;

//   if (existingUser) {
//     if (existingUser.isPhoneNumberVerify === false) {
      
//       // পুরানো unverified user এর OTP update হবে
//       user = await prisma.user.update({
//         where: { id: existingUser.id },
//         data: {
//           otp,
//           otpExpiresAt: otpExpiry,
//           referralCode: generateReferralCode(),
//         },
//         select: {
//           id: true,
//           phoneNumber: true,
//           role: true,
//           otp: true,
//           referralCode:true,
//           createdAt: true,
//           updatedAt: true,
//         },
//       });
//     } else {
//       throw new ApiError(
//         httpStatus.BAD_REQUEST,
//         `User with this phone number ${payload.phoneNumber} already exists`
//       );
//     }
//   } else {
//     // একদম নতুন user create
//     user = await prisma.user.create({
//       data: {
//         phoneNumber: payload.phoneNumber,
//         role: payload.role,
//         otp,
//         otpExpiresAt: otpExpiry,
//       },
//       select: {
//         id: true,
//         phoneNumber: true,
//         role: true,
//         otp: true,
//         createdAt: true,
//         updatedAt: true,
//       },
//     });
//   }

//   console.log("✅ User created/updated with phone:", payload.phoneNumber);

//   // otp send
//   try {
//     const messageBody = `Here is your OTP code: ${otp}. It will expire in 5 minutes.`;
//     await sendMessage(messageBody, payload.phoneNumber);
//   } catch (error) {
//     console.error("❌ Failed to send OTP:", error);
//   }

//   return user;
// };



const createUserIntoDb = async (payload: User) => {
  // check existing user
  const existingUser = await prisma.user.findFirst({
    where: { phoneNumber: payload.phoneNumber },
  });

  // otp generate
  // const otp = generateOtp(4);
  const otp = 1234;
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

  let user;
  let isExist = false; // default

  if (existingUser) {
    if (existingUser.isPhoneNumberVerify === false) {
      // পুরানো unverified user এর OTP update হবে
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          otp,
          otpExpiresAt: otpExpiry,
          // যদি আগেই referral না থাকে, তবে জেনারেট করবো
          referralCode: existingUser.referralCode ?? generateReferralCode(),
        },
        select: {
          id: true,
          phoneNumber: true,
          role: true,
          otp: true,
          referralCode: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      isExist = true; // পুরানো user ছিল
    } else {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `User with this phone number ${payload.phoneNumber} already exists`
      );
    }
  } else {
    // একদম নতুন user create → referralCode auto generate করতে হবে
    user = await prisma.user.create({
      data: {
        phoneNumber: payload.phoneNumber,
        role: payload.role,
        otp,
        otpExpiresAt: otpExpiry,
        referralCode: generateReferralCode(), 
      },
      select: {
        id: true,
        phoneNumber: true,
        role: true,
        otp: true,
        referralCode: true, 
        createdAt: true,
        updatedAt: true,
      },
    });
    isExist = false; // নতুন user
  }

  console.log("✅ User created/updated with phone:", payload.phoneNumber);

  // otp send
  try {
    const messageBody = `Here is your OTP code: ${otp}. It will expire in 5 minutes.`;
    await sendMessage(messageBody, payload.phoneNumber);
  } catch (error) {
    console.error("❌ Failed to send OTP:", error);
  }

  return {...user, isExist};
};




/* const createUserIntoDb = async (payload: User) => {
  let user;
  let isExist = false; // default

  // 1️⃣ check existing user
  const existingUser = await prisma.user.findFirst({
    where: { phoneNumber: payload.phoneNumber },
  });

  // 2️⃣ if exists
  if (existingUser) {
    if (!existingUser.isPhoneNumberVerify) {
      // unverified → update OTP, referralCode
      const otp = generateOtp(4);
      const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          otp,
          otpExpiresAt: otpExpiry,
          referralCode: existingUser.referralCode ?? generateReferralCode(),
        },
        select: {
          id: true,
          phoneNumber: true,
          role: true,
          otp: true,
          referralCode: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      isExist = true;

      // send OTP
      try {
        await sendMessage(
          `Here is your OTP code: ${otp}. It will expire in 5 minutes.`,
          payload.phoneNumber
        );
      } catch (error) {
        console.error("❌ Failed to send OTP:", error);
      }

      return { ...user, isExist };
    } else {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `User with this phone number ${payload.phoneNumber} already exists`
      );
    }
  }

  // 3️⃣ New user create
  const otp = generateOtp(4);
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

  user = await prisma.user.create({
    data: {
      phoneNumber: payload.phoneNumber,
      role: payload.role,
      otp,
      otpExpiresAt: otpExpiry,
      referralCode: generateReferralCode(),
    },
    select: {
      id: true,
      phoneNumber: true,
      role: true,
      otp: true,
      referralCode: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // send OTP
  try {
    await sendMessage(
      `Here is your OTP code: ${otp}. It will expire in 5 minutes.`,
      payload.phoneNumber
    );
  } catch (error) {
    console.error("❌ Failed to send OTP:", error);
  }

  console.log("✅ User created with phone:", payload.phoneNumber);
  return { ...user, isExist };
}; */


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

  if (!userProfile) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const userWithoutSensitive = omit(userProfile, ["password", "fcmToken"]);

  return userWithoutSensitive;
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
     if (role === UserRole.DRIVER) {
    whereConditions.adminApprovedStatus = AdminApprovedStatus.APPROVED;
  }
  
  }
  else {
    // যদি role না দেয়া হয়, DRIVER এর pending বাদ দিতে
    whereConditions.OR = [
      {
        role: UserRole.RIDER,
      },
      {
        role: UserRole.DRIVER,
        adminApprovedStatus: AdminApprovedStatus.APPROVED,
      }
    ];
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

// const updateDriverLicense = async (
//   userId: string,
//   licenseFrontSide?: string,
//   licenseBackSide?: string
// ) => {
//   const user = await prisma.user.findUnique({ where: { id: userId } });
//   if (!user) throw new ApiError(404, "User not found");

//   const updatedUser = await prisma.user.update({
//     where: { id: userId },
//     data: {
//       licenseFrontSide: licenseFrontSide || user.licenseFrontSide,
//       licenseBackSide: licenseBackSide || user.licenseBackSide,
//       updatedAt: new Date(),
//     },
//   });

//    // Remove sensitive fields before sending back
//   const userWithoutSensitive = omit(updatedUser, [
//     "password",
//     "otp",
//     "otpExpiresAt",
//     "fcmToken",
//     "stripeAccountId",
//   ]);

//   return userWithoutSensitive;
// };

// const updateDriverLicense = async (
//   userId: string,
//   licenseFrontSide?: string,
//   licenseBackSide?: string
// ) => {
//   const user = await prisma.user.findUnique({ where: { id: userId } });
//   if (!user) throw new ApiError(404, "User not found");

//   // if approved driver change license , then status will pending again and have to re-approved by admin
//   let newStatus = user.adminApprovedStatus;
//   // let licenseExpiryDate = user.licenseExpiryDate;

//   if (user.adminApprovedStatus === "APPROVED" && (licenseFrontSide || licenseBackSide)) {
//     newStatus = "PENDING";
//   }

//   // যদি নতুন লাইসেন্স আপলোড হয়, তাহলে নতুন এক্সপায়ারি ডেট সেট করো (আজ থেকে ১ বছর পর)
//   // if (licenseFrontSide || licenseBackSide) {
//   //   licenseExpiryDate = new Date();
//   //   licenseExpiryDate.setFullYear(licenseExpiryDate.getFullYear() + 1);
//   // }

//   const updatedUser = await prisma.user.update({
//     where: { id: userId },
//     data: {
//       licenseFrontSide: licenseFrontSide || user.licenseFrontSide,
//       licenseBackSide: licenseBackSide || user.licenseBackSide,
//       adminApprovedStatus: newStatus,
//       // licenseExpiryDate,
//       updatedAt: new Date(),
//     },
//   });

//   const userWithoutSensitive = omit(updatedUser, [
//     "password",
//     "otp",
//     "otpExpiresAt",
//     "fcmToken",
//     "stripeAccountId",
//   ]);

//   return userWithoutSensitive;
// };

const updateDriverLicense = async (
  userId: string,
  licenseFrontSide?: string,
  licenseBackSide?: string
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");

  // যদি Approved driver নতুন লাইসেন্স দেয়
  let newStatus = user.adminApprovedStatus;
  let newExpiryDate = user.licenseExpiryDate;

  if (
    user.adminApprovedStatus === "APPROVED" &&
    (licenseFrontSide || licenseBackSide)
  ) {
    newStatus = "PENDING";
    newExpiryDate = dayjs().add(1, "year").toDate(); // নতুন ১ বছরের জন্য নবায়ন
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      licenseFrontSide: licenseFrontSide || user.licenseFrontSide,
      licenseBackSide: licenseBackSide || user.licenseBackSide,
      adminApprovedStatus: newStatus,
      licenseExpiryDate: newExpiryDate,
      updatedAt: new Date(),
    },
  });

  const userWithoutSensitive = omit(updatedUser, [
    "password",
    "otp",
    "otpExpiresAt",
    "fcmToken",
    "stripeAccountId",
  ]);

  return userWithoutSensitive;
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

   // Remove sensitive info before sending response
  const userWithoutSensitive = omit(updatedUser, [
    "password",
    "otp",
    "otpExpiresAt",
    "fcmToken",
    "stripeAccountId",
  ]);
  return userWithoutSensitive;
};


const driverOnboarding = async (
  userId: string,
  profileData: Partial<IUser>,
  vehicleData: any,
  files: { [fieldname: string]: Express.Multer.File[] }
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");

  // Role check
  if (user.role !== "DRIVER") {
    throw new ApiError(httpStatus.FORBIDDEN, "Only drivers can complete onboarding");
  }

  // Handle file uploads
  let profileImage: string | undefined;
  let licenseFrontSide: string | undefined;
  let licenseBackSide: string | undefined;
  let vehicleImage: string | undefined;
  let idFrontImage: string | undefined;
  let idBackImage: string | undefined;
  let judicialRecord: string[] = [];
  let compulsoryInsurance: string[] = [];

  // single image upload helper
  const uploadSingle = async (fileArr?: Express.Multer.File[]) => {
    if (fileArr && fileArr.length > 0) {
      const uploaded = await fileUploader.uploadToDigitalOcean(fileArr[0]);
      return uploaded.Location;
    }
    return undefined;
  };

  // multiple images upload helper
  const uploadMultiple = async (fileArr?: Express.Multer.File[]) => {
    const urls: string[] = [];
    if (fileArr && fileArr.length > 0) {
      for (const file of fileArr) {
        const uploaded = await fileUploader.uploadToDigitalOcean(file);
        urls.push(uploaded.Location);
      }
    }
    return urls;
  };

  // Upload files
  profileImage = await uploadSingle(files?.profileImage);
  licenseFrontSide = await uploadSingle(files?.licenseFrontSide);
  licenseBackSide = await uploadSingle(files?.licenseBackSide);
  vehicleImage = await uploadSingle(files?.vehicleImage);
  idFrontImage = await uploadSingle(files?.idFrontImage);
  idBackImage = await uploadSingle(files?.idBackImage);
  judicialRecord = await uploadMultiple(files?.judicialRecord);
  compulsoryInsurance = await uploadMultiple(files?.compulsoryInsurance);

  // Gender validation
  let genderValue: Gender | undefined = undefined;
  if (profileData.gender && profileData.gender.trim() !== "") {
    if (Object.values(Gender).includes(profileData.gender as Gender)) {
      genderValue = profileData.gender as Gender;
    } else {
      throw new ApiError(400, "Invalid gender value");
    }
  }

  // Transaction: Profile + Vehicle update
  const result = await prisma.$transaction(async (tx) => {
    // 1. Update User Profile + Documents
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        ...profileData,
        gender: genderValue,
        profileImage: profileImage || user.profileImage,
        licenseFrontSide: licenseFrontSide || user.licenseFrontSide,
        licenseBackSide: licenseBackSide || user.licenseBackSide,
        idFrontImage: idFrontImage || user.idFrontImage,
        idBackImage: idBackImage || user.idBackImage,
        judicialRecord: judicialRecord.length
          ? judicialRecord
          : user.judicialRecord,
        compulsoryInsurance: compulsoryInsurance.length
          ? compulsoryInsurance
          : user.compulsoryInsurance,
        updatedAt: new Date(),
      },
    });

    // 2. Create Vehicle
    const createdVehicle = await tx.vehicle.create({
      data: {
        ...vehicleData,
        image: vehicleImage,
        userId: userId,
      },
    });

    const userWithoutSensitive = omit(updatedUser, ["password", "fcmToken"]);
    return { user: userWithoutSensitive, vehicle: createdVehicle };
  });

  return result;
};



 const getDriverOnboarding = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      dob: true,
      gender: true,
      phoneNumber: true,
      profileImage: true,
      licenseFrontSide: true,
      licenseBackSide: true,
      idFrontImage:true,
      idBackImage:true,
      judicialRecord: true,
      compulsoryInsurance: true,
      address: true,
      city: true,
      role: true,
      adminApprovedStatus: true,
    },
  });

  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");

  if (user.role !== "DRIVER") {
    throw new ApiError(httpStatus.FORBIDDEN, "Only drivers can access this data");
  }

  const vehicles = await prisma.vehicle.findMany({
    where: { userId },
    select: {
      id: true,
      manufacturer: true,
      model: true,
      year: true,
      color: true,
      licensePlateNumber: true,
      bh: true,
      // refferalCode: true,
      image: true,
    },
  });

  return { user, vehicles };
};


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
      profileImage:true,
      licenseFrontSide:true,
      licenseBackSide:true,
      address: true,
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


// const updateDriverApprovalStatus = async (
//   userToken: string,
//   userId: string,
//   status: "APPROVED" | "REJECTED"
// ) => {
//   // Verify admin token
//   const decoded = jwtHelpers.verifyToken(userToken, process.env.JWT_SECRET!);

//   const currentUser = await prisma.user.findUnique({ where: { id: decoded.id } });
//   if (!currentUser || currentUser.role !== "ADMIN") {
//     throw new ApiError(httpStatus.FORBIDDEN, "You are not authorized");
//   }

//   // const driver = await prisma.user.findUnique({ where: { id: userId } });
//   console.log("UserID from body:", userId);
// const driver = await prisma.user.findUnique({ where: { id: userId.trim() } });
// console.log(driver);
//   if (!driver) throw new ApiError(httpStatus.NOT_FOUND, "Driver not found");
//   if (driver.role !== "DRIVER") throw new ApiError(httpStatus.BAD_REQUEST, "User is not a driver");

//   // Update status
//   const updatedDriver = await prisma.user.update({
//     where: { id: userId },
//     data: { adminApprovedStatus: status },
//   });

//   // Remove sensitive info
//   const { password, fcmToken, ...driverSafe } = updatedDriver;
//   return driverSafe;
// };




// toggle user online status

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

  const driver = await prisma.user.findUnique({ where: { id: userId.trim() } });
  if (!driver) throw new ApiError(httpStatus.NOT_FOUND, "Driver not found");
  if (driver.role !== "DRIVER") throw new ApiError(httpStatus.BAD_REQUEST, "User is not a driver");

  // Prepare update data
  const updateData: any = {
    adminApprovedStatus: status,
  };

  // যদি approve করা হয়, তাহলে এক বছর পর licenseExpiryDate set করবে
  if (status === "APPROVED") {
    updateData.adminApprovedAt = new Date();
    updateData.licenseExpiryDate = dayjs().add(1, "year").toDate();
  }

  const updatedDriver = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  // Remove sensitive info
  const { password, fcmToken, otp, otpExpiresAt, ...driverSafe } = updatedDriver;
  return driverSafe;
};


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
  driverOnboarding,
  getDriverOnboarding
  // postDemoVideo
};
