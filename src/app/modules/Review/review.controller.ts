import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { reviewService } from "./review.service";

const createReview = catchAsync(async (req, res) => {
  const result = await reviewService.createReview(
    req.headers.authorization!,
    req.body
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Review created successfully",
    data: result,
  });
});

const getMyReviews = catchAsync(async (req, res) => {
  const result = await reviewService.getMyReviews(req.headers.authorization!);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Get my reviews successfully",
    data: result,
  });
});

const getFlaggedReviews = catchAsync(async (req, res) => {
  const result = await reviewService.getFlaggedReviews();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Admin: Only see bad reviews",
    data: result,
  });
});

export const reviewController = {
  createReview,
    getMyReviews,
    getFlaggedReviews,
};
