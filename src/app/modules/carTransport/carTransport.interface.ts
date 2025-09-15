import { PaymentStatus, TransportStatus } from '@prisma/client';

export type ICarTransport = {
  userId: string;
  vehicleId: string;
  pickupLocation?: string;
  dropOffLocation?: string;
  pickupLat?: number;
  pickupLng?: number;
  dropOffLat?: number;
  dropOffLng?: number;
  driverLat?: number;
  driverLng?: number;
  pickupDate?: string;
  pickupTime?: string;
  status?: TransportStatus;
  totalAmount?: number;
  paymentMethod?: string;
  paymentStatus?: PaymentStatus;
  specialNotes?: string;
  beforePickupImages?: string[];
};

export type ICarTransportFilters = {
  searchTerm?: string;
  status?: TransportStatus;
  paymentStatus?: string;
};

export type IDriverJobFilters = {
  status?: TransportStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export type IDriverIncomeResponse = {
  totalIncome: number;
  transactions: {
    meta: {
      page: number;
      limit: number;
      total: number;
    };
    data: any[];
  };
};

export type IAssignDriverReq = {
  carTransportId: string;
  driverId: string;
};

export type IDriverResponseReq = {
  carTransportId: string;
  response: 'ACCEPTED' | 'DECLINED';
};

export type IConfirmArrivalReq = {
  carTransportId: string;
};

export type IStartJourneyReq = {
  carTransportId: string;
};

export type ICompleteJourneyReq = {
  carTransportId: string;
};

export type IDriverAssignedRequestsResponse = {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalAmountSum: number;
  };
  data: any[];
}; 