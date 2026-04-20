import mongoose from "mongoose";

const orderHistoryEntrySchema = new mongoose.Schema(
  {
    orderedAt: { type: Date, required: true },
    quantity: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const reorderPatternSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: {
      type: String,
      default: "",
      trim: true,
    },
    avgDaysBetweenOrders: {
      type: Number,
      default: null,
      min: 0,
    },
    preferredQuantity: {
      type: Number,
      default: 1,
      min: 0,
    },
    preferredUnit: {
      type: String,
      default: "piece",
      trim: true,
    },
    reorderAtQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    isAutoReorderOn: {
      type: Boolean,
      default: false,
    },
    lastReorderedAt: {
      type: Date,
      default: null,
    },
    nextPredictedDate: {
      type: Date,
      default: null,
    },
    confidenceScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
    },
    orderHistory: {
      type: [orderHistoryEntrySchema],
      default: [],
    },
  },
  { timestamps: true },
);

reorderPatternSchema.index({ userId: 1 });
reorderPatternSchema.index({ userId: 1, productId: 1 }, { unique: true });

const ReorderPatternModel = mongoose.model("ReorderPattern", reorderPatternSchema);
export default ReorderPatternModel;
