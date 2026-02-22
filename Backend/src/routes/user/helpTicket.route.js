import { Router } from "express";
import {
  createTicket,
  getMyTickets,
} from "../../controllers/user/helpTicket.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

router.post("/create", authenticate, createTicket);
router.get("/my-tickets", authenticate, getMyTickets);

export default router;
