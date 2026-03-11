import { Router } from "express";
import { fetchCategories } from "../../controllers/shop/category.controller.js";

const router = Router();

router.get("/all", fetchCategories);

export default router;
