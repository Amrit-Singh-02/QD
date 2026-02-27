import { Router } from "express";
import {
  cancelMyOrder,
  createOrderFromCart,
  createPaypalOrderFromCart,
  capturePaypalOrderPayment,
  getMyOrderById,
  getMyOrders,
  getPaypalClientConfig,
  retryAssignOrder,
} from "../../controllers/user/order.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const orderRouter = Router();

orderRouter.post("/create", authenticate, createOrderFromCart);
orderRouter.get("/paypal/client-id", authenticate, getPaypalClientConfig);
orderRouter.post("/paypal/create", authenticate, createPaypalOrderFromCart);
orderRouter.post("/paypal/capture", authenticate, capturePaypalOrderPayment);
orderRouter.get("/my", authenticate, getMyOrders);
orderRouter.get("/:id", authenticate, getMyOrderById);
orderRouter.patch("/:id/cancel", authenticate, cancelMyOrder);
orderRouter.patch("/:id/retry-assign", authenticate, retryAssignOrder);

export default orderRouter;
