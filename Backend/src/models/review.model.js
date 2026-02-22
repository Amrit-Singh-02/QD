import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    order: {
      type: mongoose.Schema.ObjectId,
      ref: "Order",
      required: true,
    },
    agent: {
      type: mongoose.Schema.ObjectId,
      ref: "DeliveryAgent",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
      },
    },
    toObject: {
      transform(doc, ret) {
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
      },
    },
  },
);

reviewSchema.index({ order: 1, user: 1 }, { unique: true });
reviewSchema.index({ agent: 1 });

const ReviewModel = mongoose.model("Review", reviewSchema);

export default ReviewModel;
