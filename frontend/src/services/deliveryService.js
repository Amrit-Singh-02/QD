import api from "./api";

export const deliveryService = {
  login: async (credentials) => {
    const response = await api.post("/delivery/login", credentials);
    return response.data;
  },
  logout: async () => {
    const response = await api.post("/delivery/logout");
    return response.data;
  },
  current: async () => {
    const response = await api.get("/delivery/current");
    return response.data;
  },
  getActiveOrder: async () => {
    const response = await api.get("/delivery/order/active");
    return response.data;
  },
  getOrderHistory: async () => {
    const response = await api.get("/delivery/order/history");
    return response.data;
  },
  pickupOrder: async (orderId) => {
    const response = await api.patch(`/delivery/order/${orderId}/pickup`);
    return response.data;
  },
  acceptPayment: async (orderId) => {
    const response = await api.patch(
      `/delivery/order/${orderId}/payment-accepted`,
    );
    return response.data;
  },
  markOutForDelivery: async (orderId) => {
    const response = await api.patch(
      `/delivery/order/${orderId}/out-for-delivery`,
    );
    return response.data;
  },
  markDelivered: async (orderId) => {
    const response = await api.patch(`/delivery/order/${orderId}/delivered`);
    return response.data;
  },
  cancelOrder: async (orderId) => {
    const response = await api.patch(`/delivery/order/${orderId}/cancel`);
    return response.data;
  },
};
