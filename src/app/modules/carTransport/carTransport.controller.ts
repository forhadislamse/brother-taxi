import httpStatus from 'http-status';
import { carTransportService } from './carTransport.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';

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




// const updateCarTransport = catchAsync(async (req, res) => {
//   const result = await carTransportService.updateIntoDb(req.params.id, req.body);
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'CarTransport updated successfully',
//     data: result,
//   });
// });

// const deleteCarTransport = catchAsync(async (req, res) => {
//   const result = await carTransportService.deleteItemFromDb(req.params.id);
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'CarTransport deleted successfully',
//     data: result,
//   });
// });

export const carTransportController = {
  createCarTransport,
  // getCarTransportList,
  // getCarTransportById,
  // updateCarTransport,
  // deleteCarTransport,
};