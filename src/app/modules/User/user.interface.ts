import { UserRole, UserStatus } from "@prisma/client";

export interface IUser {
  id: string;
  fullName?: string;
  dob?: string;
  gender?: string;
  ssnNumber?: string;

  phoneNumber: string;
  email?: string;
  city?: string;
  location?: string;
  lat?: number;
  lng?: number;

  password?: string;
  role: UserRole;      // RIDER | DRIVER | ADMIN (যদি enum এ থাকে)
  status: UserStatus;   // ACTIVE | INACTIVE | BLOCKED (যদি enum এ থাকে)
  otp?: number;
  otpExpiresAt?: Date;
  phoneVerificationToken?: string;
  isPhoneNumberVerify: boolean;

  profileImage?: string;
  fcmToken?: string;
  isNotificationOn: boolean;
  isUserOnline: boolean;
  onBoarding: boolean;

  licensePlate?: string;
  licenseFrontSide?: string;
  licenseBackSide?: string;
  drivingLicense?: string;
  taxiManufacturer?: string;
  bhNumber?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  vehicleType?: string;
  vehicleYear?: string;

  rating?: number;
  totalDistance?: number;
  totalRides?: number;
  totalTrips?: number;

  createdAt: Date;
  updatedAt: Date;

  // Relations
  // ridesAsRider?: IRide[];
  // ridesAsDriver?: IRide[];
  // reviewsGiven?: IReview[];
  // reviewsReceived?: IReview[];
  // wallet?: IWallet;
}

export interface ICreateUserInput {
  fullName?: string;
  dob?: string;
  gender?: string;
  ssnNumber?: string;

  phoneNumber: string;
  email?: string;
  password: string;

  role?: UserRole;     // Default = RIDER
  city?: string;
  profileImage?: string;
}


export interface IUpdateUserInput {
  fullName?: string;
  dob?: string;
  gender?: string;
  city?: string;
  profileImage?: string;
  isNotificationOn?: boolean;
  isUserOnline?: boolean;
  onBoarding?: boolean;
}

export interface IUserResponse {
  id: string;
  fullName?: string;
  phoneNumber: string;
  email?: string;
  role: UserRole;
  status: UserStatus;
  city?: string;
  profileImage?: string;
  rating?: number;
  totalRides?: number;
  totalTrips?: number;
  isUserOnline: boolean;
  createdAt: Date;
}


