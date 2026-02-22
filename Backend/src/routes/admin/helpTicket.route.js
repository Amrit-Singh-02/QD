import { Router } from "express";
import {
  getAllTickets,
  updateTicket,
} from "../../controllers/admin/helpTicket.controller.js";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/", authenticate, authorize, getAllTickets);
router.patch("/:id", authenticate, authorize, updateTicket);

export default router;
