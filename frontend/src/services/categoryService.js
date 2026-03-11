import api from "./api";

export const getAllCategories = async () => {
  try {
    const response = await api.get("/shop/category/all");
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
