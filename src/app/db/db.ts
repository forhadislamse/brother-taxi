import { UserRole, UserStatus, } from "@prisma/client";
import * as bcrypt from "bcrypt";
import config from "../../config";
import prisma from "../../shared/prisma";

export const initiateSuperAdmin = async () => {
  const hashedPassword = await bcrypt.hash(
    "123456789",
    Number(config.bcrypt_salt_rounds)
  );
  const payload: any = {
    email: "admin@gmail.com",
    phoneNumber: "1234567890",
    password: hashedPassword,
    status: UserStatus.ACTIVE,
    role: UserRole.ADMIN,
    fullName: "Super Admin",

  };

  const isExistUser = await prisma.user.findUnique({
    where: {
      phoneNumber: payload.phoneNumber,
    },
  });

  if (isExistUser) return;

  await prisma.user.create({
    data: payload,
  });
};
