import cron from "node-cron";
import PantryItemModel from "../models/pantryItem.model.js";
import { sendPushNotification } from "../services/fcm.service.js";

export const runExpiryAlertJob = (app) => {
  if (process.env.PANTRY_OS_ENABLED === "false") return;

  cron.schedule("30 2 * * *", async () => {
    try {
      const redis = app.get("redis");
      const now = new Date();
      const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const atRiskItems = await PantryItemModel.find({
        isActive: true,
        expiryDate: { $gte: now, $lte: in7Days },
      }).populate("userId", "fcmToken name");

      for (const item of atRiskItems) {
        const daysLeft = Math.ceil(
          (new Date(item.expiryDate).getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
        );
        let alertType = null;
        if (daysLeft <= 1) alertType = "1_day";
        else if (daysLeft <= 3) alertType = "3_days";
        else if (daysLeft <= 7) alertType = "7_days";
        if (!alertType) continue;

        const dedupKey = `expiry:alert:sent:${item._id}:${alertType}`;
        if (redis) {
          const alreadySent = await redis.get(dedupKey);
          if (alreadySent) continue;
        }

        const messages = {
          "7_days": `Your ${item.name} expires in 7 days. Plan to use it.`,
          "3_days": `${item.name} expires in ${daysLeft} days. Add to today's recipe?`,
          "1_day": `${item.name} expires tomorrow. Cook it or reorder now.`,
        };

        await sendPushNotification(item.userId?.fcmToken, {
          title: "Pantry Alert",
          body: messages[alertType],
          data: { type: "expiry_alert", pantryItemId: String(item._id), alertType },
        });

        if (redis) {
          await redis.setEx(dedupKey, 23 * 3600, "1");
        }
      }

      await PantryItemModel.updateMany(
        { isActive: true, expiryDate: { $lt: now } },
        { $set: { isActive: false } },
      );
    } catch (error) {
      console.error("Expiry alert job failed:", error);
    }
  });
};
