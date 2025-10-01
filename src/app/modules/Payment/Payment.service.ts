import {
  PaymentMethod,
  PaymentStatus,
  FeeType,
  NotificationType,
  TransportStatus,
} from "@prisma/client";
import prisma from "../../../shared/prisma";
import { jwtHelpers } from "../../../helpars/jwtHelpers";
import config from "../../../config";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import {
  IPaymentFilterRequest,
  IStripePaymentRequest,
  IRefundRequest,
  ICreateCardRequest,
  ITransactionFilterRequest,
} from "./Payment.interface";
import stripe from "../../../shared/stripe";
// import { NotificationService } from "../Notifications/Notifications.services";

// create  cash payment service
const handlePayment = async (
  userToken: string,
  transportId: string,
  paymentMethod: PaymentMethod,
  cardId?: string
) => {
  try {
    const decodedToken = jwtHelpers.verifyToken(
      userToken,
      config.jwt.jwt_secret!
    );

    const carTransport = await prisma.carTransport.findUnique({
      where: { id: transportId },
      include: {
        sender: true,
        driver: true,
      },
    });

    if (!carTransport) {
      throw new ApiError(httpStatus.NOT_FOUND, "Car transport not found");
    }

    if (carTransport.userId !== decodedToken.id) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "Not authorized to make payment"
      );
    }

    // Check if payment is already completed or in process
    if (
      carTransport.paymentStatus === PaymentStatus.COMPLETED ||
      carTransport.paymentStatus === PaymentStatus.REQUIRES_CAPTURE
    ) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Payment has already been processed for this car transport"
      );
    }

    const now = new Date();
    const expiryDate = new Date(Date.now() + 60 * 1000);

    // Handle Cash Payment
    if (paymentMethod === PaymentMethod.CASH) {
      const payment = await prisma.payment.create({
        data: {
          paymentId: `cash_${Date.now()}`,
          transportId: carTransport.id,
          senderId: carTransport.userId,
          receiverId: carTransport.assignedDriver,
          amount: carTransport.totalAmount || 0,
          driverFee:
            (carTransport.totalAmount || 0) - (carTransport.platformFee || 0),
          platformFee: carTransport.platformFee || 0,
          platformFeeType:
            (carTransport.platformFeeType as FeeType) || FeeType.PERCENTAGE,
          paymentMethod: PaymentMethod.CASH,
          paymentStatus: PaymentStatus.COMPLETED,
        },
      });

      await prisma.carTransport.update({
        where: { id: carTransport.id },
        data: {
          paymentStatus: PaymentStatus.COMPLETED,
          isPayment: true,
          paymentMethod: PaymentMethod.CASH,
        },
      });

      // Send notification to courier about cash payment
      //   if (carTransport.assignedDriver && carTransport.driver?.fcmToken) {
      //     await NotificationService.sendNotification(
      //       carTransport.driver.fcmToken,
      //       {
      //         title: "New Parcel With Cash Payment Requested For You",
      //         body: `You Have a new parcel request with cash payment. Sender has confirmed cash payment of ${carTransport.totalAmount} for order #${carTransport.id}. Please collect the payment upon delivery.`,
      //         type: NotificationType.PAYMENT,
      //         data: JSON.stringify({
      //           transportId: carTransport.id,
      //           amount: carTransport.totalAmount,
      //           paymentMethod: PaymentMethod.CASH,
      //         }),
      //         targetId: carTransport.id,
      //         slug: "cash-payment",
      //       },
      //       carTransport.assignedDriver
      //     );
      //   }
      //   if (carTransport.assignedDriver) {
      //     await NotificationService.saveNotification(
      //       {
      //         title: "New Parcel With Cash Payment Requested For You",
      //         body: `You Have a new parcel request with cash payment. Sender has confirmed cash payment of ${carTransport.totalAmount} for order #${carTransport.id}. Please collect the payment upon delivery.`,
      //         type: NotificationType.PAYMENT,
      //         data: JSON.stringify({
      //           transportId: carTransport.id,
      //           amount: carTransport.totalAmount,
      //           paymentMethod: PaymentMethod.CASH,
      //         }),
      //         targetId: carTransport.id,
      //         slug: "cash-payment",
      //         fcmToken: carTransport.driver?.fcmToken ?? undefined,
      //       },
      //       carTransport.assignedDriver
      //     );
      //   }

      return { payment };
    }
  } catch (error) {
    console.error("Payment error:", error);
    throw error;
  }
};

const handleWalletPayment = async (
  userToken: string,
  transportId: string,
  paymentMethod: PaymentMethod,
  cardId?: string
) => {
  // Verify user token
  const decodedToken = jwtHelpers.verifyToken(
    userToken,
    process.env.JWT_SECRET!
  );

  // Fetch user with walletBalance
  const user = await prisma.user.findUnique({
    where: { id: decodedToken.id },
    select: {
      id: true,
      fullName: true,
      walletBalance: true,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  // Fetch transport
  const carTransport = await prisma.carTransport.findUnique({
    where: { id: transportId },
    include: { driver: true },
  });

  if (!carTransport) {
    throw new ApiError(httpStatus.NOT_FOUND, "Car transport not found");
  }

  // Check user authorization
  if (carTransport.userId !== decodedToken.id) {
    throw new ApiError(httpStatus.FORBIDDEN, "Not authorized to make payment");
  }

  // Check if payment already completed
  if (
    carTransport.paymentStatus === PaymentStatus.COMPLETED ||
    carTransport.paymentStatus === PaymentStatus.REQUIRES_CAPTURE
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Payment has already been processed for this transport"
    );
  }

  // Check wallet balance
  if ((user.walletBalance || 0) < (carTransport.totalAmount || 0)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Insufficient wallet balance");
  }

  // Deduct wallet balance
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      walletBalance: {
        decrement: carTransport.totalAmount || 0,
      },
    
    },
  });

  // Create payment record
  const payment = await prisma.payment.create({
    data: {
      paymentId: `wallet_${Date.now()}`,
      transportId: carTransport.id,
      senderId: carTransport.userId,
      receiverId: carTransport.assignedDriver,
      amount: carTransport.totalAmount || 0,
      driverFee:
        (carTransport.totalAmount || 0) - (carTransport.platformFee || 0),
      platformFee: carTransport.platformFee || 0,
      platformFeeType: (carTransport.platformFeeType as FeeType) || FeeType.PERCENTAGE,
      paymentMethod: PaymentMethod.WALLET,
      paymentStatus: PaymentStatus.COMPLETED,
    },
  });

  // Update transport
  await prisma.carTransport.update({
    where: { id: carTransport.id },
    data: {
      paymentStatus: PaymentStatus.COMPLETED,
      isPayment: true,
      paymentMethod: PaymentMethod.WALLET,
    },
  });

  // Optional: send notification to driver if needed

  return {
    payment,
    walletBalance: updatedUser.walletBalance,
  };
};




// Get payments based on user role and filter
// const getPayments = async (
//   userToken: string,
//   filter: IPaymentFilterRequest
// ) => {
//   const decodedToken = jwtHelpers.verifyToken(
//     userToken,
//     config.jwt.jwt_secret!
//   );

//   const {
//     status,
//     page = 1,
//     limit = 10,
//     sortBy = "createdAt",
//     sortOrder = "desc",
//     startDate,
//     endDate,
//   } = filter;

//   const skip = (page - 1) * limit;

//   // Build where condition based on user role
//   const where: any = {};

//   if (decodedToken.role === "User") {
//     where.senderId = decodedToken.id;
//   } else if (decodedToken.role === "Driver") {
//     where.receiverId = decodedToken.id;
//   } else if (decodedToken.role === "Technician") {
//     where.receiverId = decodedToken.id;
//   }

//   if (status) {
//     where.paymentStatus = status;
//   }

//   if (startDate && endDate) {
//     where.createdAt = {
//       gte: new Date(startDate),
//       lte: new Date(endDate),
//     };
//   }

//   // Get total count for pagination
//   const total = await prisma.payment.count({ where });

//   const payments = await prisma.payment.findMany({
//     where,
//     skip,
//     take: limit,
//     orderBy: {
//       [sortBy]: sortOrder,
//     },
//   });

//   return {
//     meta: {
//       page,
//       limit,
//       total,
//       totalPage: Math.ceil(total / limit),
//     },
//     data: payments,
//   };
// };

const getPayments = async (
  userToken: string,
  filter: IPaymentFilterRequest
) => {
  const decodedToken = jwtHelpers.verifyToken(
    userToken,
    config.jwt.jwt_secret!
  );

  const {
    status,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
    startDate,
    endDate,
  } = filter;

  const skip = (page - 1) * limit;

  // Build where condition based on user role
  const where: any = {};

  if (decodedToken.role === "RIDER") {
    where.senderId = decodedToken.id;
  } else if (decodedToken.role === "DRIVER") {
    where.receiverId = decodedToken.id;
  } else if (decodedToken.role === "ADMIN") {
    // Admin সব payment দেখতে পারবে, তাই no filter
  } else {
    throw new ApiError(httpStatus.FORBIDDEN, "Role not authorized");
  }

  if (status) {
    where.paymentStatus = status;
  }

  if (startDate && endDate) {
    where.createdAt = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  // Get total count for pagination
  const total = await prisma.payment.count({ where });

  const payments = await prisma.payment.findMany({
    where,
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
  });

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: payments,
  };
};


// Get all transactions for admin
const getAllTransactions = async (
  userToken: string,
  filters: ITransactionFilterRequest
) => {
  const decodedToken = jwtHelpers.verifyToken(
    userToken,
    config.jwt.jwt_secret!
  );

  if (decodedToken.role !== "ADMIN" && decodedToken.role !== "SUPER_ADMIN") {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Only admin can view all transactions"
    );
  }

  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
    startDate,
    endDate,
    isPlatformFeeRelease,
    isCourierFeeRelease,
    paymentStatus,
    paymentMethod,
  } = filters;

  const skip = (page - 1) * limit;

  // Build where condition
  const where: any = {};

  if (startDate && endDate) {
    where.createdAt = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  if (paymentStatus) {
    where.paymentStatus = paymentStatus;
  }

  if (paymentMethod) {
    where.paymentMethod = paymentMethod;
  }

  // sum of amount
  // const aggregateResult = await prisma.payment.aggregate({
  //   where,
  //   _sum: {
  //     amount: true,
  //   },
  // });

  const aggregateResult = await prisma.payment.aggregate({
  where: {
    ...where,
    paymentStatus: { not: "REFUNDED" }, // refund বাদ দেওয়া হলো
  },
  _sum: {
    amount: true,
  },
});

  const allAmount = aggregateResult._sum.amount || 0;

  // Get total count for pagination
  const total = await prisma.payment.count({ where });

  const transactions = await prisma.payment.findMany({
    where,
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
  });

  return {
    meta: {
      page,
      limit,
      total,
      allAmount,
      totalPages: Math.ceil(total / limit),
    },
    data: transactions,
  };
};

// Create Stripe account for user
const createStripeAccount = async (userToken: string) => {
  try {
    const decodedToken = jwtHelpers.verifyToken(
      userToken,
      config.jwt.jwt_secret!
    );

    const user = await prisma.user.findUnique({
      where: { id: decodedToken.id },
    });

    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    const account = await stripe.accounts.create({
      type: "express",
      country: "US",
      email: user.email || undefined,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    await prisma.user.update({
      where: { id: decodedToken.id },
      data: {
        stripeAccountId: account.id,
      },
    });

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${config.client.url}/payment-refresh`,
      return_url: `${config.client.url}/payment-success`,
      type: "account_onboarding",
    });

    return accountLink.url;
  } catch (error) {
    console.error("Error creating Stripe account:", error);
    throw error;
  }
};

//create card payment service
const handleCardPayment = async (
  userToken: string,
  { transportId, paymentMethod, cardId, setupIntentData }: IStripePaymentRequest
) => {
  try {
    const decodedToken = jwtHelpers.verifyToken(
      userToken,
      config.jwt.jwt_secret!
    );

    const user = await prisma.user.findUnique({
      where: { id: decodedToken.id },
      include: {
        savedCards: true,
      },
    });

    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    const transport = await prisma.carTransport.findUnique({
      where: { id: transportId },
      include: {
        sender: true,
        driver: true,
      },
    });

    // Check if payment is already completed or in process
    // if (
    //   transport?.paymentStatus === PaymentStatus.COMPLETED ||
    //   transport?.paymentStatus === PaymentStatus.REQUIRES_CAPTURE
    // ) {
    //   throw new ApiError(
    //     httpStatus.BAD_REQUEST,
    //     "Payment has already been processed for this transport"
    //   );
    // }

    // Check if payment is already completed
    if (transport?.paymentStatus === PaymentStatus.COMPLETED) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Payment has already been processed for this transport"
      );
    }

    if (!transport) {
      throw new ApiError(httpStatus.NOT_FOUND, "Transport not found");
    }

    // Check if user has Stripe account
    if (!user.stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: user.fullName || undefined,
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customer.id },
      });

      user.stripeCustomerId = customer.id;
    }

    let paymentMethodId = cardId;

    // If setupIntentData is provided, save the card
    if (
      setupIntentData?.payment_method &&
      setupIntentData.save_payment_method
    ) {
      const paymentMethod = await stripe.paymentMethods.attach(
        setupIntentData.payment_method,
        { customer: user.stripeCustomerId }
      );

      // Save card details
      await prisma.savedCard.create({
        data: {
          userId: user.id,
          cardType: paymentMethod.card!.brand,
          last4: paymentMethod.card!.last4,
          expiryMonth: paymentMethod.card!.exp_month,
          expiryYear: paymentMethod.card!.exp_year,
          stripePaymentMethodId: paymentMethod.id,
          isDefault: user.savedCards.length === 0,
        },
      });

      paymentMethodId = paymentMethod.id;
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round((transport.totalAmount || 0) * 100), // Convert to cents
      currency: "usd",
      customer: user.stripeCustomerId,
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
      metadata: {
        transportId: transport.id,
        orderId: transport.id || "",
        senderId: transport.userId || "",
        driverId: transport.assignedDriver || "",
      },
    });

     // Determine paymentStatus based on Stripe status
    const paymentStatus =
      paymentIntent.status === "succeeded"
        ? PaymentStatus.COMPLETED
        : PaymentStatus.REQUIRES_CAPTURE;


    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        paymentId: paymentIntent.id,
        transportId: transport.id,
        senderId: transport.userId,
        receiverId: transport.assignedDriver,
        amount: transport.totalAmount || 0,
        driverFee: (transport.totalAmount || 0) - (transport.platformFee || 0),
        platformFee: transport.platformFee || 0,
        platformFeeType:
          (transport.platformFeeType as FeeType) || FeeType.PERCENTAGE,
        paymentMethod: PaymentMethod.CARD,
        // paymentStatus: PaymentStatus.REQUIRES_CAPTURE,
        paymentStatus,
        stripePaymentIntentId: paymentIntent.id,
      },
    });

    // Update transport status
    await prisma.carTransport.update({
      where: { id: transport.id },
      data: {
        // paymentStatus: PaymentStatus.REQUIRES_CAPTURE,
        paymentStatus,
        isPayment: true,
        paymentMethod: PaymentMethod.CARD,
      },
    });

    // Send notifications
    // if (transport.driver?.fcmToken) {
    //   await NotificationService.sendNotification(
    //     transport.driver.fcmToken,
    //     {
    //       title: "Card Payment Received",
    //       body: `Payment received for order #${transport.id}`,
    //       type: NotificationType.PAYMENT,
    //       data: JSON.stringify({
    //         transportId: transport.id,
    //         amount: transport.totalAmount,
    //         paymentMethod: PaymentMethod.CARD,
    //       }),
    //       targetId: transport.id,
    //       slug: "card-payment",
    //     },
    //     transport.driver.id
    //   );
    // }

    // if (transport.driver) {
    //   await NotificationService.saveNotification(
    //     {
    //       title: "Card Payment Received",
    //       body: `Payment received for order #${transport.id}`,
    //       type: NotificationType.PAYMENT,
    //       data: JSON.stringify({
    //         transportId: transport.id,
    //         amount: transport.totalAmount,
    //         paymentMethod: PaymentMethod.CARD,
    //       }),
    //       targetId: transport.id,
    //       slug: "card-payment",
    //     },
    //     transport.driver.id
    //   );
    // }

    return { payment };
  } catch (error) {
    console.error("Card payment error:", error);
    throw error;
  }
};

const capturePayment = async (
  userToken: string,
  transportId: string,
  stripePaymentIntentId: string
) => {
  const decodedToken = jwtHelpers.verifyToken(
    userToken,
    config.jwt.jwt_secret!
  );

  const carTransport = await prisma.carTransport.findUnique({
    where: { id: transportId },
  });

  if (!carTransport) {
    throw new ApiError(httpStatus.NOT_FOUND, "Car transport not found");
  }

  if (carTransport.userId !== decodedToken.id) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Not authorized to capture this payment"
    );
  }

  // Call Stripe capture API
  const paymentIntent = await stripe.paymentIntents.capture(
    stripePaymentIntentId
  );

  if (paymentIntent.status !== "succeeded") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Payment capture failed");
  }

  // Update DB
  await prisma.payment.updateMany({
    where: { stripePaymentIntentId },
    data: { paymentStatus: PaymentStatus.COMPLETED,paymentDate: new Date() },
  });
  // await prisma.payment.update({
  //   where: { stripePaymentIntentId },
  //   data: { paymentStatus: PaymentStatus.COMPLETED ,paymentDate: new Date()},
  // });

  await prisma.carTransport.update({
    where: { id: transportId },
    data: { paymentStatus: PaymentStatus.COMPLETED, isPayment: true },
  });

  return { paymentIntentId: paymentIntent.id, status: paymentIntent.status };
};

// Handle refund for payments only admin
const handleRefund = async (
  userToken: string,
  { paymentId, reason }: IRefundRequest
) => {
  try {
    const decodedToken = jwtHelpers.verifyToken(
      userToken,
      config.jwt.jwt_secret!
    );

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        carTransport: {
          include: {
            sender: true,
            driver: true,
          },
        },
      },
    });

    if (!payment) {
      throw new ApiError(httpStatus.NOT_FOUND, "Payment not found");
    }

    if (payment.paymentStatus === PaymentStatus.REFUNDED) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Payment already refunded");
    }

    // Check car transport status for refund eligibility
    if (!payment.carTransport) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        "Associated car transport not found"
      );
    }

    if (
      payment.carTransport.status === TransportStatus.COMPLETED ||
      payment.carTransport.status === TransportStatus.ONGOING
    ) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Cannot refund payment for delivered or in-progress transports"
      );
    }

    if (payment.carTransport.status !== TransportStatus.CANCELLED) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Refund is only available for canceled transports"
      );
    }

    if (
      payment.paymentMethod === PaymentMethod.CARD &&
      payment.stripePaymentIntentId
    ) {
      const refund = await stripe.refunds.create({
        payment_intent: payment.stripePaymentIntentId,
        reason: (reason as any) || "requested_by_customer",
      });

      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          paymentStatus: PaymentStatus.REFUNDED,
          refundId: refund.id,
        },
      });

      if (payment.carTransport) {
        await prisma.carTransport.update({
          where: { id: payment.carTransport.id },
          data: {
            paymentStatus: PaymentStatus.REFUNDED,
          },
          include: {
            sender: true,
            driver: true,
          },
        });

        // Send notifications to both sender and driver
        // const notificationPromises = [];
        // if (payment?.carTransport?.sender?.fcmToken) {
        //   notificationPromises.push(
        //     NotificationService.sendNotification(
        //       payment.carTransport.sender.fcmToken,
        //       {
        //         title: "Payment Refunded",
        //         body: `Your payment for order #${payment.carTransport.id} has been refunded`,
        //         type: NotificationType.PAYMENT,
        //         data: JSON.stringify({
        //           carTransportId: payment.carTransport.id,
        //           amount: payment.amount,
        //           refundId: refund.id,
        //         }),
        //         targetId: payment.carTransport.id,
        //         slug: "refund",
        //       },
        //       payment.carTransport.userId!
        //     )
        //   );
        // }

        // if (payment.carTransport.driver?.fcmToken) {
        //   notificationPromises.push(
        //     NotificationService.sendNotification(
        //       payment.carTransport.driver.fcmToken,
        //       {
        //         title: "Payment Refunded",
        //         body: `Payment for order #${payment.carTransport.id} has been refunded`,
        //         type: NotificationType.PAYMENT,
        //         data: JSON.stringify({
        //           carTransportId: payment.carTransport.id,
        //           amount: payment.amount,
        //           refundId: refund.id,
        //         }),
        //         targetId: payment.carTransport.id,
        //         slug: "refund",
        //       },
        //       payment.carTransport.driver.id!
        //     )
        //   );
        // }

        // await Promise.all(notificationPromises);
      }

      return { success: true, refundId: refund.id };
    }

    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Refund not supported for this payment method"
    );
  } catch (error) {
    console.error("Refund error:", error);
    throw error;
  }
};

// Create a new card for the user
const createCard = async (
  userToken: string,
  { payment_method, isDefault }: ICreateCardRequest
) => {
  try {
    const decodedToken = jwtHelpers.verifyToken(
      userToken,
      config.jwt.jwt_secret!
    );

    const user = await prisma.user.findUnique({
      where: { id: decodedToken.id },
      include: {
        savedCards: true,
      },
    });

    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    // Create Stripe customer if not exists
    if (!user.stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: user.fullName || undefined,
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customer.id },
      });

      user.stripeCustomerId = customer.id;
    }

    // Attach payment method to customer
    const paymentMethod = await stripe.paymentMethods.attach(payment_method, {
      customer: user.stripeCustomerId,
    });

    // Save card details
    const card = await prisma.savedCard.create({
      data: {
        userId: user.id,
        cardType: paymentMethod.card!.brand,
        last4: paymentMethod.card!.last4,
        expiryMonth: paymentMethod.card!.exp_month,
        expiryYear: paymentMethod.card!.exp_year,
        stripePaymentMethodId: paymentMethod.id,
        isDefault: isDefault || user.savedCards.length === 0,
      },
    });

    // If this card is set as default, update other cards
    if (card.isDefault) {
      await prisma.savedCard.updateMany({
        where: {
          userId: user.id,
          id: { not: card.id },
        },
        data: {
          isDefault: false,
        },
      });
    }

    return card;
  } catch (error) {
    console.error("Create card error:", error);
    throw error;
  }
};

// Get refunded payments
const getRefundedPayments = async (
  userToken: string,
  filter: IPaymentFilterRequest
) => {
  const decodedToken = jwtHelpers.verifyToken(
    userToken,
    config.jwt.jwt_secret!
  );

  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
    startDate,
    endDate,
  } = filter;

  const skip = (page - 1) * limit;

  // Build where condition based on user role
  const where: any = {
    paymentStatus: PaymentStatus.REFUNDED,
  };

  if (decodedToken.role === "Sender") {
    where.senderId = decodedToken.id;
  } else if (decodedToken.role === "Courier") {
    where.receiverId = decodedToken.id;
  }

  if (startDate && endDate) {
    where.createdAt = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  // Get total count for pagination
  const total = await prisma.payment.count({ where });

  const refundedPayments = await prisma.payment.findMany({
    where,
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
  });

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: refundedPayments,
  };
};

export const paymentService = {
  handlePayment,
  handleWalletPayment,
  handleCardPayment,
  capturePayment,
  createStripeAccount,
  handleRefund,
  getPayments,
  getAllTransactions,
  createCard,
  getRefundedPayments,
};
