import { calculateDistance } from "./calculateDistance";
import prisma from "./prisma";

export const findNearbyDrivers = async (lat: number, lng: number, maxDistance = 25) => {
  const drivers = await prisma.user.findMany({
    where: {
      role: "DRIVER",
      lat: { not: null },
      lng: { not: null },
      adminApprovedStatus: "APPROVED",
      status: "ACTIVE",
    },
    include: {
      vehicles: true, // fetch vehicles relation
    },
  });

  return drivers
    .filter(d => d.lat && d.lng && calculateDistance(lat, lng, d.lat, d.lng) <= maxDistance)
    .map(d => ({
      id: d.id,
      fullName: d.fullName || "", // default to empty string
      phone: d.phoneNumber || "",
      profileImage: d.profileImage || null,
      lat: d.lat!,
      lng: d.lng!,
      vehicleId: d.vehicles[0]?.id || null,
      vehicleName: d.vehicles[0]?.manufacturer || null,
      distance: calculateDistance(lat, lng, d.lat!, d.lng!),
    }));
};


// export const findNearbyDrivers = async (lat: number, lng: number, maxDistance = 25) => {
//   const drivers = await prisma.user.findMany({
//     where: {
//       role: "DRIVER",
//       lat: { not: null },
//       lng: { not: null },
//       adminApprovedStatus: "APPROVED",
//       status: "ACTIVE",
//     },
//   });

//   return drivers
//     .filter(d => d.lat && d.lng && calculateDistance(lat, lng, d.lat, d.lng) <= maxDistance)
//     .map(d => ({
//       id: d.id,
//       fullName: d.fullName,
//       phone: d.phoneNumber,
//       profileImage: d.profileImage,
//       lat: d.lat,
//       lng: d.lng,
//       distance: calculateDistance(lat, lng, d.lat!, d.lng!),
//     }));
// };


// export const findNearbyDrivers = async (lat: number, lng: number, maxDistance = 25) => {
//   const drivers = await prisma.user.findMany({
//     where: {
//       role: "DRIVER",
//       lat: { not: null },
//       lng: { not: null },
//       adminApprovedStatus: "APPROVED",
//       status: "ACTIVE",
//     },
//     include: {
//       vehicles: true, // <- include vehicles relation
//     },
//   });

//   return drivers
//     .filter(d => d.lat && d.lng && calculateDistance(lat, lng, d.lat, d.lng) <= maxDistance)
//     .map(d => ({
//       id: d.id,
//       fullName: d.fullName,
//       phone: d.phoneNumber,
//       profileImage: d.profileImage,
//       lat: d.lat,
//       lng: d.lng,
//       vehicleId: d.vehicles[0]?.id || null, // take first vehicle
//       vehicleName: d.vehicles[0]?.manufacturer || null,
//       distance: calculateDistance(lat, lng, d.lat!, d.lng!),
//     }));
// };





