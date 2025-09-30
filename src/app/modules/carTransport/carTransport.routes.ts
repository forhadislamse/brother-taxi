import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { carTransportController } from "./carTransport.controller";
import { carTransportValidation } from "./carTransport.validation";
import { USER_ROLE } from "../../../enums/enums";
import { fileUploader } from "../../../helpars/fileUploader";

const router = express.Router();

router.post(
  "/ride-plan",
  auth(USER_ROLE.RIDER),
  carTransportController.planCarTransport
);

router.get(
  "/my-ride-plans",
  auth(USER_ROLE.RIDER),
  carTransportController.getMyRidePlans
);

router.get(
  "/ride-plan/:id",
  auth(USER_ROLE.RIDER),
  carTransportController.getRidePlanById
);


router.post(
  "/create",
  auth(USER_ROLE.RIDER),
  fileUploader.upload.array("images", 5),
  carTransportController.createCarTransport
);



router.get(
  "/all",
  auth(USER_ROLE.ADMIN), // শুধু ADMIN access
  carTransportController.getAllCarTransports
);

// Rider get all my rides
router.get("/my-rides", auth(), carTransportController.getMyRides);

// Rider get all my pending rides
router.get("/my-rides-pending",auth(), carTransportController.getMyPendingRides);

// Rider get ride history
router.get("/my-rides-history", auth(), carTransportController.getRideHistory);

// Rider get ride history
router.get("/my-cancelled-rides", auth(), carTransportController.getCancelledRides);

// Rider এর total rides count fetch করার route
router.get("/my-rides/count", auth(), carTransportController.getMyStatsController);

// Get driver's income details
router.get(
  "/driver-income",
  auth(),
  carTransportController.getDriverIncome
);

router.get(
  "/single/:id",
  auth(),
  carTransportController.getCarTransportById
);

router.get(
  "/new-requests",
  auth(USER_ROLE.ADMIN),
  carTransportController.getNewCarTransportsReq
);

router.get(
  "/ride-status/:id",
  auth(),
  carTransportController.getRideStatusById
);

// Rider cancel ride
router.patch(
  "/:id/cancel",
  auth(USER_ROLE.RIDER),
  carTransportController.cancelRide
);

// GET ride details by ID
router.get(
  "/:id",
  auth(USER_ROLE.DRIVER, USER_ROLE.RIDER),
  carTransportController.getRideDetailsById
);

// Admin assigns driver to car transport
router.patch(
  "/assign-driver",
  auth(USER_ROLE.ADMIN),
  carTransportController.assignDriver
);

// Driver accepts or declines
router.patch(
  "/driver-response",
  auth(USER_ROLE.DRIVER), // শুধু driver access করতে পারবে
  carTransportController.handleDriverResponse
);

router.patch("/confirm-arrival", auth(), carTransportController.confirmArrival);

// Driver starts the journey
router.patch("/start-ride", auth(), carTransportController.startJourney);

// Driver completes the journey
router.patch("/complete-ride", auth(), carTransportController.completeJourney);

// Rider fetches completed ride by rideId
router.get(
  "/:rideId/completed",
  auth(), // verify rider token
  carTransportController.getCompletedRide
);

// router.get('/', auth(), carTransportController.getCarTransportList);

// router.get('/:id', auth(), carTransportController.getCarTransportById);

// router.put(
// '/:id',
// auth(),
// validateRequest(carTransportValidation.updateSchema),
// carTransportController.updateCarTransport,
// );

// router.delete('/:id', auth(), carTransportController.deleteCarTransport);

export const carTransportRoutes = router;
