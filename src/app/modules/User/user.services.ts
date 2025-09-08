import {  User, UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";
import httpStatus from "http-status";
import config from "../../../config";
import ApiError from "../../../errors/ApiErrors";
import { fileUploader } from "../../../helpars/fileUploader";
import prisma from "../../../shared/prisma";
import { jwtHelpers } from "../../../helpars/jwtHelpers";
import { IUser } from "./user.interface";
import { Secret } from "jsonwebtoken";
import { generateOtp } from "../../../shared/getTransactionId";
import { sendMessage } from "../../../shared/sendMessage";



// const createUserIntoDb = async (payload: User) => {
//   const existingUser = await prisma.user.findFirst({
//     where: {
//       phoneNumber: payload.phoneNumber,
//     },
//   });

//   if (existingUser) {
//     if (existingUser.isPhoneNumberVerify === false) {
//       await prisma.user.delete({
//         where: {
//           id: existingUser.id,
//         },
//       });
//     } else {
//       throw new ApiError(
//         400,
//         `User with this number ${payload.phoneNumber} already exists`
//       );
//     }
//   }

//   // const hashedPassword: string = await bcrypt.hash(
//   //   payload.password,
//   //   Number(config.bcrypt_salt_rounds)
//   // );

//   const otp = generateOtp(4);
//   const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);

//   const newUser = await prisma.user.create({
//     data: {
//       ...payload,
//       // password: hashedPassword,
//       otp,
//       otpExpiresAt: otpExpiry,
//     },
//     select: {
//       id: true,
//       phoneNumber: true,
//       // role: true,
//       otp: true,
//       createdAt: true,
//       updatedAt: true,
//     },
//   });

//   console.log(payload.phoneNumber);

//   try {
//     //     if (payload.phone.startsWith("+")) {
//     //   throw new ApiError(
//     //     httpStatus.BAD_REQUEST,
//     //     "Phone number must be in E.164 format with country code."
//     //   );
//     // }

//     const messageBody = `Here is your new OTP code: ${otp}. It will expire in 5 minutes.`;

//     await sendMessage(messageBody, payload.phoneNumber);
//   } catch (error) {
//     console.error(`Failed to send OTP:`, error);
//   }
  
//    const accessToken = jwtHelpers.generateToken(
//       {
//         id: newUser.id,
//         phoneNumber: newUser.phoneNumber,
//       },
//       config.jwt.jwt_secret as Secret,
//       config.jwt.expires_in as string
//     );


//   if (!newUser) {
//     throw new ApiError(httpStatus.BAD_REQUEST, "User creation failed. Please check the input data.");
//   }

//   return {newUser, token: accessToken};

// };

const createUserIntoDb = async (payload: User) => {
  const existingUser = await prisma.user.findFirst({
    where: {
      phoneNumber: payload.phoneNumber,
    },
  });

  if (existingUser) {
    if (existingUser.isPhoneNumberVerify === false) {
      await prisma.user.delete({
        where: {
          id: existingUser.id,
        },
      });
    } else {
      throw new ApiError(
        400,
        `User with this email ${payload.phoneNumber} already exists`
      );
    }
  }

  // if (!payload.password) {
  //   throw new ApiError(httpStatus.BAD_REQUEST, "Password is required.");
  // }
  // const hashedPassword = await bcrypt.hash(
  //   payload.password,
  //   Number(config.bcrypt_salt_rounds)
  // );

  const otp = generateOtp(4);
  const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);

  const newUser = await prisma.user.create({
    data: {
      ...payload,
      // password: hashedPassword,
      otp,
      otpExpiresAt: otpExpiry,
    },
    select: {
      id: true,
      phoneNumber: true,
      // role: true,
      otp: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  console.log(payload.phoneNumber);

  try {
    //     if (payload.phone.startsWith("+")) {
    //   throw new ApiError(
    //     httpStatus.BAD_REQUEST,
    //     "Phone number must be in E.164 format with country code."
    //   );
    // }

    const messageBody = `Here is your new OTP code: ${otp}. It will expire in 5 minutes.`;

    await sendMessage(messageBody, payload.phoneNumber);
  } catch (error) {
    console.error(`Failed to send OTP email:`, error);
  }

  return newUser;
};


// // get user profile
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

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...updateData,
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


export const userService = {
  createUserIntoDb,
  getMyProfile,
  updateUserProfile,
  // postDemoVideo
};
