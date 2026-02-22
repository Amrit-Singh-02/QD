import { Router } from "express";
import {
  addSubCategory,
  deleteSubCategory,
  getSubCategories,
  updateSubCategory,
} from "../../controllers/admin/subCategory.controller.js";
import upload from "../../middlewares/multer.middleware.js";
import {
  authenticate,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/all", authenticate, authorizeRoles("admin"), getSubCategories);
router.post(
  "/add",
  authenticate,
  authorizeRoles("admin"),
  upload.single("image"),
  addSubCategory,
);
router.patch(
  "/:id",
  authenticate,
  authorizeRoles("admin"),
  upload.single("image"),
  updateSubCategory,
);
router.delete("/:id", authenticate, authorizeRoles("admin"), deleteSubCategory);

export default router;
