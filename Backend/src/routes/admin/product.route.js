import { Router } from "express";
import {
  addProduct,
  deleteImage,
  deleteProduct,
  getProduct,
  getProducts,
  updateImage,
  updateProduct,
} from "../../controllers/admin/product.controller.js";
import upload from "../../middlewares/multer.middleware.js";
import {
  authenticate,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";

const router = Router();

router.post(
  "/add",
  authenticate,
  authorizeRoles("admin"),
  upload.single("images"),
  addProduct,
);
router.patch(
  "/updImg",
  authenticate,
  authorizeRoles("admin"),
  upload.single("images"),
  updateImage,
);
router.patch(
  "/delImg",
  authenticate,
  authorizeRoles("admin"),
  deleteImage,
);

router.get("/all", authenticate, authorizeRoles("admin"), getProducts);
router.get("/:id", authenticate, authorizeRoles("admin"), getProduct);
router.patch("/:id", authenticate, authorizeRoles("admin"), updateProduct);
router.delete("/:id", authenticate, authorizeRoles("admin"), deleteProduct);

export default router;
