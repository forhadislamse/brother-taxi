// interface IPaymentIntent {
//   paymentMethod: string;
//   bookingId: string;
//   currency?: string;
//   userId: string;
// }

import { PaymentMethod, PaymentStatus } from "@prisma/client";

export interface IPaymentRequest {
  transportId: string;
  paymentMethod: PaymentMethod;
  cardId?: string;
}

export interface IMultiplePaymentRequest {
  transportIds: string[];
  paymentMethod: PaymentMethod;
  cardId?: string;
}

export interface IPaymentFilterRequest {
  status?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
}

export interface IStripePaymentRequest {
  transportId: string;
  paymentMethod: PaymentMethod;
  cardId?: string;
  setupIntentData?: {
    payment_method: string;
    save_payment_method?: boolean;
  };
}

export interface ICreateCardRequest {
  payment_method: string;
  isDefault?: boolean;
}

export interface IStripeWebhookEvent {
  type: string;
  data: {
    object: any;
  };
}

export interface IRefundRequest {
  paymentId: string;
  reason?: string;
}

export type IPaymentReleaseRequest = {
  isPlatformFeeRelease?: boolean;
  isCourierFeeRelease?: boolean;
};

export type ITransactionFilterRequest = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
  isPlatformFeeRelease?: boolean;
  isCourierFeeRelease?: boolean;
  paymentStatus?: string;
  paymentMethod?: string;
}; 