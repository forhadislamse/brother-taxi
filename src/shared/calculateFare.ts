// export const calculateFare = (
//   distance: number,
//   duration: number,
//   fareConfig: {
//     baseFare: number;
//     costPerKm: number;
//     costPerMin: number;
//     minimumFare: number;
//     waitingPerMin: number;
//   }
// ) => {
//   let distanceFare = fareConfig.costPerKm * distance;
//   let timeFare = fareConfig.costPerMin * duration;
//   let totalFare = fareConfig.baseFare + distanceFare + timeFare;

//   if (totalFare < fareConfig.minimumFare) {
//     totalFare = fareConfig.minimumFare;
//   }

//   return { distanceFare, timeFare, totalFare };
// };

export const calculateFare = (
  distance: number,    // total distance in km
  duration: number,    // ride duration in minutes
  fareConfig: {
    costPerKm: number;    // per km after first 5 km
    costPerMin: number;   // per minute after first 5 km
    minimumFare: number;  // base fare for first 5 km
  }
) => {
  const minimumFare = fareConfig.minimumFare;

  // Extra distance fare (after first 5 km)
  const extraDistanceFare = distance > 5 ? (distance - 5) * fareConfig.costPerKm : 0;

  // Extra time fare (after first 5 km)
  const extraTime = distance > 5 ? duration : 0;  // only count time if distance > 5 km
  const timeFare = extraTime * fareConfig.costPerMin;

  // Total fare = base fare + extra distance + extra time
  const totalFare = minimumFare + extraDistanceFare + timeFare;

  return { minimumFare, extraDistanceFare, timeFare, totalFare };
};

