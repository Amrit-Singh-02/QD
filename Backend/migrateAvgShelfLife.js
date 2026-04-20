/**
 * One-time migration: set avgShelfLifeDays (and optional pantry hints) for products missing shelf life.
 * Run: node migrateAvgShelfLife.js
 * Requires MONGODB_URL in Backend/.env
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import ProductModel from "./src/models/product.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const CATEGORY_SHELF_DAYS = {
  dairy: 7,
  produce: 5,
  grains: 120,
  snacks: 90,
  beverages: 180,
  condiments: 365,
  personal_care: 730,
  cleaning: 730,
  frozen: 180,
  other: 30,
};

const inferFromName = (name = "") => {
  const n = name.toLowerCase();
  if (/milk|curd|yogurt|paneer|cheese|butter|cream/.test(n)) return { days: 7, pantryCategory: "dairy", isPerishable: true };
  if (/bread|bun|pav/.test(n)) return { days: 5, pantryCategory: "grains", isPerishable: true };
  if (/tomato|potato|onion|vegetable|fruit|fresh|spinach|coriander/.test(n))
    return { days: 5, pantryCategory: "produce", isPerishable: true };
  if (/rice|atta|flour|dal|pulse|oil|ghee|masala|spice/.test(n))
    return { days: 120, pantryCategory: "grains", isPerishable: false };
  if (/chips|biscuit|cookie|namkeen|chocolate/.test(n))
    return { days: 90, pantryCategory: "snacks", isPerishable: false };
  if (/juice|water|cola|drink|soda/.test(n))
    return { days: 180, pantryCategory: "beverages", isPerishable: false };
  if (/soap|shampoo|toothpaste|cream|lotion/.test(n))
    return { days: 730, pantryCategory: "personal_care", isPerishable: false };
  if (/detergent|cleaner|bleach|surf/.test(n))
    return { days: 730, pantryCategory: "cleaning", isPerishable: false };
  return { days: 30, pantryCategory: null, isPerishable: null };
};

const main = async () => {
  if (!process.env.MONGODB_URL) {
    console.error("Missing MONGODB_URL in .env");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URL);

  const cursor = ProductModel.find({
    $or: [{ avgShelfLifeDays: null }, { avgShelfLifeDays: { $exists: false } }],
  })
    .limit(Number(process.env.MIGRATE_SHELF_LIMIT || 500))
    .cursor();

  let updated = 0;
  for await (const doc of cursor) {
    const cat = doc.pantryCategory && doc.pantryCategory !== "other"
      ? doc.pantryCategory
      : null;
    let days = cat ? CATEGORY_SHELF_DAYS[cat] ?? 30 : null;
    let nextCategory = cat;
    let isPerishable = doc.isPerishable;

    if (!days || !nextCategory || nextCategory === "other") {
      const inferred = inferFromName(doc.name);
      days = inferred.days;
      if (!nextCategory || nextCategory === "other") {
        nextCategory = inferred.pantryCategory || "other";
      }
      if (typeof inferred.isPerishable === "boolean") {
        isPerishable = inferred.isPerishable;
      }
    }

    await ProductModel.updateOne(
      { _id: doc._id },
      {
        $set: {
          avgShelfLifeDays: days,
          pantryCategory: nextCategory,
          ...(typeof isPerishable === "boolean" ? { isPerishable } : {}),
        },
      },
    );
    updated += 1;
  }

  console.log(`migrateAvgShelfLife: updated ${updated} products`);
  await mongoose.disconnect();
  process.exit(0);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
