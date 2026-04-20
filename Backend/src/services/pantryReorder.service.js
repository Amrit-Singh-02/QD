import ReorderPatternModel from "../models/reorderPattern.model.js";
import ProductModel from "../models/product.model.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const learnReorderPatterns = async ({ userId, orderItems = [] }) => {
  if (!userId || !Array.isArray(orderItems) || orderItems.length === 0) return;

  for (const item of orderItems) {
    const productId = item?.product;
    if (!productId) continue;

    const product = await ProductModel.findById(productId)
      .select("name typicalReorderUnit")
      .lean();
    if (!product) continue;

    let pattern = await ReorderPatternModel.findOne({ userId, productId });
    if (!pattern) {
      pattern = new ReorderPatternModel({
        userId,
        productId,
        productName: product.name || item.name || "",
        preferredUnit: product.typicalReorderUnit || "piece",
      });
    }

    pattern.orderHistory.push({
      orderedAt: new Date(),
      quantity: Number(item.quantity) || 0,
    });

    if (pattern.orderHistory.length > 10) {
      pattern.orderHistory = pattern.orderHistory.slice(-10);
    }

    if (pattern.orderHistory.length >= 2) {
      const dates = pattern.orderHistory.map((h) => new Date(h.orderedAt).getTime());
      const gaps = [];
      for (let i = 1; i < dates.length; i += 1) {
        gaps.push((dates[i] - dates[i - 1]) / MS_PER_DAY);
      }
      const avgGap = gaps.reduce((sum, g) => sum + g, 0) / gaps.length;
      pattern.avgDaysBetweenOrders = Math.max(0, Number(avgGap.toFixed(2)));
      pattern.nextPredictedDate = new Date(Date.now() + pattern.avgDaysBetweenOrders * MS_PER_DAY);
    }

    const quantities = pattern.orderHistory.map((h) => Number(h.quantity) || 0);
    const latestQty = quantities[quantities.length - 1] || 1;
    pattern.preferredQuantity = latestQty;
    pattern.reorderAtQuantity = Math.max(1, Math.floor(latestQty * 0.2));
    pattern.confidenceScore = Math.min(1, pattern.orderHistory.length / 5);
    pattern.lastReorderedAt = new Date();

    await pattern.save();
  }
};
