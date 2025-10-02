// // import { UserRole } from '@prisma/client';
// import express from 'express';
// import { PaymentController } from './Payment.controller';
// import auth from '../../middlewares/auth';
// import { UserRole } from '@prisma/client';

// const router = express.Router();

// router.post('/', auth(), PaymentController.createPrice);
// router.get(
//     '/tutor-earning',
//     auth(),
//     PaymentController.getAllTutorEarning
// );

// router.get('/get-all-payments', auth(UserRole.ADMIN), PaymentController.getAllPayment);
// router.get('/get-payment/:id', auth(), PaymentController.getSinglePayment);

// router.get('/my-payments', auth(), PaymentController.getMyPayments);

// export const paymentRoutes = router;

import express from "express";
import auth from "../../middlewares/auth";
import { PaymentController } from "./Payment.controller";
import { handleStripeWebhook } from "./Payment.webhook";
import { USER_ROLE } from "../../../enums/enums";
// import { PaymentController } from "./payment.controller";
// import { ENUM_USER_ROLE } from "../../../enums/user";
// import { handleStripeWebhook } from "./payment.webhook";

const router = express.Router();

//4.  cash payment
router.post("/create-payment", auth(), PaymentController.handlePayment);
//6. get payments for all roles rider/driver/admin
router.get("/get-payments", auth(), PaymentController.getPayments);

//7. Get all transactions with filters (Admin only)
router.get(
  "/transactions",
  auth(USER_ROLE.ADMIN),
  PaymentController.getAllTransactions
);

// Payment routes
router.post("/process", auth(), PaymentController.processPayment);

// if payment requires capture
router.post("/capture", auth(), PaymentController.capturePayment);

//1. Create and save card
router.post("/create-card", auth(), PaymentController.createCard);

//2. get save cards
router.get("/saved-cards", auth(), PaymentController.getSavedCards);

//3. with save card payment
router.post("/card-payment", auth(), PaymentController.processCardPayment);

//5. make payment for card/cash/wallet
router.post("/wallet-payment", auth(), PaymentController.handleWalletPayment);

//8. refund
router.post(
  "/refund/:paymentId",
  auth(USER_ROLE.ADMIN),
  PaymentController.refundPayment
);

// 11. Create Stripe account for driver
router.post(
  "/create-stripe-account",
  auth(),
  PaymentController.createStripeAccount
);

// Stripe webhook
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

//10. Get payment history
router.get("/", auth(), PaymentController.getPayments);


//9. Get refunded payments
router.get("/refunded-payments", auth(), PaymentController.getRefundedPayments);

export const PaymentRoutes = router;
