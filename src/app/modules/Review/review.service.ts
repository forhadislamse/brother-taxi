import httpStatus from "http-status";
import config from "../../../config";
import ApiError from "../../../errors/ApiErrors";
import { jwtHelpers } from "../../../helpars/jwtHelpers";
import prisma from "../../../shared/prisma";
import { TransportStatus } from "@prisma/client";

// const createReviewService = async (studentId: string, payload: {
//   rating: number;
//   comment: string;
//   tutorId: string;
// }) => {
//   const { rating, comment, tutorId } = payload;
//   if (!rating || !comment || !tutorId) {
//     throw new ApiError(httpStatus.BAD_REQUEST,"Rating, comment, and tutor ID are required");
//   }

//   if(rating < 1 || rating > 5) {
//     throw new ApiError(httpStatus.BAD_REQUEST,"Rating must be between 1 and 5");
//   }

//   const review = await prisma.review.create({
//     data: {
//       rating,
//       comment,
//       studentId,
//       tutorId,
//     },
//   });

//    // Step 2: Get all reviews for this tutor
//   const allReviews = await prisma.review.findMany({
//     where: { tutorId },
//     select: { rating: true },
//   });

//   // Step 3: Calculate average rating
//   const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
//   const avgRating = totalRating / allReviews.length;

//   await prisma.user.update({
//     where: { id: tutorId },
//     data: { rating: avgRating },
//   });

//   if (!review) {
//     throw new ApiError(500,"Failed to create review");
//   }

//   return review;
// };

//  Create Review (Rider or Driver)
const createReview = async (
  userToken: string,
  payload: { carTransportId: string; rating: number; comment?: string }
) => {
  const { carTransportId, rating, comment } = payload;
  const decoded = jwtHelpers.verifyToken(userToken, config.jwt.jwt_secret!);

  const transport = await prisma.carTransport.findUnique({
    where: { id: carTransportId },
  });
  if (!transport)
    throw new ApiError(httpStatus.NOT_FOUND, "Car transport not found");
  if (transport.status !== TransportStatus.COMPLETED) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Can only review completed transports"
    );
  }

  // Check if this user is part of the ride
  if (
    decoded.id !== transport.userId &&
    decoded.id !== transport.assignedDriver
  ) {
    throw new ApiError(httpStatus.FORBIDDEN, "Not part of this ride");
  }

  // Reviewer = current user
  const reviewerId = decoded.id;

  // Reviewee = opposite party
  const revieweeId =
    reviewerId === transport.userId
      ? transport.assignedDriver!
      : transport.userId;

  // Prevent duplicate review
  const existing = await prisma.review.findFirst({
    where: { reviewerId, carTransportId },
  });
  if (existing) throw new ApiError(httpStatus.CONFLICT, "Already reviewed");

  const review = await prisma.review.create({
    data: {
      carTransportId,
      reviewerId,
      revieweeId,
      rating,
      comment,
      isFlagged: rating <= 2, // শুধু rider হলে admin দেখবে
    },
    include: {
      reviewer: { select: { id: true, fullName: true } },
      reviewee: { select: { id: true, fullName: true } },
    },
  });

  // Update average
//   console.log("Updating stats for user:", revieweeId);
await updateUserRatingStats(revieweeId);
// console.log("Updated stats successfully");

  return review;
};

// Average Rating calculation
// const updateUserRatingStats = async (userId: string) => {
//   const reviews = await prisma.review.findMany({
//     where: { revieweeId: userId },
//   });

//   const avg =
//     reviews.length > 0
//       ? reviews.reduce((a, b) => a + b.rating, 0) / reviews.length
//       : 0;

//   await prisma.user.update({
//     where: { id: userId },
//     data: { averageRating: avg },
//   });
// };
const updateUserRatingStats = async (userId: string) => {
  const stats = await prisma.review.aggregate({
    where: { revieweeId: userId },
    _avg: { rating: true },
    _count: { rating: true }
  });
//   console.log("Stats result:", stats);

  const updateUser=await prisma.user.update({
    where: { id: userId },
    data: {
      averageRating: stats._avg.rating ?? 0,
      reviewCount: stats._count.rating,
    },
  });
//   console.log("Updated user:", updateUser);
};


// Get my received reviews (for profile)
const getMyReviews = async (userToken: string) => {
  const decoded = jwtHelpers.verifyToken(userToken, config.jwt.jwt_secret!);

  return prisma.review.findMany({
    where: { revieweeId: decoded.id },
    include: {
      reviewer: { select: { id: true, fullName: true, profileImage: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

//  Admin:can see Only bad reviews from rider → driver
const getFlaggedReviews = async () => {
  return prisma.review.findMany({
    where: {
      isFlagged: true, // bad review
      reviewer: {
        role: "RIDER", // only rider's reviews
      },
    },
    include: {
      reviewer: { select: { id: true, fullName: true, role: true } },
      reviewee: { select: { id: true, fullName: true, role: true } },
      carTransport: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const reviewService = {
  createReview,
  getMyReviews,
  getFlaggedReviews,
};
