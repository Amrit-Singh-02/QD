import { Router } from "express";
import {
  getAllOrders,
  updateOrderStatus,
} from "../../controllers/admin/order.controller.js";
import {
  authenticate,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { updateOrderStatusSchema } from "../../validators/order.validator.js";

const adminOrderRouter = Router();

adminOrderRouter.get("/get", authenticate, authorizeRoles("admin"), getAllOrders);
adminOrderRouter.patch(
  "/:id/status",
  authenticate,
  authorizeRoles("admin"),
  validate(updateOrderStatusSchema),
  updateOrderStatus,
);

export default adminOrderRouter;
