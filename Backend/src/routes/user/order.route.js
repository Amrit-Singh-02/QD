import { Router } from "express";
import {
  cancelMyOrder,
  createOrderFromCart,
  getMyOrderById,
  getMyOrders,
  retryAssignOrder,
} from "../../controllers/user/order.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const orderRouter = Router();

orderRouter.post("/create", authenticate, createOrderFromCart);
orderRouter.get("/my", authenticate, getMyOrders);
orderRouter.get("/:id", authenticate, getMyOrderById);
orderRouter.patch("/:id/cancel", authenticate, cancelMyOrder);
orderRouter.patch("/:id/retry-assign", authenticate, retryAssignOrder);

export default orderRouter;
