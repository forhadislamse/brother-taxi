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


// 🔹 Driver filters for income/history
export type IDriverJobFilters = {
  status?: TransportStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

// 🔹 Driver income response
export type IDriverIncomeResponse = {
  totalIncome: number;
  totalDistance: number;
  totalDuration: number;
  totalTrips: number; // added for clarity
  transactions: {
    meta: {
      page: number;
      limit: number;
      total: number;
    };
    data: any[]; // you can replace any[] with Prisma.CarTransport[] if strongly typed
  };
};

// 🔹 Assign driver to ride request
export type IAssignDriverReq = {
  carTransportId: string;
  driverId: string;
};

// 🔹 Driver accept/decline request
export type IDriverResponseReq = {
  carTransportId: string;
  response: "ACCEPTED" | "DECLINED";
};

// 🔹 Confirm arrival at pickup
export type IConfirmArrivalReq = {
  carTransportId: string;
};

// 🔹 Start journey
export type IStartJourneyReq = {
  carTransportId: string;
};

// 🔹 Complete journey
export type ICompleteJourneyReq = {
  carTransportId: string;
};

// 🔹 Driver assigned requests (pagination + sum)
export type IDriverAssignedRequestsResponse = {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalAmountSum: number;
  };
  data: any[]; // same here: replace with Prisma.CarTransport[] if possible
};