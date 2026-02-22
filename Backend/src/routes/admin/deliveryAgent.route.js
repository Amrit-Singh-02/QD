import { Router } from "express";
import {
  createDeliveryAgent,
  deleteDeliveryAgent,
  getAllDeliveryAgents,
  updateDeliveryAgent,
} from "../../controllers/admin/deliveryAgent.controller.js";
import {
  authenticate,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";
import upload from "../../middlewares/multer.middleware.js";

const router = Router();

router.get("/all", authenticate, authorizeRoles("admin"), getAllDeliveryAgents);

router.post(
  "/",
  authenticate,
  authorizeRoles("admin"),
  upload.single("profileImage"),
  createDeliveryAgent,
);

router.patch(
  "/:id",
  authenticate,
  authorizeRoles("admin"),
  upload.single("profileImage"),
  updateDeliveryAgent,
);

router.delete(
  "/:id",
  authenticate,
  authorizeRoles("admin"),
  deleteDeliveryAgent,
);

export default router;
