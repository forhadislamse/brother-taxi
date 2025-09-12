
import httpStatus from "http-status";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import { get } from "lodash";


const getCurrentFare = async () => {
  const fare = await prisma.fare.findFirst({
    where: { isActive: true },
  });

  if (!fare) {
    throw new ApiError(httpStatus.NOT_FOUND, "No active fare found");
  }

  return fare;
};
const getAllFare = async () => {
  const fare = await prisma.fare.findMany();

  if (!fare) {
    throw new ApiError(httpStatus.NOT_FOUND, "No active fare found");
  }

  return fare;
};

const createFare = async (fareData: { baseFare: number; costPerKm: number;costPerMin:number, minimumFare: number; waitingPerMin: number }) => {
  // Deactivate all existing fares
  await prisma.fare.updateMany({
    where: { isActive: true },
    data: { isActive: false },
  });

  // Create new active fare
  const fare = await prisma.fare.create({
    data: {
      baseFare: fareData.baseFare,
      costPerKm: fareData.costPerKm,
      costPerMin:fareData.costPerMin,
      minimumFare:fareData.minimumFare,
      waitingPerMin:fareData.waitingPerMin,
      isActive: true,
      // carTransport: {
      //   // Replace 'connect' with the appropriate way to link or create CarTransport
      //   // For example, to connect to an existing CarTransport by id:
      //   connect: { id: "YOUR_CAR_TRANSPORT_ID" }
      //   // Or to create a new CarTransport:
      //   // create: { /* carTransport fields here */ }
      // },
    },
  });

  return fare;
};

const updateFare = async (
  fareId: string,
  updateData: { baseFare?: number; costPerKm?: number }
) => {
  const fare = await prisma.fare.findUnique({
    where: { id: fareId },
  });

  if (!fare) {
    throw new ApiError(httpStatus.NOT_FOUND, "Fare not found");
  }

  const updatedFare = await prisma.fare.update({
    where: { id: fareId },
    data: updateData,
  });

  return updatedFare;
};

const getFareHistory = async () => {
  const fares = await prisma.fare.findMany({
    orderBy: { createdAt: "desc" },
  });

  return fares;
};

export const fareService = {
  getCurrentFare,
  getAllFare,
  createFare,
  updateFare,
  getFareHistory,
};
