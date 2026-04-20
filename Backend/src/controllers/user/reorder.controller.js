import expressAsyncHandler from "express-async-handler";
import ApiResponse from "../../utils/ApiResponse.util.js";
import CustomError from "../../utils/customError.util.js";
import ReorderPatternModel from "../../models/reorderPattern.model.js";
import PendingReorderModel from "../../models/pendingReorder.model.js";
import CartModel from "../../models/cart.model.js";

export const getPatterns = expressAsyncHandler(async (req, res, next) => {
  const userId = req.myUser?.id;
  if (!userId) return next(new CustomError(401, "Unauthorized"));

  const patterns = await ReorderPatternModel.find({ userId })
    .sort({ updatedAt: -1 })
    .populate("productId", "name price images")
    .lean();

  new ApiResponse(200, "Fetched reorder patterns", patterns).send(res);
});

export const getPendingReorders = expressAsyncHandler(async (req, res, next) => {
  const userId = req.myUser?.id;
  if (!userId) return next(new CustomError(401, "Unauthorized"));

  const pending = await PendingReorderModel.find({
    userId,
    status: "pending",
    expiresAt: { $gt: new Date() },
  })
    .populate("patternId")
    .populate("productId", "name price images")
    .lean();

  new ApiResponse(200, "Fetched pending reorders", pending).send(res);
});

export const getUpcomingReorders = expressAsyncHandler(async (req, res, next) => {
  const userId = req.myUser?.id;
  if (!userId) return next(new CustomError(401, "Unauthorized"));

  const now = new Date();
  const inDays = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
  const upcoming = await ReorderPatternModel.find({
    userId,
    nextPredictedDate: { $ne: null, $gte: now, $lte: inDays },
  })
    .sort({ nextPredictedDate: 1 })
    .populate("productId", "name price images")
    .lean();

  new ApiResponse(200, "Fetched upcoming reorders", upcoming).send(res);
});

export const toggleAutoReorder = expressAsyncHandler(async (req, res, next) => {
  const userId = req.myUser?.id;
  if (!userId) return next(new CustomError(401, "Unauthorized"));
  const { patternId } = req.params;

  const pattern = await ReorderPatternModel.findOne({ _id: patternId, userId });
  if (!pattern) return next(new CustomError(404, "Pattern not found"));

  pattern.isAutoReorderOn = !pattern.isAutoReorderOn;
  await pattern.save();

  new ApiResponse(200, "Auto reorder updated", pattern).send(res);
});

export const confirmReorder = expressAsyncHandler(async (req, res, next) => {
  const userId = req.myUser?.id;
  if (!userId) return next(new CustomError(401, "Unauthorized"));
  const { patternId } = req.params;
  const pattern = await ReorderPatternModel.findOne({ _id: patternId, userId }).populate("productId");
  if (!pattern) return next(new CustomError(404, "Pattern not found"));

  await CartModel.findOneAndUpdate(
    { userId, productId: pattern.productId?._id || pattern.productId },
    {
      $inc: { quantity: Math.max(1, Number(pattern.preferredQuantity) || 1) },
      $setOnInsert: { userId, productId: pattern.productId?._id || pattern.productId },
    },
    { upsert: true, new: true },
  );

  pattern.lastReorderedAt = new Date();
  pattern.nextPredictedDate = pattern.avgDaysBetweenOrders
    ? new Date(Date.now() + pattern.avgDaysBetweenOrders * 24 * 60 * 60 * 1000)
    : pattern.nextPredictedDate;
  await pattern.save();
  await PendingReorderModel.updateMany(
    { patternId: pattern._id, userId, status: "pending" },
    { $set: { status: "confirmed" } },
  );

  new ApiResponse(200, "Reorder confirmed", pattern).send(res);
});

export const skipReorder = expressAsyncHandler(async (req, res, next) => {
  const userId = req.myUser?.id;
  if (!userId) return next(new CustomError(401, "Unauthorized"));
  const { patternId } = req.params;

  const pattern = await ReorderPatternModel.findOne({ _id: patternId, userId });
  if (!pattern) return next(new CustomError(404, "Pattern not found"));

  pattern.nextPredictedDate = pattern.avgDaysBetweenOrders
    ? new Date(Date.now() + pattern.avgDaysBetweenOrders * 24 * 60 * 60 * 1000)
    : null;
  await pattern.save();
  await PendingReorderModel.updateMany(
    { patternId: pattern._id, userId, status: "pending" },
    { $set: { status: "skipped" } },
  );

  new ApiResponse(200, "Reorder skipped", pattern).send(res);
});
