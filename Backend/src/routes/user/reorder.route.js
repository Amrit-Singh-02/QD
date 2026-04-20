import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import {
  confirmReorder,
  getPatterns,
  getPendingReorders,
  getUpcomingReorders,
  skipReorder,
  toggleAutoReorder,
} from "../../controllers/user/reorder.controller.js";

const reorderRouter = Router();

reorderRouter.get("/patterns", authenticate, getPatterns);
reorderRouter.get("/pending", authenticate, getPendingReorders);
reorderRouter.get("/upcoming", authenticate, getUpcomingReorders);
reorderRouter.post("/toggle/:patternId", authenticate, toggleAutoReorder);
reorderRouter.post("/confirm/:patternId", authenticate, confirmReorder);
reorderRouter.post("/skip/:patternId", authenticate, skipReorder);

export default reorderRouter;
