import { Router } from "express";
import { authenticate, authorizeRoles } from "../../middlewares/auth.middleware.js";
import { getAllUsersWithOrders } from "../../controllers/admin/user.controller.js";

const adminUserRouter = Router();

adminUserRouter.get(
  "/all",
  authenticate,
  authorizeRoles("admin"),
  getAllUsersWithOrders,
);

export default adminUserRouter;
