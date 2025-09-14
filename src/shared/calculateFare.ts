export const calculateFare = (
  distance: number,
  duration: number,
  fareConfig: {
    baseFare: number;
    costPerKm: number;
    costPerMin: number;
    minimumFare: number;
    waitingPerMin: number;
  }
) => {
  let distanceFare = fareConfig.costPerKm * distance;
  let timeFare = fareConfig.costPerMin * duration;
  let totalFare = fareConfig.baseFare + distanceFare + timeFare;

  if (totalFare < fareConfig.minimumFare) {
    totalFare = fareConfig.minimumFare;
  }

  return { distanceFare, timeFare, totalFare };
};