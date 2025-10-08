
import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
// import { IMultiplePaymentRequest, IPaymentRequest } from "./payment.interface";
import pick from "../../../shared/pick";
import config from "../../../config";
// import { paymentService } from "./payment.service";
import { jwtHelpers } from "../../../helpars/jwtHelpers";
import prisma from "../../../shared/prisma";
import { paymentService } from "./Payment.service";
import { IPaymentRequest } from "./Payment.interface";

const handleCashPayment = catchAsync(async (req: Request, res: Response) => {
  const { transportId, paymentMethod, cardId } = req.body as IPaymentRequest;
  const token = req.headers.authorization;

  const result = await paymentService.handleCashPayment(
    token!,
    transportId,
    paymentMethod,
    cardId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment processed successfully",
    data: result,
  });
});

const processPayment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization;
    const result = await paymentService.handleCashPayment(
      token!,
      req.body.transportId,
      req.body.paymentMethod,
      req.body.cardId
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Payment processed successfully",
      data: result,
    });
  }
);

const capturePayment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization!;
    const { transportId, stripePaymentIntentId } = req.body;

    const result = await paymentService.capturePayment(
      token,
      transportId,
      stripePaymentIntentId
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Payment captured successfully",
      data: result,
    });
  }
);

const processCardPayment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization;
    const result = await paymentService.handleCardPayment(token!, req.body);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Card payment processed successfully",
      data: result,
    });
  }
);

const refundPayment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization;
    const result = await paymentService.handleRefund(token!, {
      paymentId: req.params.paymentId,
      reason: req.body.reason,
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Payment refunded successfully",
      data: result,
    });
  }
);

const getSavedCards = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization;
    const decodedToken = jwtHelpers.verifyToken(token!, config.jwt.jwt_secret!);

    const cards = await prisma.savedCard.findMany({
      where: {
        userId: decodedToken.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Saved cards retrieved successfully",
      data: cards,
    });
  }
);

const createStripeAccount = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization;
    // const decodedToken = jwtHelpers.verifyToken(token!, config.jwt.jwt_secret!);

    const accountLink = await paymentService.createStripeAccount(token!);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Stripe account creation link generated",
      data: { url: accountLink },
    });
  }
);

const getPayments = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization;
    console.log(token);
    const paginationOptions = pick(req.query, [
      "page",
      "limit",
      "sortBy",
      "sortOrder",
    ]);
    const filterOptions = pick(req.query, ["status", "startDate", "endDate"]);

    const result = await paymentService.getPayments(token!, {
      ...paginationOptions,
      ...filterOptions,
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Payments retrieved successfully",
      meta: result.meta,
      data: result.data,
    });
  }
);

const getAllTransactions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization;
    const {
      page,
      limit,
      sortBy,
      sortOrder,
      startDate,
      endDate,
      isPlatformFeeRelease,
      isCourierFeeRelease,
      paymentStatus,
      paymentMethod,
    } = req.query;

    const filters = {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as "asc" | "desc",
      startDate: startDate as string,
      endDate: endDate as string,
      isPlatformFeeRelease: isPlatformFeeRelease === "true",
      isCourierFeeRelease: isCourierFeeRelease === "true",
      paymentStatus: paymentStatus as string,
      paymentMethod: paymentMethod as string,
    };

    const result = await paymentService.getAllTransactions(token!, filters);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Transactions retrieved successfully",
      meta: result.meta,
      data: result.data,
    });
  }
);

const createCard = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization;
    const result = await paymentService.createCard(token!, req.body);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Card saved successfully",
      data: result,
    });
  }
);

// const handleWalletPayment = catchAsync(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const token = req.headers.authorization;
//     // const { transportId } = req.body;
//     const { transportId, paymentMethod, cardId } = req.body as IPaymentRequest;

//     const result = await paymentService.handleWalletPayment(token!,
//     transportId,
//     paymentMethod,
//     cardId);

//     sendResponse(res, {
//       statusCode: httpStatus.OK,
//       success: true,
//       message: "Payment completed using wallet",
//       data: result,
//     });
//   }
// );



const getRefundedPayments = catchAsync(async (req: Request, res: Response) => {
  const userToken = req.headers.authorization;
  const result = await paymentService.getRefundedPayments(
    userToken!,
    req.query
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Refunded payments retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

export const PaymentController = {
  handleCashPayment,
  processPayment,
  capturePayment,
  processCardPayment,
  refundPayment,
  getSavedCards,
  createStripeAccount,
  getPayments,
  getAllTransactions,
  createCard,
  // handleWalletPayment,
  getRefundedPayments,
};
