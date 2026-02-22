import { Router } from "express";
import {
  createReview,
  getOrderReview,
} from "../../controllers/user/review.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

router.post("/create", authenticate, createReview);
router.get("/order/:orderId", authenticate, getOrderReview);

export default router;
