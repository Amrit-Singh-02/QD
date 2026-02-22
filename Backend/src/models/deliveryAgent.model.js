import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const deliveryAgentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    aadharNumber: {
      type: String,
      trim: true,
      default: "",
    },
    profileImage: {
      url: {
        type: String,
        default: "",
        trim: true,
      },
      asset_id: {
        type: String,
        default: "",
        trim: true,
      },
      public_id: {
        type: String,
        default: "",
        trim: true,
      },
      _id: false,
    },
    age: {
      type: Number,
      min: 18,
      default: null,
    },
    bikeName: {
      type: String,
      trim: true,
      default: "",
    },
    bikeNumber: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      default: "delivery",
      enum: ["delivery"],
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    isAvailable: {
      type: Boolean,
      default: false,
    },
    currentLocation: {
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    pincode: {
      type: String,
      trim: true,
    },
    deliveryPincodes: {
      type: [String],
      default: [],
    },
    deliveryAreas: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalDeliveries: {
      type: Number,
      default: 0,
      min: 0,
    },
    activeOrder: {
      type: mongoose.Schema.ObjectId,
      ref: "Order",
      default: null,
    },
    acceptanceRate: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    avgDeliveryTimeMs: {
      type: Number,
      default: 0,
    },
    recentAssignments: {
      type: Number,
      default: 0,
    },
    createdByAdmin: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
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

deliveryAgentSchema.index({ currentLocation: "2dsphere" });
deliveryAgentSchema.index({ isAvailable: 1, isOnline: 1 });
deliveryAgentSchema.index({
  currentLocation: "2dsphere",
  isOnline: 1,
  isAvailable: 1,
  activeOrder: 1,
  pincode: 1,
});

deliveryAgentSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  if (typeof this.password === "string" && this.password.startsWith("$2"))
    return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

deliveryAgentSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const DeliveryAgentModel = mongoose.model("DeliveryAgent", deliveryAgentSchema);

export default DeliveryAgentModel;
