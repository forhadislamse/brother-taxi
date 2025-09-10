import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { fareService} from './fare.service';

const createFare = catchAsync(async (req, res) => {
  const fare = await fareService.createFare(req.body);
  res.status(httpStatus.CREATED).send({
    success: true,
    message: "Fare created successfully",
    data: fare,
  });
});

const getCurrentFare = catchAsync(async (req, res) => {
  const fare = await fareService.getCurrentFare();
  res.status(httpStatus.OK).send({
    success: true,
    message: "Current fare retrieved successfully",
    data: fare,
  });
});

// const getALlFare = catchAsync(async (req, res) => {
//   const fares = await fareService.getAllFare();
//   res.status(httpStatus.OK).send({
//     success: true,
//     message: "All fare retrieved successfully",
//     data: fares,
//   });
// });

const updateFare = catchAsync(async (req, res) => {
  const fare = await fareService.updateFare(req.params.fareId, req.body);
  res.status(httpStatus.OK).send({
    success: true,
    message: "Fare updated successfully",
    data: fare,
  });
});

const getFareHistory = catchAsync(async (req, res) => {
  const fares = await fareService.getFareHistory();
  res.status(httpStatus.OK).send({
    success: true,
    message: "Fare history retrieved successfully",
    data: fares,
  });
});

export const fareController = {
  getCurrentFare,
  createFare,
  updateFare,
  getFareHistory,

};