import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { carTransportController } from './carTransport.controller';
import { carTransportValidation } from './carTransport.validation';
import { USER_ROLE } from '../../../enums/enums';
import { fileUploader } from '../../../helpars/fileUploader';

const router = express.Router();

router.post(
  "/create",
  auth(USER_ROLE.RIDER),
  fileUploader.upload.array('images', 5),
  carTransportController.createCarTransport
);


router.get(
  "/all",
  auth(USER_ROLE.ADMIN), // শুধু ADMIN access
  carTransportController.getAllCarTransports
);


// Rider get all my rides
router.get(
  "/my-rides",
  auth(),
  carTransportController.getMyRides
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
router.get('/:id', auth(USER_ROLE.DRIVER,USER_ROLE.RIDER), carTransportController.getRideDetailsById);


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

router.patch(
  "/confirm-arrival",
  auth(),
  carTransportController.confirmArrival
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