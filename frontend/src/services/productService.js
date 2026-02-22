import api from "./api";

export const getAllProducts = async (params = {}) => {
  try {
    const response = await api.get("/shop/product/all", { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getProductById = async (id) => {
  try {
    const response = await api.get(`/shop/product/one/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const searchProducts = async (keyword) => {
  try {
    const response = await api.get(`/shop/product/search?keyword=${keyword}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
