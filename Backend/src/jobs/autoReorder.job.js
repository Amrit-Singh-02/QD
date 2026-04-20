import cron from "node-cron";
import ReorderPatternModel from "../models/reorderPattern.model.js";
import PantryItemModel from "../models/pantryItem.model.js";
import PendingReorderModel from "../models/pendingReorder.model.js";
import { sendPushNotification } from "../services/fcm.service.js";

export const runAutoReorderJob = () => {
  if (process.env.AUTO_REORDER_ENABLED !== "true") return;

  cron.schedule("0 3 * * *", async () => {
    try {
      const now = new Date();
      const patterns = await ReorderPatternModel.find({
        isAutoReorderOn: true,
        confidenceScore: { $gte: 0.4 },
        $or: [{ nextPredictedDate: { $lte: now } }, { nextPredictedDate: null }],
      }).populate("userId", "fcmToken");

      for (const pattern of patterns) {
        const pantryItem = await PantryItemModel.findOne({
          userId: pattern.userId?._id || pattern.userId,
          productId: pattern.productId,
          isActive: true,
        }).lean();
        const currentQty = pantryItem ? Number(pantryItem.quantity) : 0;
        if (currentQty > Number(pattern.reorderAtQuantity || 0)) continue;

        const existing = await PendingReorderModel.findOne({
          patternId: pattern._id,
          status: "pending",
          expiresAt: { $gt: now },
        });
        if (existing) continue;

        const pending = await PendingReorderModel.create({
          userId: pattern.userId?._id || pattern.userId,
          patternId: pattern._id,
          productId: pattern.productId,
          quantity: pattern.preferredQuantity || 1,
          expiresAt: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        });

        await sendPushNotification(pattern.userId?.fcmToken, {
          title: "Time to Reorder?",
          body: `Running low on ${pattern.productName}. Reorder ${pattern.preferredQuantity} ${pattern.preferredUnit}?`,
          data: { type: "reorder_confirm", pendingReorderId: String(pending._id) },
        });
      }
    } catch (error) {
      console.error("Auto reorder job failed:", error);
    }
  });
};
