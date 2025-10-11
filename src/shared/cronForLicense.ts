import cron from "node-cron";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import prisma from "./prisma";
import { NotificationService } from "../app/modules/Notification/Notification.service";


dayjs.extend(utc);
dayjs.extend(timezone);

cron.schedule("0 0 * * *", async () => {
  console.log("🔄 Checking for driver license renewal reminders...");

  const now = dayjs().tz("Asia/Beirut");

  try {
    const drivers = await prisma.user.findMany({
      where: {
        role: "DRIVER",
        adminApprovedStatus: "APPROVED",
        licenseExpiryDate: { not: null },
        fcmToken: { not: null },
      },
    });

    for (const driver of drivers) {
      const expiryDate = dayjs(driver.licenseExpiryDate).tz("Asia/Beirut");
      const daysLeft = expiryDate.diff(now, "day");

      // Skip expired ones
      if (daysLeft <= 0) continue;

      // ৩০ দিনের মধ্যে expire হলে notification পাঠাও
      if (daysLeft <= 30) {
        await NotificationService.sendNotification(
          driver.fcmToken!,
          {
            title: "License Renewal Reminder",
            body: `Your driving license will expire in ${daysLeft} days. Please renew it to stay active.`,
            type: "DOCUMENT_REMINDER",
            data: driver.id.toString(),
            targetId: driver.id,
            slug: "license-renewal",
          },
          driver.id
        );

        console.log(
          `📩 Reminder sent to ${driver.fullName} (${daysLeft} days left)`
        );
      }
    }

    console.log("✅ Renewal reminder check complete.");
  } catch (error) {
    console.error("❌ Error checking renewal reminders:", error);
  }
});
