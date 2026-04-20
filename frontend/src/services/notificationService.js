import api from './api';

export const fetchNotifications = async () => {
  const { data } = await api.get('/user/notification');
  return data?.payload || [];
};

export const markNotificationRead = async (id) => {
  await api.patch(`/user/notification/${id}/read`);
};
