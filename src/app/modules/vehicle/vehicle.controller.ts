import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import ApiError from "../../../errors/ApiErrors";
import { driverService } from "./vehicle.service";
import { fileUploader } from "../../../helpars/fileUploader";
import pick from "../../../shared/pick";
import { paginationFields } from "../../../constants/pagination";
import { vehicleFilterableFields } from "./vehicle.constant";
import { get } from "lodash";

// ✅ Create Vehicle
// const createVehicle = catchAsync(async (req, res) => {
//   const userId = req.user?.id;
//   if (!userId) {
//     throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized user!");
//   }

//   const vehicleData = req.body;
//   const result = await driverService.createVehicle(userId, vehicleData);

//   sendResponse(res, {
//     statusCode: httpStatus.CREATED,
//     success: true,
//     message: "Vehicle created successfully",
//     data: result,
//   });
// });


const createVehicle = catchAsync(async (req, res) => {
  const userToken = req.headers.authorization;
  const file = req.file;

  if (!req.body.data) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Vehicle data is required!");
  }

  // Parse JSON string from form-data
  const updateData = JSON.parse(req.body.data);

  const {
    manufacturer,
    model,
    year,
    color,
    licensePlateNumber,
    bh,
    // refferalCode,
  } = updateData;

  if (!manufacturer || !model || !year || !color || !licensePlateNumber) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Required vehicle fields are missing!");
  }

  const vehicleData: any = {
    manufacturer,
    model,
    year,
    color,
    licensePlateNumber,
    bh,
    // refferalCode,
  };

  // Upload image if provided
  if (file) {
    const uploaded = await fileUploader.uploadToDigitalOcean(file);
    vehicleData.image = uploaded.Location;
  }

  const result = await driverService.createVehicle(userToken as string, vehicleData);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Vehicle created successfully",
    data: result,
  });
});

const getAllVehicles = catchAsync(async (req, res) => {
  const filters = pick(req.query, vehicleFilterableFields);
  const paginationOptions = pick(req.query, paginationFields);

  const result = await driverService.getAllVehicles(filters, paginationOptions);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Vehicles retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getUserVehicles = catchAsync(async (req, res) => {
  const userToken = req.headers.authorization;
  const filters = pick(req.query, vehicleFilterableFields);
  const paginationOptions = pick(req.query, paginationFields);

  const result = await driverService.getUserVehicles(
    userToken as string,
    filters,
    paginationOptions
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User vehicles retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getVehicleById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await driverService.getVehicleById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Vehicle retrieved successfully",
    data: result,
  });
});

const updateVehicle = catchAsync(async (req, res) => {
  const userToken = req.headers.authorization;
  const file = req.file; // optional image
  const vehicleId = req.params.vehicleId;  // ID path থেকে
  if (!vehicleId) throw new ApiError(httpStatus.BAD_REQUEST, "Vehicle ID is required");
  const { data } = req.body; // vehicleId mandatory, data JSON string

  if (!vehicleId || !data) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Vehicle ID and data are required");
  }

  // Parse the JSON data
  const updateData = JSON.parse(data);

  // Upload image if provided
  if (file) {
    const uploaded = await fileUploader.uploadToDigitalOcean(file);
    updateData.image = uploaded.Location;
  }

  const result = await driverService.updateVehicle(userToken as string, vehicleId, updateData);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Vehicle updated successfully",
    data: result,
  });
});


// // ✅ Signup as Driver
// const signupAsDriver = catchAsync(async (req, res) => {
//   const userId = req.user?.id;
//   if (!userId) {
//     throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized user!");
//   }

//   const driverData = req.body;
//   const result = await driverService.signupAsDriver(userId, driverData);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: "User is now a driver",
//     data: result,
//   });
// });

// // ✅ Get Driver Profile
// const getDriverProfile = catchAsync(async (req, res) => {
//   const userId = req.user?.id;
//   if (!userId) {
//     throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized user!");
//   }

//   const result = await driverService.getDriverProfile(userId);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: "Driver profile fetched successfully",
//     data: result,
//   });
// });

export const driverController = {
  createVehicle,
  getAllVehicles,
  // signupAsDriver,
  // getDriverProfile,
  getUserVehicles,
  getVehicleById,
  updateVehicle,
};
