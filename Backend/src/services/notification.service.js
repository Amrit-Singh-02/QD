import NotificationModel from '../models/notification.model.js';
import { getUserRoom } from './presence.service.js';
import ApiResponse from '../utils/ApiResponse.util.js';
import CustomError from '../utils/customError.util.js';

/**
 * Create a notification for a user.
 * @param {string} userId
 * @param {string} type
 * @param {string} message
 */
export const createNotification = async (userId, type, message, app = null) => {
  if (!userId) throw new CustomError(400, 'User ID required');
  const notif = await NotificationModel.create({ userId, type, message });
  if (app) {
    try {
      const io = app.get('io');
      const notifId = notif?._id?.toString?.() || notif?._id;
      if (io && userId) {
        io.to(getUserRoom(String(userId))).emit('userNotification', {
          _id: notifId,
          type: notif?.type,
          message: notif?.message,
          createdAt: notif?.createdAt,
        });
      }
    } catch (err) {
      console.error('Failed to emit notification:', err?.message || err);
    }
  }
  return notif;
};

/**
 * Get unread notifications for a user.
 */
export const getUserNotifications = async (userId) => {
  if (!userId) throw new CustomError(400, 'User ID required');
  const notifs = await NotificationModel.find({ userId, isRead: false })
    .sort({ createdAt: -1 })
    .lean();
  return notifs;
};

/**
 * Mark a notification as read.
 */
export const markNotificationRead = async (userId, notifId) => {
  await NotificationModel.updateOne({ _id: notifId, userId }, { $set: { isRead: true } });
};
