import expressAsyncHandler from "express-async-handler";
import ApiResponse from "../../utils/ApiResponse.util.js";
import CustomError from "../../utils/customError.util.js";
import CartModel from "../../models/cart.model.js";
import ProductModel from "../../models/product.model.js";

export const addToCartItemController = expressAsyncHandler(
  async (req, res, next) => {
    const userId = req.myUser?.id;
    if (!userId) return next(new CustomError(401, "Unauthorized"));

    const { productId, quantity } = req.body;
    const qty = Number(quantity);
    if (!productId) return next(new CustomError(400, "Product id is required"));

    const product = await ProductModel.findById(productId);
    if (!product) return next(new CustomError(404, "Product not found"));
    if (product.stocks < qty) {
      return next(new CustomError(400, "Insufficient stock"));
    }

    let existingItem = await CartModel.findOne({ userId, productId });
    if (existingItem) {
      const newQty = existingItem.quantity + qty;
      if (product.stocks < newQty) {
        return next(new CustomError(400, "Insufficient stock"));
      }
      existingItem.quantity = newQty;
      await existingItem.save();
      return new ApiResponse(
        200,
        "Cart updated successfully",
        existingItem
      ).send(res);
    }

    const newItem = await CartModel.create({
      userId,
      productId,
      quantity: qty,
    });
    if (!newItem) {
      return next(new CustomError(400, "Cannot add item to cart"));
    }

    new ApiResponse(201, "Item added to cart", newItem).send(res);
  }
);

export const getCartItemController = expressAsyncHandler(
  async (req, res, next) => {
    const userId = req.myUser?.id;
    if (!userId) return next(new CustomError(401, "Unauthorized"));

    const cartItems = await CartModel.find({ userId }).populate("productId");
    if (!cartItems || cartItems.length === 0) {
      return new ApiResponse(200, "Cart is empty", []).send(res);
    }

    new ApiResponse(200, "Fetched cart items successfully", cartItems).send(
      res
    );
  }
);

export const updateCartItemQtyController = expressAsyncHandler(
  async (req, res, next) => {
    const userId = req.myUser?.id;
    if (!userId) return next(new CustomError(401, "Unauthorized"));

    const { cartItemId, productId, quantity } = req.body;
    const targetId = cartItemId;

    if (!targetId && !productId) {
      return next(
        new CustomError(400, "Cart item id or product id is required")
      );
    }

    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty < 1) {
      return next(new CustomError(400, "Quantity must be at least 1"));
    }

    let cartItem = null;
    if (targetId) {
      cartItem = await CartModel.findOne({ _id: targetId, userId });
    } else {
      cartItem = await CartModel.findOne({ productId, userId });
    }

    if (!cartItem) {
      return next(new CustomError(404, "Cart item not found"));
    }

    const product = await ProductModel.findById(cartItem.productId);
    if (!product) return next(new CustomError(404, "Product not found"));
    if (product.stocks < qty) {
      return next(new CustomError(400, "Insufficient stock"));
    }

    cartItem.quantity = qty;
    await cartItem.save();

    new ApiResponse(200, "Cart quantity updated", cartItem).send(res);
  }
);

export const deleteCartItemQtyController = expressAsyncHandler(
  async (req, res, next) => {
    const userId = req.myUser?.id;
    if (!userId) return next(new CustomError(401, "Unauthorized"));

    const { cartItemId } = req.body;

    if (!cartItemId) {
      return next(new CustomError(400, "Cart item id  required"));
    }
    const cartAvail = await CartModel.findById(cartItemId);
    if (!cartAvail) return next(new CustomError(404, "cart not Available!"));

    const deletedCart = await CartModel.findByIdAndDelete(cartItemId);
    if (!deletedCart) {
      return next(new CustomError(404, "Cart item not found"));
    }

    new ApiResponse(200, "Cart item deleted successfully", deletedCart).send(
      res
    );
  }
);
