import { Router } from "express";
import {
  loginDeliveryAgent,
  logoutDeliveryAgent,
} from "../../controllers/agent/deliveryAuth.controller.js";
import {
  markDelivered,
  markOutForDelivery,
  pickupOrder,
  getActiveOrder,
  getOrderHistory,
  markPaymentAccepted,
  cancelOrderByAgent,
} from "../../controllers/agent/deliveryOrder.controller.js";
import {
  authenticateDelivery,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";
import { currentDeliveryAgent } from "../../controllers/agent/deliveryAuth.controller.js";

const router = Router();

router.post("/login", loginDeliveryAgent);
router.post(
  "/logout",
  authenticateDelivery,
  authorizeRoles("delivery"),
  logoutDeliveryAgent,
);
router.get(
  "/current",
  authenticateDelivery,
  authorizeRoles("delivery"),
  currentDeliveryAgent,
);
router.get(
  "/order/active",
  authenticateDelivery,
  authorizeRoles("delivery"),
  getActiveOrder,
);
router.get(
  "/order/history",
  authenticateDelivery,
  authorizeRoles("delivery"),
  getOrderHistory,
);
router.patch(
  "/order/:id/pickup",
  authenticateDelivery,
  authorizeRoles("delivery"),
  pickupOrder,
);
router.patch(
  "/order/:id/payment-accepted",
  authenticateDelivery,
  authorizeRoles("delivery"),
  markPaymentAccepted,
);
router.patch(
  "/order/:id/out-for-delivery",
  authenticateDelivery,
  authorizeRoles("delivery"),
  markOutForDelivery,
);
router.patch(
  "/order/:id/delivered",
  authenticateDelivery,
  authorizeRoles("delivery"),
  markDelivered,
);
router.patch(
  "/order/:id/cancel",
  authenticateDelivery,
  authorizeRoles("delivery"),
  cancelOrderByAgent,
);

export default router;
