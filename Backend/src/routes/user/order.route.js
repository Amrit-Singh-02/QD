import { Router } from "express";
import {
  cancelMyOrder,
  createOrderFromCart,
  createPaypalOrderFromCart,
  capturePaypalOrderPayment,
  createStripeOrderFromCart,
  confirmStripePayment,
  getMyOrderById,
  getMyOrders,
  getPaypalClientConfig,
  retryAssignOrder,
} from "../../controllers/user/order.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { rateLimit } from "../../middlewares/rateLimit.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { rateLimitConfig } from "../../config/rateLimit.config.js";
import {
  capturePaypalSchema,
  createOrderSchema,
  createPaypalOrderSchema,
  createStripeOrderSchema,
  confirmStripeSchema,
} from "../../validators/order.validator.js";

const orderRouter = Router();
const orderLimiter = rateLimit(rateLimitConfig.order);
const paymentLimiter = rateLimit(rateLimitConfig.payment);

orderRouter.post(
  "/create",
  authenticate,
  orderLimiter,
  validate(createOrderSchema),
  createOrderFromCart,
);
orderRouter.get("/paypal/client-id", authenticate, getPaypalClientConfig);
orderRouter.post(
  "/paypal/create",
  authenticate,
  paymentLimiter,
  validate(createPaypalOrderSchema),
  createPaypalOrderFromCart,
);
orderRouter.post(
  "/paypal/capture",
  authenticate,
  paymentLimiter,
  validate(capturePaypalSchema),
  capturePaypalOrderPayment,
);
orderRouter.post(
  "/stripe/create",
  authenticate,
  paymentLimiter,
  validate(createStripeOrderSchema),
  createStripeOrderFromCart,
);
orderRouter.post(
  "/stripe/confirm",
  authenticate,
  paymentLimiter,
  validate(confirmStripeSchema),
  confirmStripePayment,
);
orderRouter.get("/my", authenticate, getMyOrders);
orderRouter.get("/:id", authenticate, getMyOrderById);
orderRouter.patch("/:id/cancel", authenticate, cancelMyOrder);
orderRouter.patch("/:id/retry-assign", authenticate, retryAssignOrder);

export default orderRouter;
