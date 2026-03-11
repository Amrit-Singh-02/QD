// user routes
import * as user from "../../controllers/user/user.controller.js";
import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { rateLimit } from "../../middlewares/rateLimit.middleware.js";
import { rateLimitConfig } from "../../config/rateLimit.config.js";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updatePasswordSchema,
  updateProfileSchema,
} from "../../validators/user.validator.js";

const router = Router();
const authLimiter = rateLimit(rateLimitConfig.auth);
const passwordLimiter = rateLimit(rateLimitConfig.password);

router.post("/register", authLimiter, validate(registerSchema), user.registerUser);
router.post("/login", authLimiter, validate(loginSchema), user.login);
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
  authLimiter,
  validate(forgotPasswordSchema),
  user.resendEmailVerificationLink
);
router.post(
  "/forgot-password",
  passwordLimiter,
  validate(forgotPasswordSchema),
  user.forgotPassword
);
router.post(
  "/reset-password/:passwordToken",
  passwordLimiter,
  validate(resetPasswordSchema),
  user.resetPassword
);
router.get("/current", authenticate, user.currentUser);

export default router;
