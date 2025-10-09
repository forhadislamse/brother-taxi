import httpStatus from "http-status";
import prisma from "../../../shared/prisma";
import { jwtHelpers } from "../../../helpars/jwtHelpers";
import config from "../../../config";
import { calculateDistance } from "../../../shared/calculateDistance";



const calculateFare = async (token: string, payload: any) => {
  // Token decode
  const decodedToken = jwtHelpers.verifyToken(token, config.jwt.jwt_secret!);
  const userId = decodedToken.id;

  // Distance calculate
  const distance = calculateDistance(
    payload.pickupLat,
    payload.pickupLng,
    payload.dropOffLat,
    payload.dropOffLng
  );

  // Active fare fetch
  const activeFare = await prisma.fare.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });
  if (
    !activeFare ||
    // activeFare.baseFare == null ||
    activeFare.costPerMin == null ||
    activeFare.costPerKm == null ||
    activeFare.minimumFare == null
  ) {
    throw new Error("Active fare or required fare properties not found");
  }

  // // Total fare (distance only, time ignored)

  // let totalFare = activeFare.baseFare + distance * activeFare.costPerKm;
  // if (totalFare < activeFare.minimumFare) {
  //   totalFare = activeFare.minimumFare;
  // }

    const minimumFare = activeFare.minimumFare;

  // Extra distance fare (after first 5 km)
  const extraDistanceFare = distance > 5 ? (distance - 5) * activeFare.costPerKm : 0;

  // Extra ride time fare (after first 5 km)
  const rideDuration = payload.duration ?? 0;
  const extraTimeFare = distance > 5 ? rideDuration * activeFare.costPerMin : 0;

  // Total fare
  const totalFare = minimumFare + extraDistanceFare + extraTimeFare;

  // Optionally, save in DB for reference
  await prisma.estimateFare.create({
    data: {
      userId,
      pickup:payload.pickup,
      dropOff:payload.dropOff,
      pickupLat: payload.pickupLat,
      pickupLng: payload.pickupLng,
      dropOffLat: payload.dropOffLat,
      dropOffLng: payload.dropOffLng,
      distance,
      totalFare,
      // baseFare: activeFare.baseFare,
      costPerKm: activeFare.costPerKm,
      costPerMin: activeFare.costPerMin ?? 0,
      minimumFare: activeFare.minimumFare,
      // waitingPerMin: activeFare.waitingPerMin ?? 0,
    },
  });

  return {
    pickup:payload.pickup,
    dropOff:payload.dropOff,
    pickupLocation: { lat: payload.pickupLat, lng: payload.pickupLng },
    dropOffLocation: { lat: payload.dropOffLat, lng: payload.dropOffLng },
    distance: distance.toFixed(2),
    // baseFare: activeFare.baseFare,
    costPerKm: activeFare.costPerKm,
    costPerMin: activeFare.costPerMin,
    minimumFare: activeFare.minimumFare,
    extraDistanceFare,
      extraTimeFare,
    // waitingPerMin: activeFare.waitingPerMin,
    totalFare: Math.round(totalFare),
  };
};

// const getMyEstimateFareList = async (userId: string) => {
//   // Rider এর estimates নাও
//   const estimates = await prisma.estimateFare.findMany({
//     where: { userId },
//     orderBy: { createdAt: "desc" },
//   });

//   // Latest fare config নাও
//   const activeFare = await prisma.fare.findFirst({
//     where: { isActive: true },
//     orderBy: { createdAt: "desc" },
//   });
//   if (!activeFare) throw new Error("Active fare not found");

//   // প্রতিটি estimate এ নতুন fare config দিয়ে হিসাব করো
//   const result = estimates.map((e) => {
//     // calculateFare expects a token and payload, but here we just want to merge fare config
//     // So, instead, just merge the fare config without calling calculateFare
//     const distance = e.distance ?? 0; // null হলে 0 ধরে নিচ্ছি
//     const calculatedFare = (activeFare.baseFare ?? 0) + distance * (activeFare.costPerKm ?? 0);
//     return {
//       ...e,
//       baseFare: activeFare.baseFare ?? 0,
//       costPerKm: activeFare.costPerKm ?? 0,
//       costPerMin: activeFare.costPerMin ?? 0,
//       waitingPerMin: activeFare.waitingPerMin ?? 0,
//       // totalFare: Math.round(
//       //   ((activeFare.baseFare ?? 0) + e.distance * (activeFare.costPerKm ?? 0)) < (activeFare.minimumFare ?? 0)
//       //     ? (activeFare.minimumFare ?? 0)
//       //     : (activeFare.baseFare ?? 0) + e.distance * (activeFare.costPerKm ?? 0)
//       // ),
//       totalFare: Math.round(calculatedFare < (activeFare.minimumFare ?? 0)
//       ? (activeFare.minimumFare ?? 0)
//       : calculatedFare
//     ),
//     };
//   });

//   return result;
// };

const getMyEstimateFareList = async (userId: string) => {
  // Rider এর estimates নাও
  const estimates = await prisma.estimateFare.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  // Latest fare config নাও
  const activeFare = await prisma.fare.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  if (!activeFare) throw new Error("Active fare not found");

  const result = estimates.map((e) => {
    const distance = e.distance ?? 0;
    const rideDuration = e.duration ?? 0; // ride duration in minutes

    // Extra distance fare (after 5 km)
    const extraDistanceFare = distance > 5 ? (distance - 5) * (activeFare.costPerKm ?? 0) : 0;

    // Extra ride time fare (after 5 km)
    const extraTimeFare = distance > 5 ? rideDuration * (activeFare.costPerMin ?? 0) : 0;

    // Total fare = extra distance + extra time
    let totalFare = extraDistanceFare + extraTimeFare;

    // Minimum fare enforcement
    if (totalFare < (activeFare.minimumFare ?? 0)) {
      totalFare = activeFare.minimumFare ?? 0;
    }

    return {
      ...e,
      costPerKm: activeFare.costPerKm ?? 0,
      costPerMin: activeFare.costPerMin ?? 0,
      minimumFare: activeFare.minimumFare ?? 0,
      extraDistanceFare,
      extraTimeFare,
      totalFare: Math.round(totalFare),
    };
  });

  return result;
};

export const estimateFareService = {
  calculateFare,
  getMyEstimateFareList,
  // getListFromDb,
  // getByIdFromDb,
  // updateIntoDb,
  // deleteItemFromDb,
};
