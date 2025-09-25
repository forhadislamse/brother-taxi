// export const getTransactionId = () => {
//     return `tran_${Date.now()}_${Math.floor(Math.random() * 1000)}`
// }

export const generateOtp = (length: number = 4): number => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// export const generateReferralCode = () => {
//   return `REF_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
// };

export const generateReferralCode = (length: number = 6): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const randomPart = Array.from({ length }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
  return `REF_${randomPart}`;
};
