import mongoose from "mongoose";

const pantryItemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
      min: 0,
    },
    unit: {
      type: String,
      default: "piece",
      trim: true,
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    category: {
      type: String,
      enum: [
        "dairy",
        "produce",
        "grains",
        "snacks",
        "beverages",
        "condiments",
        "personal_care",
        "cleaning",
        "frozen",
        "other",
      ],
      default: "other",
    },
    barcode: {
      type: String,
      default: null,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    addedFrom: {
      type: String,
      enum: ["manual", "scan", "order_import"],
      default: "manual",
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
  },
  { timestamps: true },
);

pantryItemSchema.index({ userId: 1, isActive: 1 });
pantryItemSchema.index({ userId: 1, expiryDate: 1, isActive: 1 });

const PantryItemModel = mongoose.model("PantryItem", pantryItemSchema);
export default PantryItemModel;
