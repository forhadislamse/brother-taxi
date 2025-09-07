// import { z } from "zod";

// // ───── Create User Validation
// const CreateUserValidationSchema = z.object({
//   fullName: z.string().min(1, "Full name is required").optional(),
//   phoneNumber: z.string().min(10,"Phone number must be at least 10 digits"),
//   email: z.string().email("Invalid email address").optional(),
//   password: z.string().min(8, "Password must be at least 8 characters"),

//   role: z.enum(["RIDER", "DRIVER", "ADMIN"]).default("RIDER"),
//   city: z.string().optional(),
// });

// // ───── Login Validation
// const UserLoginValidationSchema = z.object({
//   phoneNumber: z.string().nonempty("Phone number is required"),
//   password: z.string().nonempty("Password is required"),
// });

// // ───── Update User Validation
// const UserUpdateValidationSchema = z.object({
//   fullName: z.string().optional(),
//   dob: z.string().optional(),
//   gender: z.string().optional(),
//   city: z.string().optional(),
//   profileImage: z.string().optional(),
//   isNotificationOn: z.boolean().optional(),
//   isUserOnline: z.boolean().optional(),
//   onBoarding: z.boolean().optional(),
// });

// // ───── Driver Profile Validation (extra optional)
// const DriverProfileValidationSchema = z.object({
//   licensePlate: z.string().optional(),
//   licenseFrontSide: z.string().optional(),
//   licenseBackSide: z.string().optional(),
//   drivingLicense:   z.string().optional(),
//   taxiManufacturer: z.string().optional(),
//   bhNumber    : z.string().optional(),
//   vehicleModel: z.string().optional(),
//   vehicleColor: z.string().optional(),
//   vehicleType: z.string().optional(),
//   vehicleYear: z.string().optional(),

// });

// // ───── OTP Verify Validation
// const VerifyOtpValidationSchema = z.object({
//   phoneNumber: z.string().nonempty("Phone number is required"),
//   otp: z.number({ required_error: "OTP is required" }),
// });

// export const UserValidation = {
//   CreateUserValidationSchema,
//   UserLoginValidationSchema,
//   UserUpdateValidationSchema,
//   DriverProfileValidationSchema,
//   VerifyOtpValidationSchema,
// };

