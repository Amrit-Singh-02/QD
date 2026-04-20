import mongoose from "mongoose";

const pendingReorderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    patternId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ReorderPattern",
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "skipped", "expired"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true },
);

pendingReorderSchema.index({ userId: 1, status: 1, expiresAt: 1 });

const PendingReorderModel = mongoose.model("PendingReorder", pendingReorderSchema);
export default PendingReorderModel;
