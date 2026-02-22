import React, { createContext, useContext, useState, useEffect } from "react";
import {
  addToCart as addToCartService,
  getCart as getCartService,
  updateCartItem as updateCartItemService,
  deleteCartItem as deleteCartItemService,
} from "../services/cartService";
import { useAuth } from "./AuthContext";
import toast from 'react-hot-toast';
import { getProductById } from "../services/productService";

const CartContext = createContext();
const STORAGE_KEY = "qd_guest_cart";

export const useCart = () => {
  return useContext(CartContext);
};

const loadGuestCart = () => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (error) {
    return [];
  }
};

const saveGuestCart = (items) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    // Ignore storage errors
  }
};

const normalizeProduct = (product, productId) => {
  if (!product || typeof product !== "object") return null;
  const id = product.id || product._id || productId;
  if (!id) return null;
  return {
    ...product,
    id,
    _id: product._id || product.id || id,
  };
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => loadGuestCart());
  const [loading, setLoading] = useState(false);
  const { user } = useAuth(); // Assuming AuthContext provides user info

  const fetchCart = async () => {
    if (!user) {
      const guestCart = loadGuestCart();
      setCart(guestCart);
      return;
    }
    setLoading(true);
    try {
      const data = await getCartService();
      setCart(data.payload || []);
    } catch (error) {
      console.error("Failed to fetch cart:", error);
      const message =
        typeof error === "string" ? error : error?.message || "";
      if (message.toLowerCase().includes("cart is empty")) {
        setCart([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  const addToCart = async (productId, quantity = 1, productData = null) => {
    if (!user) {
      try {
        let product = normalizeProduct(productData, productId);
        if (!product) {
          const data = await getProductById(productId);
          product = normalizeProduct(data?.payload, productId);
        }
        if (!product) {
          toast.error("Unable to add this item to cart.");
          return;
        }

        const existing = loadGuestCart();
        const itemId = `guest-${product.id}`;
        const next = [...existing];
        const index = next.findIndex((item) => item._id === itemId);
        if (index >= 0) {
          next[index] = {
            ...next[index],
            quantity: next[index].quantity + quantity,
          };
        } else {
          next.push({
            _id: itemId,
            productId: product,
            quantity,
          });
        }
        setCart(next);
        saveGuestCart(next);
        toast.success("Item added to cart!");
      } catch (error) {
        console.error("Failed to add to cart:", error);
        toast.error(error.message || "Failed to add to cart");
      }
      return;
    }
    try {
      await addToCartService(productId, quantity);
      await fetchCart(); // Refresh cart after adding
      toast.success("Item added to cart!");
    } catch (error) {
      console.error("Failed to add to cart:", error);
      toast.error(error.message || "Failed to add to cart");
    }
  };

  const updateQuantity = async (cartItemId, quantity) => {
    if (!user) {
      const existing = loadGuestCart();
      const next = existing
        .map((item) =>
          item._id === cartItemId
            ? { ...item, quantity: Math.max(1, quantity) }
            : item,
        )
        .filter((item) => item.quantity > 0);
      setCart(next);
      saveGuestCart(next);
      return;
    }
    try {
      await updateCartItemService(cartItemId, quantity);
      await fetchCart();
    } catch (error) {
      console.error("Failed to update quantity:", error);
      toast.error(error.response?.data?.message || error.message || "Failed to update quantity");
    }
  };

  const removeFromCart = async (cartItemId) => {
    if (!user) {
      const existing = loadGuestCart();
      const next = existing.filter((item) => item._id !== cartItemId);
      setCart(next);
      saveGuestCart(next);
      return;
    }
    try {
      await deleteCartItemService(cartItemId);
      await fetchCart();
    } catch (error) {
      console.error("Failed to remove item:", error);
      toast.error(error.response?.data?.message || error.message || "Failed to remove item");
    }
  };

  const value = {
    cart,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    fetchCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
