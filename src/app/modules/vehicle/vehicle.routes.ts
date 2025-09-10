import express from "express";
import auth from "../../middlewares/auth";
import { driverController } from "./vehicle.controller";
import { fileUploader } from "../../../helpars/fileUploader";
const router = express.Router();

// Create Vehicle
// router.post('/create', auth(), driverController.createVehicle);

router.post(
  "/create",
  auth(),
  fileUploader.uploadSingle,
  driverController.createVehicle
);

router.get("/all", auth(), driverController.getAllVehicles);

router.get("/my-vehicles", auth(), driverController.getUserVehicles);

router.get("/single/:id", auth(), driverController.getVehicleById);

router.put(
  "/update/:vehicleId",
  auth(),
  fileUploader.uploadSingle,
  driverController.updateVehicle
);




// Complete Driver Signup (personal + vehicle info)
// router.post('/signup', auth(), driverController.signupAsDriver);

// // Get Driver Profile
// router.get('/me', auth(), driverController.getDriverProfile);

export const vehicleRoutes = router;