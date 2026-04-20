import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import {
  addPantryItem,
  addByBarcode,
  deletePantryItem,
  getPantryByCategory,
  getExpiringItems,
  getPantryItems,
  getWasteReport,
  importFromOrder,
  markItemUsed,
  updatePantryItem,
} from "../../controllers/user/pantry.controller.js";

const pantryRouter = Router();

pantryRouter.get("/", authenticate, getPantryItems);
pantryRouter.get("/categories", authenticate, getPantryByCategory);
pantryRouter.get("/expiring", authenticate, getExpiringItems);
pantryRouter.get("/waste-report", authenticate, getWasteReport);
pantryRouter.post("/item", authenticate, addPantryItem);
pantryRouter.post("/scan", authenticate, addByBarcode);
pantryRouter.post("/import-order/:orderId", authenticate, importFromOrder);
pantryRouter.put("/item/:id", authenticate, updatePantryItem);
pantryRouter.put("/item/:id/use", authenticate, markItemUsed);
pantryRouter.delete("/item/:id", authenticate, deletePantryItem);

export default pantryRouter;
