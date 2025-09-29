import httpStatus from "http-status";
import { carTransportService } from "./carTransport.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import pick from "../../../shared/pick";
import { paginationFields } from "../../../constants/pagination";
import { UserRole } from "@prisma/client";

const planCarTransport = catchAsync(async (req, res) => {
  const payload = req.body;
  const userId=req.user.id;

  const result = await carTransportService.planCarTransport(userId,payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Car transport plan calculated",
    data: result,
  });
});

const getMyRidePlans = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const ridePlans = await carTransportService.getMyRidePlans(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User ride plans fetched successfully",
    data: ridePlans,
  });
});

const getRidePlanById = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const planId = req.params.id;

  const ridePlan = await carTransportService.getRidePlanById(userId, planId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Ride plan fetched successfully",
    data: ridePlan,
  });
});



const createCarTransport = catchAsync(async (req, res) => {
  const token = req.headers.authorization;
  const files = req.files as any[];

  // form-data তে data টা আসবে string আকারে
  const parsedData = JSON.parse(req.body.data);

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

  const result = await carTransportService.cancelRide(
    userId,
    rideId,
    cancelReason
  );

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
      message: "Ride not found",
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Ride details fetched successfully",
    data: ride,
  });
});

// const getMyRidesCount = catchAsync(async (req, res) => {
//   const userId = req.user.id;
//   const role = req.user.role;

//   const stats = await carTransportService.getMyRidesCount(userId,role);

//   sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: "Total rides fetched successfully",
//     data: stats,
//   });
// });

// Get my rides (Rider side)
// const getMyRides = catchAsync(async (req, res) => {
//   const userId = req.user.id;

//   const rides = await carTransportService.getMyRides(userId);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: "My rides fetched successfully",
//     data: rides,
//   });
// });

const getMyRides = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role as UserRole;

  const rides = await carTransportService.getMyRides(userId, role);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "My rides fetched successfully",
    data: rides,
  });
});

const getMyPendingRides = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role as UserRole;

  const rides = await carTransportService.getMyPendingRides(userId, role);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "My rides fetched successfully",
    data: rides,
  });
});

const getRideHistory = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role as UserRole;

  const rides = await carTransportService.getRideHistory(userId, role);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Ride history fetched successfully",
    data: rides,
  });
});

const getDriverIncome = catchAsync(async (req, res) => {
  const token = req.headers.authorization;
  const result = await carTransportService.getDriverIncome(
    token as string,
    req.query
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Driver's income details retrieved successfully",
    data: result,
  });
});

const getMyStatsController = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  const stats = await carTransportService.getMyRidesOrTripsCount(userId, role);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Ride/Trip stats fetched successfully",
    data: stats,
  });
});

const getAllCarTransports = catchAsync(async (req, res) => {
  const filters = pick(req.query, ["searchTerm", "status", "paymentStatus"]);
  const options = pick(req.query, paginationFields);

  const result = await carTransportService.getAllCarTransports(
    filters,
    options
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Car transport requests retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getCarTransportById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await carTransportService.getCarTransportById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Car transport request retrieved successfully",
    data: result,
  });
});

const getCompletedRide = catchAsync(async (req, res) => {
  const { rideId } = req.params;
  const userId = req.user?.id; // from auth middleware

  const ride = await carTransportService.getCompletedRideFromDb(rideId, userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Ride completed successfully",
    data: ride,
  });
});

const getNewCarTransportsReq = catchAsync(async (req, res) => {
  const options = pick(req.query, paginationFields);

  const result = await carTransportService.getNewCarTransportsReq(options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "New car transport requests retrieved successfully",
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

const startJourney = catchAsync(async (req, res) => {
  const token = req.headers.authorization;
  const result = await carTransportService.startJourney(
    token as string,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Journey started successfully",
    data: result,
  });
});

const completeJourney = catchAsync(async (req, res) => {
  const token = req.headers.authorization;
  // const files = req.files as any[];

  const result = await carTransportService.completeJourney(
    token as string,
    req.body
    // files || []
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Journey completed successfully",
    data: result,
  });
});

export const carTransportController = {
  planCarTransport,
  getMyRidePlans,
  getRidePlanById,
  createCarTransport,
  cancelRide,
  getRideDetailsById, //new
  getCompletedRide,
  getNewCarTransportsReq, //new
  getMyRides,
  getMyPendingRides,
  getDriverIncome,
  getRideHistory,
  getCarTransportById,
  getMyStatsController,
  getAllCarTransports,
  getRideStatusById,
  assignDriver,
  handleDriverResponse,
  confirmArrival,
  startJourney,
  completeJourney,
  // getCarTransportList,
  // getCarTransportById,
  // updateCarTransport,
  // deleteCarTransport,
};
