// user routes
import * as user from "../../controllers/user/user.controller.js";
import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updatePasswordSchema,
  updateProfileSchema,
} from "../../validators/user.validator.js";

const router = Router();

router.post("/register", validate(registerSchema), user.registerUser);
router.post("/login", validate(loginSchema), user.login);
router.post("/logout", user.logout);
router.patch(
  "/update-profile",
  validate(updateProfileSchema),
  authenticate,
  user.updateProfile
);
router.patch(
  "/update-password",
  validate(updatePasswordSchema),
  authenticate,
  user.changePassword
);
router.get("/verify-email/:emailToken", user.verifyEmail);
router.post(
  "/resend-verification",
  validate(forgotPasswordSchema),
  user.resendEmailVerificationLink
);
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  user.forgotPassword
);
router.post(
  "/reset-password/:passwordToken",
  validate(resetPasswordSchema),
  user.resetPassword
);
router.get("/current", authenticate, user.currentUser);

export default router;
