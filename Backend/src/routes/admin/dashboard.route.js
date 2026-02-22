import { Router } from "express";
import { getDashboard } from "../../controllers/admin/dashboard.controller.js";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/", authenticate, authorize, getDashboard);

export default router;
