
import httpStatus from 'http-status';
import { fileUploader } from '../../../helpars/fileUploader';
import { jwtHelpers } from '../../../helpars/jwtHelpers';
import config from '../../../config';
import prisma from '../../../shared/prisma';
import ApiError from '../../../errors/ApiErrors';
import { calculateDistance } from '../../../shared/calculateDistance';



// async function calculateFareFromConfig(distance: number) {
//   const activeFare = await prisma.fare.findFirst({
//     where: { isActive: true },
//     orderBy: { createdAt: "desc" },
//   });
//   if (!activeFare) throw new Error("Active Fare not found");

//   const basePrice = activeFare.baseFare; // 40
//   const perKm = activeFare.costPerKm; // 10
//   console.log(basePrice, perKm, distance);

//   return basePrice + perKm * distance;
// }

// // Service function
// export const createCarTransport = async (token: string, payload: any, files: any[]) => {
//   // 1️⃣ Token decode (userId বের করা)
//   const decodedToken = jwtHelpers.verifyToken(token, config.jwt.jwt_secret!);
//   const userId = decodedToken.id;

//   // 2️⃣ Vehicle check
//   const vehicle = await prisma.vehicle.findUnique({
//     where: { id: payload.vehicleId },
//   });
//   if (!vehicle) throw new Error("Vehicle not found");

//   // 3️⃣ Distance calculation
//   const distance = calculateDistance(
//     payload.pickupLat,
//     payload.pickupLng,
//     payload.dropOffLat,
//     payload.dropOffLng
//   );

//   // 4️⃣ Fare calculation
//   const totalAmount = await calculateFareFromConfig(distance);

//   // 5️⃣ Image upload
//   const uploadedImages = await Promise.all(
//     files.map((file) => fileUploader.uploadToDigitalOcean(file))
//   );

//   // 6️⃣ DB create
//   const carTransport = await prisma.carTransport.create({
//     data: {
//       ...payload,
//       userId,
//       totalAmount,
//       beforePickupImages: uploadedImages.map((img) => img.Location),
//       // driverLat/driverLng দিয়ে কিছু পাঠাবেন না
//     },
//   });

//   return carTransport;
// };


// const getListFromDb = async () => {
  
//     const result = await prisma.carTransport.findMany();
//     return result;
// };

// const getByIdFromDb = async (id: string) => {
  
//     const result = await prisma.carTransport.findUnique({ where: { id } });
//     if (!result) {
//       throw new Error('CarTransport not found');
//     }
//     return result;
//   };



// const updateIntoDb = async (id: string, data: any) => {
//   const transaction = await prisma.$transaction(async (prisma) => {
//     const result = await prisma.carTransport.update({
//       where: { id },
//       data,
//     });
//     return result;
//   });

//   return transaction;
// };

// const deleteItemFromDb = async (id: string) => {
//   const transaction = await prisma.$transaction(async (prisma) => {
//     const deletedItem = await prisma.carTransport.delete({
//       where: { id },
//     });

//     // Add any additional logic if necessary, e.g., cascading deletes
//     return deletedItem;
//   });

//   return transaction;
// };


async function calculateFareFromConfig(distance: number, rideTime: number, waitingTime: number) {
  const activeFare = await prisma.fare.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });
  if (!activeFare) throw new Error("Active Fare not found");

  const { baseFare, costPerKm, costPerMin, minimumFare, waitingPerMin } = activeFare;
  console.log({object: activeFare, distance, rideTime, waitingTime });

  if (baseFare == null) {
    throw new Error("baseFare value is missing in active fare configuration");
  }
  if (waitingPerMin == null) {
    throw new Error("waitingPerMin value is missing in active fare configuration");
  }
  if (costPerMin == null) {
    throw new Error("costPerMin value is missing in active fare configuration");
  }

  // 1. Distance fare
  const distanceFare = costPerKm * distance;

  // 2. Time fare
  const timeFare = costPerMin * rideTime;

  // 3. Waiting fare (first 4 min free)
  const waitingFare = waitingTime > 4 ? (waitingTime - 4) * waitingPerMin : 0;

  // 4. Total
  let totalFare = baseFare + distanceFare + timeFare + waitingFare;

  // 5. Minimum fare check
  if (minimumFare == null) {
    throw new Error("minimumFare value is missing in active fare configuration");
  }
  if (totalFare < minimumFare) {
    totalFare = minimumFare;
  }

  return {
    distance: distance.toFixed(2),
    rideTime,
    waitingTime,
    totalFare: Math.round(totalFare),
  };
}

// Service function
export const createCarTransport = async (token: string, payload: any, files: any[]) => {
  const decodedToken = jwtHelpers.verifyToken(token, config.jwt.jwt_secret!);
  const userId = decodedToken.id;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: payload.vehicleId },
  });
  if (!vehicle) throw new Error("Vehicle not found");

  // 1️⃣ Distance (Haversine বা Google API)
  const distance = calculateDistance(
    payload.pickupLat,
    payload.pickupLng,
    payload.dropOffLat,
    payload.dropOffLng
  );

  // 2️⃣ Ride time (Google Distance Matrix API দিয়ে পাওয়া যাবে)
  const rideTime = payload.rideTime || 20; // মিনিট (dummy/default রাখলাম)

  // 3️⃣ Waiting time (pickup point এ driver কতক্ষণ অপেক্ষা করেছে)
  const waitingTime = payload.waitingTime || 0; // মিনিট

  // 4️⃣ Fare calculate
  const { totalFare } = await calculateFareFromConfig(distance, rideTime, waitingTime);

  // 5️⃣ Image upload
  const uploadedImages = await Promise.all(
    files.map((file) => fileUploader.uploadToDigitalOcean(file))
  );

  // 6️⃣ DB save
  const carTransport = await prisma.carTransport.create({
    data: {
      ...payload,
      userId,
      totalAmount: totalFare,
      beforePickupImages: uploadedImages.map((img) => img.Location),
    },
  });

  return carTransport;
};


export const carTransportService = {
createCarTransport,
// getListFromDb,
// getByIdFromDb,
// updateIntoDb,
// deleteItemFromDb,
};