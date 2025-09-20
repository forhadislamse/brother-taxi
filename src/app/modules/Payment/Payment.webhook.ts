import { Request, Response } from "express";
import stripe from "../../../shared/stripe";
import prisma from "../../../shared/prisma";
import { PaymentStatus, NotificationType } from "@prisma/client";
import config from "../../../config";
// import { NotificationService } from "../Notifications/Notifications.services";

export const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig!,
      config.stripe.webhook_secret!
    );
  } catch (err: any) {
    console.error("Webhook Error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;

        // Update payment status
        await prisma.payment.updateMany({
          where: { stripePaymentIntentId: paymentIntent.id },
          data: {
            paymentStatus: PaymentStatus.COMPLETED,
          },
        });

        // Update transport status
        if (paymentIntent.metadata.transportId) {
          const transport = await prisma.carTransport.update({
            where: { id: paymentIntent.metadata.transportId },
            data: {
              paymentStatus: PaymentStatus.COMPLETED,
            },
            include: {
              sender: true,
              driver: true,
            },
          });

          // Send notifications
        //   if (transport.sender?.fcmToken) {
        //     await NotificationService.sendNotification(
        //       transport.sender.fcmToken,
        //       {
        //         title: "Payment Successful",
        //         body: `Your payment for order #${transport.id} was successful`,
        //         type: NotificationType.PAYMENT,
        //         data: JSON.stringify({
        //           transportId: transport.id,
        //           amount: paymentIntent.amount / 100,
        //         }),
        //         targetId: transport.id,
        //         slug: "payment-success",
        //       },
        //       transport.userId!
        //     );
        //   }
        }
        break;

      case "payment_intent.payment_failed":
        const failedPayment = event.data.object;

        await prisma.payment.updateMany({
          where: { stripePaymentIntentId: failedPayment.id },
          data: {
            paymentStatus: PaymentStatus.FAILED,
          },
        });

        if (failedPayment.metadata.transportId) {
          const transport = await prisma.carTransport.update({
            where: { id: failedPayment.metadata.transportId },
            data: {
              paymentStatus: PaymentStatus.FAILED,
            },
            include: {
              sender: true,
            },
          });

        //   if (transport.sender?.fcmToken) {
        //     await NotificationService.sendNotification(
        //       transport.sender.fcmToken,
        //       {
        //         title: "Payment Failed",
        //         body: `Your payment for order #${transport.id} has failed. Please try again.`,
        //         type: NotificationType.PAYMENT,
        //         data: JSON.stringify({
        //           transportId: transport.id,
        //           error: failedPayment.last_payment_error?.message,
        //         }),
        //         targetId: transport.id,
        //         slug: "payment-failed",
        //       },
        //       transport.userId!
        //     );
        //   }
        }
        break;

      case "charge.refunded":
        const refund = event.data.object;

        await prisma.payment.updateMany({
          where: { stripePaymentIntentId: refund.payment_intent as string },
          data: {
            paymentStatus: PaymentStatus.REFUNDED,
            refundId: refund.id,
          },
        });
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
};
