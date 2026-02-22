import { Router } from "express";
import {
  getAllOrders,
  updateOrderStatus,
} from "../../controllers/admin/order.controller.js";
import {
  authenticate,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";

const adminOrderRouter = Router();

adminOrderRouter.get("/get", authenticate, authorizeRoles("admin"), getAllOrders);
adminOrderRouter.patch(
  "/:id/status",
  authenticate,
  authorizeRoles("admin"),
  updateOrderStatus,
);

export default adminOrderRouter;
