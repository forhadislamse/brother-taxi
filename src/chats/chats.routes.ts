import express from 'express';
import auth from '../app/middlewares/auth';
import { fileUploader } from '../helpars/fileUploader';
import { chatController } from './chats.controller';


const router = express.Router();

// Upload chat images
router.post(
  '/upload-images',
  auth(),
  fileUploader.uploadMultipleImage,
  chatController.uploadChatImages
);

export const chatRoutes = router; 