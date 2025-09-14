import { calculateDistance } from "./calculateDistance";
import prisma from "./prisma";

// export const findNearbyDrivers = async (
//   lat: number,
//   lng: number,
//   maxDistance: number = 25
// ) => {
//   const drivers = await prisma.user.findMany({
//     where: {
//       role: "DRIVER",
//       lat: { not: null },
//       lng: { not: null },
//       adminApprovedStatus: "APPROVED", // শুধু approved driver
//     },
//   });

//   return drivers.filter((driver) => {
//     if (!driver.lat || !driver.lng) return false;
//     const distance = calculateDistance(lat, lng, driver.lat, driver.lng);
//     return distance <= maxDistance;
//   });
// };

export const findNearbyDrivers = async (lat: number, lng: number, maxDistance = 25) => {
  const drivers = await prisma.user.findMany({
    where: {
      role: "DRIVER",
      lat: { not: null },
      lng: { not: null },
      adminApprovedStatus: "APPROVED",
      status: "ACTIVE",
    },
  });

  return drivers
    .filter(d => d.lat && d.lng && calculateDistance(lat, lng, d.lat, d.lng) <= maxDistance)
    .map(d => ({
      id: d.id,
      fullName: d.fullName,
      phone: d.phoneNumber,
      profileImage: d.profileImage,
      lat: d.lat,
      lng: d.lng,
      distance: calculateDistance(lat, lng, d.lat!, d.lng!),
    }));
};



