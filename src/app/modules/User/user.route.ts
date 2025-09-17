import express from "express";
import validateRequest from "../../middlewares/validateRequest";
// import { UserValidation } from "./user.validation";
import { userController } from "./user.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { fileUploader } from "../../../helpars/fileUploader";
import multer from "multer";

const router = express.Router();
// Configure multer for user profile updates
const storage = multer.memoryStorage();
const upload = multer({ storage });
const licenseUpload = upload.fields([
  // { name: "DriverLicenseImage", maxCount: 1 },
  { name: "licenseFrontSide", maxCount: 1 },
  { name: "licenseBackSide", maxCount: 1 },
]);

// 
router.post(
  "/create-user/register",
  // validateRequest(UserValidation.CreateUserValidationSchema),
  userController.createUser
);

router.get(
  "/get-me",
  auth(),
  userController.getMyProfile
);

// License upload


router.patch(
  "/upload-license",
  auth(),
  licenseUpload,
  userController.uploadDriverLicense
);

router.patch(
  "/update-profile",
  auth(),
  // validateRequest(UserValidation.userUpdateSchema),
  fileUploader.uploadSingle,
  userController.updateProfileController
);

router.get("/drivers/pending", auth(), userController.getDriversPendingApproval);

router.get("/all", auth(), userController.getAllUser);

router.get("/all-user-length", auth(), userController.adminDashboardUserLength);

// Admin approves or rejects a driver
router.put("/drivers/approve", auth(), userController.updateDriverApprovalStatus);

// toggle online status
router.patch(
  "/toggle-online-status",
  auth(),
  userController.toggleOnlineStatus
);

// toggle notification status
router.patch(
  "/toggle-notification-status",
  auth(),
  userController.toggleNotificationOnOff
);

// router.post("/demo-class", auth(), fileUploader.uploadFile, userController.postDemoVideo )


export const userRoutes = router;
