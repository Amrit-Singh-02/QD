import { Router } from "express";
import {
  addCategory,
  getCategories,
  updateCategory,
} from "../../controllers/admin/category.controller.js";
import upload from "../../middlewares/multer.middleware.js";
import {
  authenticate,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/all", authenticate, authorizeRoles("admin"), getCategories);
router.post(
  "/add",
  authenticate,
  authorizeRoles("admin"),
  upload.single("image"),
  addCategory,
);
router.patch(
  "/:id",
  authenticate,
  authorizeRoles("admin"),
  upload.single("image"),
  updateCategory,
);

export default router;
