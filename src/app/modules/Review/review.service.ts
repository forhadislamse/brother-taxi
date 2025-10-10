import httpStatus from "http-status";
import config from "../../../config";
import ApiError from "../../../errors/ApiErrors";
import { jwtHelpers } from "../../../helpars/jwtHelpers";
import prisma from "../../../shared/prisma";
import { NotificationType, TransportStatus } from "@prisma/client";
import { NotificationService } from "../Notification/Notification.service";


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

//   const review = await prisma.review.create({
//     data: {
//       carTransportId,
//       reviewerId,
//       revieweeId,
//       rating,
//       comment,
//       isFlagged: rating <= 2, // শুধু rider হলে admin দেখবে
//     },
//     include: {
//       reviewer: { select: { id: true, fullName: true } },
//       reviewee: { select: { id: true, fullName: true } },
//     },
//   });
// await updateUserRatingStats(revieweeId);

const review = await prisma.review.create({
  data: {
    carTransportId,
    reviewerId,
    revieweeId,
    rating,
    comment,
    isFlagged: rating <= 2, // শুধু rider → driver হলে admin দেখবে
  },
  include: {
    reviewer: { select: { id: true, fullName: true, role: true } },
    reviewee: { select: { id: true, fullName: true, role: true } },
  },
});

// Update average rating
await updateUserRatingStats(revieweeId);

// Check low rating case
if (review.isFlagged) {
  // যদি reviewer হয় RIDER এবং reviewee হয় DRIVER
  if (review.reviewer.role === "RIDER" && review.reviewee.role === "DRIVER") {
    const admin = await prisma.user.findFirst({
      where: { role: "ADMIN", fcmToken: { not: null } },
      select: { id: true, fcmToken: true, fullName: true },
    });

    if (admin?.fcmToken) {
      const notificationPayload = {
        title: "New Driver Complaint",
        body: `${review.reviewer.fullName} gave ${review.rating}-star to ${review.reviewee.fullName}.`,
        type: NotificationType.REVIEW_ALERT,
        data: JSON.stringify({ reviewId: review.id }), // ✅ fixed
        // data: { reviewId: review.id },
        targetId: review.revieweeId,
        slug: "review-alert",
      };

      //  Send push notification to Admin
      await NotificationService.sendNotification(
        admin.fcmToken,
        notificationPayload,
        reviewerId
      );

      // 🗂️ Save in DB for history
      await prisma.notification.create({
        data: {
          title: notificationPayload.title,
          body: notificationPayload.body,
          type: notificationPayload.type,
          userId: admin.id, // admin notification পাচ্ছে
          targetId: review.id,
          createdAt: new Date(),
        },
      });
    }
  } else {
    // driver → rider দিলে শুধু DB তে save হবে, admin notification যাবে না
    await prisma.notification.create({
      data: {
        title: "Low rating received",
        body: `${review.reviewer.fullName} gave ${review.rating}-star to ${review.reviewee.fullName}.`,
        type: NotificationType.REVIEW_ALERT,
        userId: review.revieweeId,
        targetId: review.id,
        createdAt: new Date(),
      },
    });
  }
}

  return review;
};




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
      reviewer: { select: { id: true, fullName: true, role: true,profileImage:true } },
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
