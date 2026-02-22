import { Router } from "express";
import {
  reverseGeocodeLocation,
  autocompleteLocation,
} from "../controllers/location.controller.js";

const router = Router();

router.post("/reverse", reverseGeocodeLocation);
router.get("/autocomplete", autocompleteLocation);

export default router;
