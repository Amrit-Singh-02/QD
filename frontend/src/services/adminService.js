import api from "./api";

export const adminService = {
  addProduct: async (formData) => {
    const response = await api.post("/admin/product/add", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  getProducts: async () => {
    const response = await api.get("/admin/product/all");
    return response.data;
  },

  getOrders: async (params = {}) => {
    const response = await api.get("/admin/order/get", { params });
    return response.data;
  },

  getCategories: async () => {
    const response = await api.get("/admin/category/all");
    return response.data;
  },

  addCategory: async (payload) => {
    const isFormData =
      typeof FormData !== "undefined" && payload instanceof FormData;
    const response = await api.post("/admin/category/add", payload, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
    });
    return response.data;
  },

  updateCategory: async (id, payload) => {
    const isFormData =
      typeof FormData !== "undefined" && payload instanceof FormData;
    const response = await api.patch(`/admin/category/${id}`, payload, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
    });
    return response.data;
  },
  deleteCategory: async (id) => {
    const response = await api.delete(`/admin/category/${id}`);
    return response.data;
  },

  getSubCategories: async (categoryId) => {
    const response = await api.get("/admin/subcategory/all", {
      params: categoryId ? { categoryId } : {},
    });
    return response.data;
  },

  updateProduct: async (id, data) => {
    const response = await api.patch(`/admin/product/${id}`, data);
    return response.data;
  },

  deleteProduct: async (id) => {
    const response = await api.delete(`/admin/product/${id}`);
    return response.data;
  },

  updateOrderStatus: async (id, payload) => {
    const response = await api.patch(`/admin/order/${id}/status`, payload);
    return response.data;
  },
  createDeliveryAgent: async (payload) => {
    const isFormData =
      typeof FormData !== "undefined" && payload instanceof FormData;
    const response = await api.post("/admin/delivery-agent", payload, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
    });
    return response.data;
  },
  getAllUsers: async () => {
    const response = await api.get("/admin/user/all");
    return response.data;
  },
  getAllAgents: async () => {
    const response = await api.get("/admin/delivery-agent/all");
    return response.data;
  },
  updateDeliveryAgent: async (id, payload) => {
    const isFormData =
      typeof FormData !== "undefined" && payload instanceof FormData;
    const response = await api.patch(`/admin/delivery-agent/${id}`, payload, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
    });
    return response.data;
  },
  deleteDeliveryAgent: async (id) => {
    const response = await api.delete(`/admin/delivery-agent/${id}`);
    return response.data;
  },
  getDashboard: async () => {
    const response = await api.get("/admin/dashboard");
    return response.data;
  },
  getHelpTickets: async (params = {}) => {
    const response = await api.get("/admin/help-tickets", { params });
    return response.data;
  },
  updateHelpTicket: async (id, data) => {
    const response = await api.patch(`/admin/help-tickets/${id}`, data);
    return response.data;
  },
  getAuditLogs: async (params = {}) => {
    const response = await api.get("/admin/audit-logs/all", { params });
    return response.data;
  },
  getAuditLogCount: async (params = {}) => {
    const response = await api.get("/admin/audit-logs/all", {
      params: { ...params, page: 1, limit: 1 },
    });
    return response.data;
  },
};
