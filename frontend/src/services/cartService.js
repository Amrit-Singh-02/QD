import api from "./api";

export const addToCart = async (productId, quantity = 1) => {
  try {
    const response = await api.post("/cart/create", { productId, quantity });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getCart = async () => {
  try {
    const response = await api.get("/cart/get");
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateCartItem = async (cartItemId, quantity) => {
  try {
    const response = await api.put("/cart/update-qty", {
      cartItemId,
      quantity,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};


export const deleteCartItem = async (cartItemId) => {
  try {
    const response = await api.delete("/cart/delete-cart-item", {
      data: { cartItemId },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
