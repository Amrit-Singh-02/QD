import api from "./api";

export const orderService = {
  createOrder: async (orderData) => {
    const response = await api.post("/user/order/create", orderData);
    return response.data;
  },

  getMyOrders: async () => {
    const response = await api.get("/user/order/my");
    return response.data;
  },

  getOrderById: async (id) => {
    const response = await api.get(`/user/order/${id}`);
    return response.data;
  },

  cancelOrder: async (id) => {
    const response = await api.patch(`/user/order/${id}/cancel`);
    return response.data;
  },
  retryAssign: async (id) => {
    const response = await api.patch(`/user/order/${id}/retry-assign`);
    return response.data;
  },
  submitReview: async (data) => {
    const response = await api.post("/user/review/create", data);
    return response.data;
  },
  getOrderReview: async (orderId) => {
    const response = await api.get(`/user/review/order/${orderId}`);
    return response.data;
  },
  createHelpTicket: async (data) => {
    const response = await api.post("/user/help/create", data);
    return response.data;
  },
  getMyTickets: async () => {
    const response = await api.get("/user/help/my-tickets");
    return response.data;
  },
};
