import express from "express";
import { USER_ROLE } from "../../../enums/enums";
import auth from "../../middlewares/auth";
import { reviewController } from "./review.controller";

const router = express.Router();

// router.post("/",auth(), reviewController.createReview);
// // router.get("/event/:eventId",auth(), reviewController.getReviewsByEvent);

// Rider/Driver review APIs
router.post(
  "/create",
  auth(USER_ROLE.RIDER, USER_ROLE.DRIVER),
  reviewController.createReview
);

router.get("/my-reviews", auth(), reviewController.getMyReviews); // profile reviews

router.get(
  "/flagged",
  auth(USER_ROLE.ADMIN),
  reviewController.getFlaggedReviews
); // admin only

export const reviewRoutes = router;
