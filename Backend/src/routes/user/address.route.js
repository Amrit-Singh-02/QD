import { Router } from "express";
import {
  addAddress,
  deleteAddress,
  updateAddress,
  getMyAddresses,
  saveLocationAddress,
} from "../../controllers/user/address.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  addAddressSchema,
  saveLocationSchema,
} from "../../validators/address.validator.js";

const router = Router();

router.post("/add", authenticate, validate(addAddressSchema), addAddress);
router.post(
  "/location",
  authenticate,
  validate(saveLocationSchema),
  saveLocationAddress,
);
router.get("/", authenticate, getMyAddresses);
router.patch("/:id", authenticate, updateAddress);
router.delete("/:id", authenticate, deleteAddress);

export default router;
