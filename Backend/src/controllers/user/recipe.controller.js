import crypto from "crypto";
import expressAsyncHandler from "express-async-handler";
import ApiResponse from "../../utils/ApiResponse.util.js";
import CustomError from "../../utils/customError.util.js";
import PantryItemModel from "../../models/pantryItem.model.js";
import RecipeSuggestionModel from "../../models/recipeSuggestion.model.js";
import CartModel from "../../models/cart.model.js";
import ProductModel from "../../models/product.model.js";
import { generateRecipesWithOpenAI } from "../../services/openai.service.js";

const quickRecipeTemplates = [
  {
    title: "Stir Fry Bowl",
    description: "Quick mixed veggie bowl from pantry staples.",
    keywords: ["rice", "carrot", "beans", "onion", "capsicum", "oil"],
  },
  {
    title: "Masala Toast",
    description: "Toasted bread with pantry masala spread.",
    keywords: ["bread", "butter", "tomato", "onion", "chilli"],
  },
  {
    title: "Simple Khichdi",
    description: "Comfort meal with grains and lentils.",
    keywords: ["rice", "dal", "salt", "turmeric", "ghee"],
  },
];

const buildPantryHash = (items = []) => {
  const signature = items
    .map((i) => `${i.productId || i.name}:${i.quantity}`)
    .sort()
    .join("|");
  return crypto.createHash("md5").update(signature).digest("hex");
};

const buildExpiringItems = (pantryItems) => {
  const in3Days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  return pantryItems.filter(
    (i) => i.expiryDate && new Date(i.expiryDate) <= in3Days,
  );
};

const buildRecipeSuggestions = (pantryItems = []) => {
  const names = pantryItems.map((p) => String(p.name || "").toLowerCase());
  return quickRecipeTemplates.map((tpl) => {
    const present = tpl.keywords.filter((k) =>
      names.some((n) => n.includes(k.toLowerCase())),
    );
    const missing = tpl.keywords.filter((k) => !present.includes(k));
    return {
      title: tpl.title,
      description: tpl.description,
      cookTimeMinutes: 20,
      ingredients: present.map((name) => ({ name, quantity: "as needed", inPantry: true })),
      missingIngredients: missing.map((name) => ({ name, quantity: "as needed", inPantry: false })),
      instructions: [
        "Prep ingredients and keep them ready.",
        "Saute aromatics, then add main ingredients.",
        "Cook for 10-15 minutes and serve hot.",
      ],
      expiringItemsUsed: present.slice(0, 2),
    };
  });
};

export const getRecipeSuggestions = expressAsyncHandler(async (req, res, next) => {
  const userId = req.myUser?.id;
  if (!userId) return next(new CustomError(401, "Unauthorized"));

  const pantryItems = await PantryItemModel.find({
    userId,
    isActive: true,
    quantity: { $gt: 0 },
  }).lean();

  if (pantryItems.length < 1) {
    return new ApiResponse(200, "No pantry items available", []).send(res);
  }

  const redis = req.app.get("redis");
  const force = req.query.force === "1" || req.body?.force === true;
  const pantryHash = buildPantryHash(pantryItems);
  const redisKey = `recipes:${userId}:${pantryHash}`;
  const rateLimitKey = `ratelimit:recipes:${userId}`;
  const recipeAiEnabled = process.env.RECIPE_AI_ENABLED !== "false";

  if (!force && redis) {
    const cachedRedis = await redis.get(redisKey);
    if (cachedRedis) {
      return new ApiResponse(200, "Fetched recipe suggestions", JSON.parse(cachedRedis)).send(
        res,
      );
    }
  }
  const cached = await RecipeSuggestionModel.find({
    userId,
    pantryHashAtGen: pantryHash,
    createdAt: { $gte: new Date(Date.now() - 6 * 60 * 60 * 1000) },
  })
    .sort({ createdAt: -1 })
    .lean();

  if (!force && cached.length > 0) {
    if (redis) await redis.setEx(redisKey, 6 * 3600, JSON.stringify(cached));
    return new ApiResponse(200, "Fetched recipe suggestions", cached).send(res);
  }

  const expiringItems = buildExpiringItems(pantryItems);
  let generated = null;

  let aiFailed = false;
  if (recipeAiEnabled) {
    if (redis) {
      const currentHits = Number((await redis.get(rateLimitKey)) || 0);
      if (currentHits >= 10) {
        return next(new CustomError(429, "Daily recipe limit reached. Try tomorrow."));
      }
      await redis.multi().incr(rateLimitKey).expire(rateLimitKey, 86400).exec();
    }
    try {
      generated = await generateRecipesWithOpenAI({ pantryItems, expiringItems });
    } catch (err) {
      aiFailed = true;
      generated = null;
    }
  }

  if (!generated || generated.length === 0) {
    if (force && recipeAiEnabled && aiFailed) {
      return next(
        new CustomError(
          502,
          "AI recipe generation failed. Check OPENAI_API_KEY/quota/model access.",
        ),
      );
    }
    generated = buildRecipeSuggestions(pantryItems);
  }

  const docs = await RecipeSuggestionModel.insertMany(
    generated.map((recipe) => ({
      userId,
      ...recipe,
      pantryHashAtGen: pantryHash,
    })),
  );

  if (redis) await redis.setEx(redisKey, 6 * 3600, JSON.stringify(docs));
  new ApiResponse(200, "Generated recipe suggestions", docs).send(res);
});

export const regenerateRecipes = expressAsyncHandler(async (req, res, next) => {
  req.query.force = "1";
  return getRecipeSuggestions(req, res, next);
});

export const markRecipeCooked = expressAsyncHandler(async (req, res, next) => {
  const userId = req.myUser?.id;
  if (!userId) return next(new CustomError(401, "Unauthorized"));
  const { id } = req.params;

  const recipe = await RecipeSuggestionModel.findOne({ _id: id, userId });
  if (!recipe) return next(new CustomError(404, "Recipe not found"));

  recipe.wasCooked = true;
  recipe.cookedAt = new Date();
  await recipe.save();

  new ApiResponse(200, "Recipe marked as cooked", recipe).send(res);
});

export const rateRecipe = expressAsyncHandler(async (req, res, next) => {
  const userId = req.myUser?.id;
  if (!userId) return next(new CustomError(401, "Unauthorized"));
  const { id } = req.params;
  const rating = Math.min(5, Math.max(1, Number(req.body?.rating) || 0));
  if (!rating) return next(new CustomError(400, "Rating is required"));

  const recipe = await RecipeSuggestionModel.findOne({ _id: id, userId });
  if (!recipe) return next(new CustomError(404, "Recipe not found"));
  recipe.rating = rating;
  await recipe.save();

  new ApiResponse(200, "Recipe rated successfully", recipe).send(res);
});

export const addMissingToCartPayload = expressAsyncHandler(async (req, res, next) => {
  const userId = req.myUser?.id;
  if (!userId) return next(new CustomError(401, "Unauthorized"));
  const { id } = req.params;

  const recipe = await RecipeSuggestionModel.findOne({ _id: id, userId }).lean();
  if (!recipe) return next(new CustomError(404, "Recipe not found"));

  const missing = recipe.missingIngredients || [];
  if (missing.length === 0) {
    return new ApiResponse(200, "No missing ingredients", []).send(res);
  }

  const names = missing.map((m) => String(m.name || "").trim()).filter(Boolean);
  const products = await ProductModel.find({
    $or: names.map((name) => ({ name: { $regex: name, $options: "i" } })),
  })
    .select("_id name")
    .lean();

  let addedCount = 0;
  for (const product of products) {
    await CartModel.findOneAndUpdate(
      { userId, productId: product._id },
      { $inc: { quantity: 1 }, $setOnInsert: { userId, productId: product._id } },
      { upsert: true, new: true },
    );
    addedCount += 1;
  }

  new ApiResponse(200, "Missing ingredients added to cart", {
    addedCount,
    missingCount: missing.length,
  }).send(res);
});
