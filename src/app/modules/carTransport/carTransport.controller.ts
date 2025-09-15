import httpStatus from 'http-status';
import { carTransportService } from './carTransport.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import pick from '../../../shared/pick';
import { paginationFields } from '../../../constants/pagination';

const createCarTransport = catchAsync(async (req, res) => {
  const token = req.headers.authorization;
  const files = req.files as any[];

  // form-data তে data টা আসবে string আকারে
  const parsedData = JSON.parse(req.body.data)

  const result = await carTransportService.createCarTransport(
    token as string,
    parsedData,
    files || []
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Car transport request created successfully",
    data: result,
  });
});

const cancelRide = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const rideId = req.params.id;
  const { cancelReason } = req.body;

  const result = await carTransportService.cancelRide(userId, rideId, cancelReason);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Ride cancelled successfully",
    data: result,
  });
});

const getRideDetailsById = catchAsync(async (req, res) => {
  const { id } = req.params;
  // const userId = req.user.id;

  const ride = await carTransportService.getRideDetailsById(id);

  if (!ride) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Ride not found',
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Ride details fetched successfully',
    data: ride,
  });
});

// Get my rides (Rider side)
const getMyRides = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const rides = await carTransportService.getMyRides(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "My rides fetched successfully",
    data: rides,
  });
});

// src/app/modules/carTransport/carTransport.controller.ts

const getAllCarTransports = catchAsync(async (req, res) => {
  const filters = pick(req.query, [
    "searchTerm",
    "status",
    "paymentStatus",
  ]);
  const options = pick(req.query, paginationFields);

  const result = await carTransportService.getAllCarTransports(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Car transport requests retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});


const getRideStatusById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await carTransportService.getRideStatusById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Car transport request retrieved successfully",
    data: result,
  });
});

const assignDriver = catchAsync(async (req, res) => {
  const result = await carTransportService.assignDriver(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Driver assigned successfully",
    data: result,
  });
});

const handleDriverResponse = catchAsync(async (req, res) => {
  const token = req.headers.authorization;

  const result = await carTransportService.handleDriverResponse(
    token as string,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Driver ${req.body.response.toLowerCase()} the request`,
    data: result,
  });
});

const confirmArrival = catchAsync(async (req, res) => {
  const token = req.headers.authorization;
  const result = await carTransportService.confirmArrival(
    token as string,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Driver arrival confirmed successfully",
    data: result,
  });
});


export const carTransportController = {
  createCarTransport,
  cancelRide,
  getRideDetailsById,
  getMyRides,
  getAllCarTransports,
  getRideStatusById,
  assignDriver,
  handleDriverResponse,
  confirmArrival,
  // getCarTransportList,
  // getCarTransportById,
  // updateCarTransport,
  // deleteCarTransport,
};