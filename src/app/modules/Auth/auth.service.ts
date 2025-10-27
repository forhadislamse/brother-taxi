import { User, UserRole, UserStatus } from "@prisma/client";
import * as bcrypt from "bcrypt";
import crypto from "crypto";
import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import config from "../../../config";
import ApiError from "../../../errors/ApiErrors";
import { jwtHelpers } from "../../../helpars/jwtHelpers";

import prisma from "../../../shared/prisma";
import { emailSender } from "../../../shared/emailSender";
import { generateOtp } from "../../../shared/getTransactionId";
import { sendMessage } from "../../../shared/sendMessage";
import axios from "axios";




// resend otp

 const resendOtp = async (phoneNumber: string) => {
  // Check if the user exists
  const user = await prisma.user.findUnique({
    where: { phoneNumber: phoneNumber },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "This user is not found!");
  }

  // const otp = generateOtp(4);
  const otp = 1234;
  const expirationOtp = new Date(Date.now() + 15 * 60 * 1000);

  try {
    //     if (payload.phone.startsWith("+")) {
    //   throw new ApiError(
    //     httpStatus.BAD_REQUEST,
    //     "Phone number must be in E.164 format with country code."
    //   );
    // }

    const messageBody = `Here is your new OTP code: ${otp}. It will expire in 5 minutes.`;

    await sendMessage(messageBody, user.phoneNumber);
  } catch (error) {
    console.error(`Failed to send OTP phone:`, error);
  }

  // Update the user's profile with the new OTP and expiration
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      otp: otp,
      otpExpiresAt: expirationOtp,
    },
  });

  return { message: "OTP resent successfully", otp: otp };
};


/* const resendOtp = async (phoneNumber: string) => {
  // Check if the user exists
  const user = await prisma.user.findUnique({
    where: { phoneNumber: phoneNumber },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "This user is not found!");
  }

  const otp = generateOtp(4);
  // const otp = 1234;
  const expirationOtp = new Date(Date.now() + 15 * 60 * 1000);

  try {
    //     if (payload.phone.startsWith("+")) {
    //   throw new ApiError(
    //     httpStatus.BAD_REQUEST,
    //     "Phone number must be in E.164 format with country code."
    //   );
    // }

    const messageBody = `Here is your new OTP code: ${otp}. It will expire in 5 minutes.`;

    await sendMessage(messageBody, user.phoneNumber);
  } catch (error) {
    console.error(`Failed to send OTP phone:`, error);
  }

  // Update the user's profile with the new OTP and expiration
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      otp: otp,
      otpExpiresAt: expirationOtp,
    },
  });

  return { message: "OTP resent successfully", otp: otp };
}; */

/* const resendOtp = async (phoneNumber: string) => {
  const user = await prisma.user.findUnique({
    where: { phoneNumber },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "This user is not found!");
  }

  const otp = generateOtp(4); // number
  const expirationOtp = new Date(Date.now() + 15 * 60 * 1000);

  try {
    // WhatsApp OTP পাঠানো
    await sendMessage( user.phoneNumber,otp.toString());
    console.log("✅ OTP resent via WhatsApp");
  } catch (error) {
    console.error("❌ Failed to send OTP:", error);
  }

  // Update user OTP
  await prisma.user.update({
    where: { id: user.id },
    data: {
      otp,
      otpExpiresAt: expirationOtp,
    },
  });

  return { message: "OTP resent successfully", otp: otp.toString() };
}; */


const verifyLogin = async (phoneNumber: string, otp: number, fcmToken?: string) => {
  // Check if the user exists
  const user = await prisma.user.findUnique({
    where: { phoneNumber},
  });
// console.log("DB OTP:", user.otp, "Client OTP:", payload.otp);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "This user is not found!");
  }

  // if (!user || user.otp !== Number(otp)) {
  //   return res.status(400).json({ message: "Invalid OTP" });
  // }

  // if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
  //   return res.status(400).json({ message: "OTP expired" });
  // }

  // Check if the OTP is valid and not expired
  if (
    user.otp !== otp ||
    !user.otpExpiresAt ||
    user.otpExpiresAt < new Date()
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid OTP");
  }

  // Update FCM token if provided
  if (fcmToken) {
    await prisma.user.update({
      where: { id: user.id },
      data: { fcmToken: fcmToken },
    });
  }

  // Update the user's OTP, OTP expiration, and verification status
  await prisma.user.update({
    where: { id: user.id },
    data: {
      otp: null, // Clear the OTP
      otpExpiresAt: null, // Clear the OTP expiration
      status: UserStatus.ACTIVE,
    },
  });


  const token = await jwtHelpers.generateToken({
    id: user.id,
    phoneNumber: user.phoneNumber,
    role: user.role
  }, config.jwt.jwt_secret as Secret, config.jwt.expires_in as string);

  return { message: "OTP verification successful",  role:user.role, id:user.id ,token: token,};
};


const getRefferId = () => Math.random().toString(36).substring(2, 8);

// Google user fetch
const getGoogleUser = async (accessToken: string) => {
  const res = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data;
};

// Social login service (Google only)
const riderLoginService = async (accessToken: string) => {
  const userData = await getGoogleUser(accessToken);

  if (!userData.email) throw new Error('Email not found from Google');

  // Check if user exists
  // let user = await prisma.user.findUnique({ where: { email: userData.email } });
  let user = await prisma.user.findFirstOrThrow({ where: { email: userData.email } });


  // Generate unique referral code if new user
  let newReferralCode = getRefferId();  //find unique if referel code unique
  while (await prisma.user.findFirstOrThrow({ where: { referralCode: newReferralCode } })) {
    newReferralCode = getRefferId();
  }

  // Create user if not exist
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: userData.email,
        fullName: userData.name || '',
        phoneNumber: userData.phoneNumber || '0000000000',
        profileImage: userData.picture || '',
        // isVerified: true,
        referralCode: newReferralCode,
        status: 'ACTIVE',
        role: UserRole.RIDER
      },
    });
  }

  // Generate JWT
  const token = jwtHelpers.generateToken(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string
  );

  return { token, user };
};

const driverLoginService = async (accessToken: string) => {
  // Get Google user info
  const userData = await getGoogleUser(accessToken);

  if (!userData.email) throw new Error('Email not found from Google');

  // Check if driver exists
  let user = await prisma.user.findFirst({ where: { email: userData.email } });

  // Generate unique referral code
  let newReferralCode = getRefferId();
  while (await prisma.user.findFirst({ where: { referralCode: newReferralCode } })) {
    newReferralCode = getRefferId();
  }

  // Create driver if not exists
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: userData.email,
        fullName: userData.name || '',
        phoneNumber: userData.phoneNumber || '0000000000', // required field
        profileImage: userData.picture || '',
        referralCode: newReferralCode,
        status: 'ACTIVE',
        role: UserRole.DRIVER, // important
      },
    });
  }

  // Generate JWT token
  const token = jwtHelpers.generateToken(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string
  );

  return { token, user };
};

// Update current location
const updateUserLocation = async (userToken: string, lat: number, lng: number) => {
  const decodedToken = jwtHelpers.verifyToken(
      userToken,
      config.jwt.jwt_secret!
    );
    const userId = decodedToken.id; 
  return await prisma.user.update({
    where: { id:userId },
    data: { lat, lng },
  });
};

// Update address
export const updateUserAddress = async (token: string, address: string) => {
  return await prisma.user.update({
    where: { id: token },
    data: { address },
  });
};





export const AuthServices = {
  // loginUser,
  // requestOtp,
  verifyLogin,
  resendOtp,
  riderLoginService,
  driverLoginService,
  updateUserLocation,
  updateUserAddress
  // changePassword,
  // forgotPassword,
  // resetPassword,
  // verifyForgotPasswordOtp,
  // deleteUser,
};
