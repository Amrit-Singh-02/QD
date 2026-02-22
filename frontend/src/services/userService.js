import api from "./api";

export const userService = {
  // ~ Orders
  getMyOrders: async () => {
    const response = await api.get("/user/my");
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

  // ~ Addresses
  getMyAddresses: async () => {
    const response = await api.get("/user/address");
    return response.data;
  },

  addAddress: async (data) => {
    const response = await api.post("/user/address/add", data);
    return response.data;
  },

  updateAddress: async (id, data) => {
    const response = await api.patch(`/user/address/${id}`, data);
    return response.data;
  },

  deleteAddress: async (id) => {
    const response = await api.delete(`/user/address/${id}`);
    return response.data;
  },

  addLocationAddress: async (data) => {
    const response = await api.post("/user/address/location", data);
    return response.data;
  },
};
