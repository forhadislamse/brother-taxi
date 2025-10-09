import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { estimateFareService } from './estimateFare.service';
import { JwtPayload } from 'jsonwebtoken';

const estimateFare = catchAsync(async (req, res) => {
  const token = req.headers.authorization;
  const { pickup,dropOff,pickupLat, pickupLng, dropOffLat, dropOffLng ,duration} = req.body;

  if (!pickupLat || !pickupLng || !dropOffLat || !dropOffLng ||!pickup||!dropOff) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: "Pickup and dropoff coordinates are required",
    });
  }

  const result = await estimateFareService.calculateFare(token as string, {
    pickup,
    dropOff,
    pickupLat,
    pickupLng,
    dropOffLat,
    dropOffLng,
    duration: duration ?? 0,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Fare estimate fetched successfully",
    data: result,
  });
});

const getMyEstimateFareList = catchAsync(async (req, res) => {
   const user = req.user as JwtPayload;
  const result = await estimateFareService.getMyEstimateFareList(user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'My EstimateFare list retrieved successfully',
    data: result,
  });
});

// const getEstimateFareList = catchAsync(async (req, res) => {
//   const result = await estimateFareService.getListFromDb();
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'EstimateFare list retrieved successfully',
//     data: result,
//   });
// });

// const getEstimateFareById = catchAsync(async (req, res) => {
//   const result = await estimateFareService.getByIdFromDb(req.params.id);
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'EstimateFare details retrieved successfully',
//     data: result,
//   });
// });

// const updateEstimateFare = catchAsync(async (req, res) => {
//   const result = await estimateFareService.updateIntoDb(req.params.id, req.body);
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'EstimateFare updated successfully',
//     data: result,
//   });
// });

// const deleteEstimateFare = catchAsync(async (req, res) => {
//   const result = await estimateFareService.deleteItemFromDb(req.params.id);
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'EstimateFare deleted successfully',
//     data: result,
//   });
// });

export const estimateFareController = {
  estimateFare,
  getMyEstimateFareList,
  // getEstimateFareList,
  // getEstimateFareById,
  // updateEstimateFare,
  // deleteEstimateFare,
};