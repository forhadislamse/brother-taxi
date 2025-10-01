// import { Gender, UserRole, UserStatus, } from "@prisma/client";
import * as bcrypt from "bcrypt";
import config from "../../config";
import prisma from "../../shared/prisma";
import { Gender, UserRole, UserStatus } from "@prisma/client";
// import config from "../../config";
// import prisma from "../../shared/prisma";

// export const initiateSuperAdmin = async () => {
//   const hashedPassword = await bcrypt.hash(
//     "123456789",
//     Number(config.bcrypt_salt_rounds)
//   );
//   const payload: any = {
//     email: "admin@gmail.com",
//     phoneNumber: "1234567890",
//     password: hashedPassword,
//     status: UserStatus.ACTIVE,
//     role: UserRole.ADMIN,
//     fullName: "Super Admin",
//     gender:Gender.MALE

//   };

//   const isExistUser = await prisma.user.findUnique({
//     where: {
//       phoneNumber: payload.phoneNumber,
//     },
//   });

//   if (isExistUser) return;

//   await prisma.user.create({
//     data: payload,
//   });
// };

export const initiateSuperAdmin = async () => {
  try {
    const hashedPassword = await bcrypt.hash(
      "123456789",
      Number(config.bcrypt_salt_rounds)
    );

    const phoneNumber = "+8801234567890";

    const isExistUser = await prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (isExistUser) {
      console.log("✅ Super admin already exists");
      return;
    }

    await prisma.user.create({
      data: {
        email: "admin@gmail.com",
        phoneNumber,
        // password: hashedPassword,
        status: UserStatus.ACTIVE,
        role: UserRole.ADMIN,
        fullName: "Super Admin",
        gender: Gender.MALE,
        // adminApprovedStatus: "APPROVED" // Optional, for admin explicitly
      },
    });

    console.log("✅ Super admin created successfully");
  } catch (error) {
    console.error("❌ Failed to create super admin:", error);
  }
};
