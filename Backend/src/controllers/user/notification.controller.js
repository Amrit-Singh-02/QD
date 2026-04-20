import expressAsyncHandler from 'express-async-handler';
import ApiResponse from '../../utils/ApiResponse.util.js';
import CustomError from '../../utils/customError.util.js';
import { getUserNotifications, markNotificationRead } from '../../services/notification.service.js';

export const getNotifications = expressAsyncHandler(async (req, res, next) => {
  const userId = req.myUser?.id;
  if (!userId) return next(new CustomError(401, 'Unauthorized'));
  const notifs = await getUserNotifications(userId);
  new ApiResponse(200, 'Fetched notifications', notifs).send(res);
});

export const readNotification = expressAsyncHandler(async (req, res, next) => {
  const userId = req.myUser?.id;
  if (!userId) return next(new CustomError(401, 'Unauthorized'));
  const { id } = req.params;
  await markNotificationRead(userId, id);
  new ApiResponse(200, 'Notification marked as read').send(res);
});
