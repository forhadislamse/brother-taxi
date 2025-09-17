import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { userService } from "./user.services";
import { Request, Response } from "express";
import pick from "../../../shared/pick";
import { userFilterableFields } from "./user.costant";
import ApiError from "../../../errors/ApiErrors";
import { get } from "lodash";
import { fileUploader } from "../../../helpars/fileUploader";

const createUser = catchAsync(async (req: Request, res: Response) => {

  if (!req.body.phoneNumber) {
    throw new ApiError(httpStatus.BAD_REQUEST, "phone number must be required.");
  }

  const result = await userService.createUserIntoDb(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User created successfully!",
    data: result,
  });
});




const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const userToken = req.headers.authorization;

  const result = await userService.getMyProfile(userToken as string);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "User profile retrieved successfully",
    data: result,
  });
});

const getAllUser = catchAsync(async (req: Request, res: Response) => {
  const filters = req.query;
  const result = await userService.getAllUsers(filters);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All User retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const adminDashboardUserLength = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.adminDashboardUserLength(); 

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User lengths retrieved successfully",
    data: result,
  });
});

const uploadDriverLicense = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  let licenseFrontSide: string | undefined;
  let licenseBackSide: string | undefined;

  if (files?.licenseFrontSide?.[0]) {
    const uploaded = await fileUploader.uploadToDigitalOcean(files.licenseFrontSide[0]);
    licenseFrontSide = uploaded.Location;
  }

  if (files?.licenseBackSide?.[0]) {
    const uploaded = await fileUploader.uploadToDigitalOcean(files.licenseBackSide[0]);
    licenseBackSide = uploaded.Location;
  }

  const user = await userService.updateDriverLicense(
    userId,
    licenseFrontSide,
    licenseBackSide
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Driver license uploaded successfully",
    data: user,
  });
});



// // * Update user profile

const getDriversPendingApproval = catchAsync(async (req: Request, res: Response) => {
  const userToken = req.headers.authorization;

  const result = await userService.getDriversPendingApproval(userToken as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Drivers pending approval retrieved successfully",
    data: result,
  });
});


const updateProfileController = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const updateData = JSON.parse(req.body.data); // Ensure client sends JSON string
  const file = req.file;

  const user = await userService.updateUserProfile(userId, updateData, file);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User profile updated successfully",
    data: user,
  });
});

// Get all drivers with adminApprovedStatus = PENDING
// const getDriversPendingApproval = catchAsync(async (req: Request, res: Response) => {
//   const result = await userService.getDriversPendingApproval();

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: "Drivers pending approval retrieved successfully",
//     data: result,
//   });
// });

// Update adminApprovedStatus for a driver
const updateDriverApprovalStatus = catchAsync(async (req: Request, res: Response) => {
  const userToken = req.headers.authorization;
  const { userId, status } = req.body; // status: APPROVED | REJECTED

  if (!userId || !status) {
    throw new ApiError(httpStatus.BAD_REQUEST, "UserId and status are required");
  }

  if (!["APPROVED", "REJECTED"].includes(status)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid status");
  }

  const result = await userService.updateDriverApprovalStatus(userToken as string, userId, status);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Driver adminApprovedStatus updated to ${status}`,
    data: result,
  });
});

// const postDemoVideo = async(req: any, res: Response) => {

//   const userId = req.user.id;
//   const file = req.file
//   const result = await userService.postDemoVideo(file, userId)

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: "User profile updated successfully",
//     data: result,
//   });
// }

const toggleOnlineStatus = catchAsync(async (req: Request, res: Response) => {
  const token = req.headers.authorization;
  const { isUserOnline } = req.body;
  
  const result = await userService.toggleUserOnlineStatus(
    token as string,
    isUserOnline
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `User is now ${isUserOnline ? 'online' : 'offline'}`,
    data: result,
  });
});

const toggleNotificationOnOff = catchAsync(async (req: Request, res: Response) => {
  const token = req.headers.authorization;
  const { isNotificationOn } = req.body;

  const result = await userService.toggleNotificationOnOff(
    token as string,
    isNotificationOn
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `User is now ${isNotificationOn ? 'online' : 'offline'}`,
    data: result,
  });
});


export const userController = {
  createUser,
  getMyProfile,
  getAllUser,
  adminDashboardUserLength,
  uploadDriverLicense,
  updateProfileController,
  updateDriverApprovalStatus,
  getDriversPendingApproval,
  toggleOnlineStatus,
  toggleNotificationOnOff,
  // postDemoVideo
};
