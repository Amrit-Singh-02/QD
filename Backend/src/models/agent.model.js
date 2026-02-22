import mongoose from "mongoose";

const agentSchema = new mongoose.Schema(
  {
    agentName: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    aadharNumber: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
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
      required: true,
      min: 18,
    },
    bikeName: {
      type: String,
      required: true,
      trim: true,
    },
    bikeNumber: {
      type: String,
      required: true,
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

const AgentModel = mongoose.model("Agent", agentSchema);

export default AgentModel;
