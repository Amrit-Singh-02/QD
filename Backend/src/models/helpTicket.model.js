import mongoose from "mongoose";

const TICKET_CATEGORIES = [
  "Order Delayed",
  "Wrong Item Received",
  "Payment Issue",
  "Refund Issue",
  "Delivery Agent Behavior",
  "Technical Issue",
  "Other",
];

const TICKET_STATUS = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const TICKET_PRIORITY = ["LOW", "MEDIUM", "HIGH"];

const helpTicketSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    orderId: {
      type: mongoose.Schema.ObjectId,
      ref: "Order",
      default: null,
    },
    category: {
      type: String,
      enum: TICKET_CATEGORIES,
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: TICKET_STATUS,
      default: "OPEN",
    },
    priority: {
      type: String,
      enum: TICKET_PRIORITY,
      default: "MEDIUM",
    },
    adminResponse: {
      type: String,
      default: "",
      trim: true,
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

helpTicketSchema.index({ userId: 1 });
helpTicketSchema.index({ status: 1 });
helpTicketSchema.index({ createdAt: -1 });

const HelpTicketModel = mongoose.model("HelpTicket", helpTicketSchema);

export { TICKET_CATEGORIES, TICKET_STATUS, TICKET_PRIORITY };
export default HelpTicketModel;
