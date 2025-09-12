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