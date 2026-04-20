import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.ObjectId, ref: 'user', required: true },
    type: { type: String, required: true }, // e.g., 'out_of_stock', 'order_update', 'delivery_update'
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, isRead: 1 });

const NotificationModel = mongoose.model('Notification', notificationSchema);
export default NotificationModel;
