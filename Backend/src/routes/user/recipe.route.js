import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import {
  addMissingToCartPayload,
  getRecipeSuggestions,
  markRecipeCooked,
  rateRecipe,
  regenerateRecipes,
} from "../../controllers/user/recipe.controller.js";

const recipeRouter = Router();

recipeRouter.get("/suggestions", authenticate, getRecipeSuggestions);
recipeRouter.post("/generate", authenticate, regenerateRecipes);
recipeRouter.post("/:id/cook", authenticate, markRecipeCooked);
recipeRouter.post("/:id/rate", authenticate, rateRecipe);
recipeRouter.post("/:id/add-missing", authenticate, addMissingToCartPayload);

export default recipeRouter;
