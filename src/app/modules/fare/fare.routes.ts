import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { fareController } from './fare.controller';
import { fareValidation } from './fare.validation';

const router = express.Router();

// ✅ Current active fare
// router.get("/",auth("ADMIN"), fareController.getALlFare);

router.get("/current", fareController.getCurrentFare);
// ✅ Create new fare
router.post("/", auth("ADMIN"), fareController.createFare);

// ✅ Update existing fare
router.patch("/:fareId", auth("ADMIN"), fareController.updateFare);

// ✅ Fare history
router.get("/history", auth("ADMIN"), fareController.getFareHistory);

export const fareRoutes = router;