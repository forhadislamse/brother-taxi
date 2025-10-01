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

// user login
// const loginUser = async (payload: {
//   email: string;
//   password: string;
//   fcmToken?: string;
//   role: UserRole;
// }) => {


//   if (!payload.email || !payload.password || !payload.role) {
//     throw new ApiError(httpStatus.BAD_REQUEST, "Email, password and role are required");
//   }

//   const validRoles = [UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN];

//   if (!validRoles.includes(payload.role)) {
//     throw new ApiError(
//       httpStatus.BAD_REQUEST,
//       "Role must be either STUDENT or TUTOR or ADMIN"
//     );
//   }


//   // Check if the user exists
//   const userData = await prisma.user.findUnique({
//     where: {
//       email: payload.email,
//       role: payload.role
//     },
//   });


//   if (!userData?.email) {
//     throw new ApiError(
//       httpStatus.NOT_FOUND,
//       "User not found! with this email " + payload.email + " and role " + payload.role
//     );
//   }

//   // Check if the password is correct
//   const isCorrectPassword: boolean = await bcrypt.compare(
//     payload.password,
//     userData.password
//   );

//   if (!isCorrectPassword) {
//     throw new ApiError(httpStatus.BAD_REQUEST, "Password incorrect!");
//   }

//   if(userData.status === UserStatus.SUSPENDED) {
//     throw new ApiError(httpStatus.BAD_REQUEST, "User suspended!");
//   }

//   // If fcmToken is provided, update the user's fcmToken
//   if (payload && payload.fcmToken) {
//     await prisma.user.update({
//       where: { id: userData.id },
//       data: { fcmToken: payload.fcmToken },
//     });
//   }
//   // Generate JWT token
//   const accessToken = jwtHelpers.generateToken(
//     {
//       id: userData.id,
//       email: userData.email,
//       role: userData.role,
//     },
//     config.jwt.jwt_secret as Secret,
//     config.jwt.expires_in as string
//   );

//   return { token: accessToken };
// };



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




// verify phone service
// const verifyLogin = async (phoneNumber: string, otp: number, fcmToken?: string) => {
//   // Find the user by email
//   const user = await prisma.user.findUnique({
//     where: { phoneNumber},
//   });
//   if (!user) {
//     throw new ApiError(404, "User not found");
//   }
//   // Check if the OTP matches and is not expired
//   if (user.otp !== otp) {
//     throw new ApiError(400, "Invalid OTP");
//   }
//   const currentTime = new Date();

//   if (!user.otpExpiresAt && user.otpExpiresAt! < currentTime) {
//     throw new ApiError(400, "OTP has expired");
//   }

//   // Update FCM token if provided
//   if (fcmToken) {
//     await prisma.user.update({
//       where: { id: user.id },
//       data: { fcmToken: fcmToken },
//     });
//   }

//   // Update the user's email verification status
//   const updatedUser = await prisma.user.update({
//     where: { phoneNumber },
//     data: {
//       isPhoneNumberVerify: true,
//     },
//     select: {
//       id: true,
//       fullName: true,
//       phone: true,
//       role: true,
//       createdAt: true,
//       updatedAt: true,
//     },
//   });

//   // Generate a JWT token after successful verification
//   const accessToken = jwtHelpers.generateToken(
//     {
//       id: updatedUser.id,
//       phone: updatedUser.phoneNumber,
//       role: updatedUser.role,
//     },
//     config.jwt.jwt_secret as Secret,
//     config.jwt.expires_in as string
//   );

//   return {
//     user: updatedUser,
//     token: accessToken,
//   };
// };

const verifyLogin = async (payload: {
  phoneNumber: string;
  otp: number;
}) => {
  // Check if the user exists
  const user = await prisma.user.findUnique({
    where: { phoneNumber: payload.phoneNumber },
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
    user.otp !== payload.otp ||
    !user.otpExpiresAt ||
    user.otpExpiresAt < new Date()
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid OTP");
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

  return { message: "OTP verification successful", token: token, id:user.id };
};

// change password

// const changePassword = async (
//   userToken: string,
//   newPassword: string,
//   oldPassword: string
// ) => {
//   const decodedToken = jwtHelpers.verifyToken(
//     userToken,
//     config.jwt.jwt_secret!
//   );

//   const user = await prisma.user.findUnique({
//     where: { id: decodedToken?.id },
//   });

//   if (!user) {
//     throw new ApiError(404, "User not found");
//   }

//   const isPasswordValid = await bcrypt.compare(oldPassword, user?.password);

//   if (!isPasswordValid) {
//     throw new ApiError(401, "Incorrect old password");
//   }

//   const hashedPassword = await bcrypt.hash(newPassword, 12);

//   const result = await prisma.user.update({
//     where: {
//       id: decodedToken.id,
//     },
//     data: {
//       password: hashedPassword,
//     },
//   });
//   return { message: "Password changed successfully" };
// };

// const forgotPassword = async (payload: { email: string }) => {
//   // Fetch user data or throw if not found
//   const userData = await prisma.user.findFirstOrThrow({
//     where: {
//       email: payload.email,
//     },
//   });

//   // Generate a new OTP
//   const otp = Number(crypto.randomInt(1000, 9999));

//   // Set OTP expiration time to 10 minutes from now
//   const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

//   // Create the email content
//   const html = `
// <div style="font-family: Arial, sans-serif; color: #333; padding: 30px; background: linear-gradient(135deg, #6c63ff, #3f51b5); border-radius: 8px;">
//     <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px;">
//         <h2 style="color: #ffffff; font-size: 28px; text-align: center; margin-bottom: 20px;">
//             <span style="color: #ffeb3b;">Forgot Password OTP</span>
//         </h2>
//         <p style="font-size: 16px; color: #333; line-height: 1.5; text-align: center;">
//             Your forgot password OTP code is below.
//         </p>
//         <p style="font-size: 32px; font-weight: bold; color: #ff4081; text-align: center; margin: 20px 0;">
//             ${otp}
//         </p>
//         <div style="text-align: center; margin-bottom: 20px;">
//             <p style="font-size: 14px; color: #555; margin-bottom: 10px;">
//                 This OTP will expire in <strong>10 minutes</strong>. If you did not request this, please ignore this email.
//             </p>
//             <p style="font-size: 14px; color: #555; margin-bottom: 10px;">
//                 If you need assistance, feel free to contact us.
//             </p>
//         </div>
//         <div style="text-align: center; margin-top: 30px;">
//             <p style="font-size: 12px; color: #999; text-align: center;">
//                 Best Regards,<br/>
//                 <span style="font-weight: bold; color: #3f51b5;">Nmbull Team</span><br/>
//                 <a href="mailto:support@nmbull.com" style="color: #ffffff; text-decoration: none; font-weight: bold;">Contact Support</a>
//             </p>
//         </div>
//     </div>
// </div> `;

//   // Send the OTP email to the user
//   await emailSender(userData.email, html, 'Forgot Password OTP',);

//   // Update the user's OTP and expiration in the database
//   await prisma.user.update({
//     where: { id: userData.id },
//     data: {
//       otp: otp,
//       otpExpiresAt: otpExpires,
//     },
//   });

//   return { message: 'Reset password OTP sent to your email successfully', otp };
// };


// const resendOtp = async (email: string) => {
//   // Check if the user exists
//   const user = await prisma.user.findUnique({
//     where: { email: email },
//   });

//   if (!user) {
//     throw new ApiError(httpStatus.NOT_FOUND, "This user is not found!");
//   }

//   // Generate a new OTP
//   const otp = Number(crypto.randomInt(1000, 9999));

//   // Set OTP expiration time to 5 minutes from now
//   const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

//   // Create email content
//   const html = `
//     <div style="font-family: Arial, sans-serif; color: #333; padding: 30px; background: linear-gradient(135deg, #6c63ff, #3f51b5); border-radius: 8px;">
//         <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px;">
//             <h2 style="color: #ffffff; font-size: 28px; text-align: center; margin-bottom: 20px;">
//                 <span style="color: #ffeb3b;">Resend OTP</span>
//             </h2>
//             <p style="font-size: 16px; color: #333; line-height: 1.5; text-align: center;">
//                 Here is your new OTP code to complete the process.
//             </p>
//             <p style="font-size: 32px; font-weight: bold; color: #ff4081; text-align: center; margin: 20px 0;">
//                 ${otp}
//             </p>
//             <div style="text-align: center; margin-bottom: 20px;">
//                 <p style="font-size: 14px; color: #555; margin-bottom: 10px;">
//                     This OTP will expire in <strong>5 minutes</strong>. If you did not request this, please ignore this email.
//                 </p>
//                 <p style="font-size: 14px; color: #555; margin-bottom: 10px;">
//                     If you need further assistance, feel free to contact us.
//                 </p>
//             </div>
//             <div style="text-align: center; margin-top: 30px;">
//                 <p style="font-size: 12px; color: #999; text-align: center;">
//                     Best Regards,<br/>
//                     <span style="font-weight: bold; color: #3f51b5;">levimusuc@team.com</span><br/>
//                     <a href="mailto:support@booksy.buzz.com" style="color: #ffffff; text-decoration: none; font-weight: bold;">Contact Support</a>
//                 </p>
//             </div>
//         </div>
//     </div>
//   `;

//   // Send the OTP to user's email
//   await emailSender(user.email, html, "Resend OTP");

//   // Update the user's profile with the new OTP and expiration
//   const updatedUser = await prisma.user.update({
//     where: { id: user.id },
//     data: {
//       otp: otp,
//       otpExpiresAt: otpExpires,
//     },
//   });

//   return { message: "OTP resent successfully" };
// };

// const verifyForgotPasswordOtp = async (payload: {
//   email: string;
//   otp: number;
// }) => {
//   // Check if the user exists
//   const user = await prisma.user.findUnique({
//     where: { email: payload.email },
//   });

//   if (!user) {
//     throw new ApiError(httpStatus.NOT_FOUND, "This user is not found!");
//   }

//   // Check if the OTP is valid and not expired
//   if (
//     user.otp !== payload.otp ||
//     !user.otpExpiresAt ||
//     user.otpExpiresAt < new Date()
//   ) {
//     throw new ApiError(httpStatus.BAD_REQUEST, "Invalid OTP");
//   }

//   // Update the user's OTP, OTP expiration, and verification status
//   await prisma.user.update({
//     where: { id: user.id },
//     data: {
//       otp: null, // Clear the OTP
//       otpExpiresAt: null, // Clear the OTP expiration
//       status: UserStatus.ACTIVE,
//     },
//   });


//   const token = await jwtHelpers.generateToken({
//     id: user.id,
//     email: user.email,
//     role: user.role
//   }, config.jwt.jwt_secret as Secret, config.jwt.expires_in as string);

//   return { message: "OTP verification successful", token: token };
// };

// reset password
// const resetPassword = async (payload: { password: string; email: string }) => {
//   // Check if the user exists
//   const user = await prisma.user.findUnique({
//     where: { email: payload.email },
//   });

//   if (!user) {
//     throw new ApiError(httpStatus.NOT_FOUND, "This user is not found!");
//   }

//   // Hash the new password
//   const hashedPassword = await bcrypt.hash(payload.password, 10);

//   // Update the user's password in the database
//   await prisma.user.update({
//     where: { email: payload.email },
//     data: {
//       password: hashedPassword, // Update with the hashed password
//       otp: null, // Clear the OTP
//       otpExpiresAt: null, // Clear OTP expiration
//     },
//   });

//   return { message: "Password reset successfully" };
// };

// const deleteUser = async (userId: string) => {
//   // Check if the user exists

//   if (!userId) {
//     throw new ApiError(httpStatus.BAD_REQUEST, "User ID is required");
//   }

//   const user = await prisma.user.findUnique({
//     where: { id: userId },
//   });

//   if (!user) {
//     throw new ApiError(httpStatus.NOT_FOUND, "This user is not found!");
//   }

//   // Delete the user from the database
//   await prisma.user.delete({
//     where: { id: userId },
//   });

//   return null;
// }

// Utility to generate referral code
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
