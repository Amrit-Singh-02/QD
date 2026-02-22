import { Router } from "express";
import {
  addToCartItemController,
  deleteCartItemQtyController,
  getCartItemController,
  updateCartItemQtyController,
} from "../../controllers/user/cart.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const cartRouter = Router();

cartRouter.post("/create", authenticate, addToCartItemController);
cartRouter.get("/get", authenticate, getCartItemController);
cartRouter.put("/update-qty", authenticate, updateCartItemQtyController);
cartRouter.delete(
  "/delete-cart-item",
  authenticate,
  deleteCartItemQtyController
);

export default cartRouter;
