import mongoose from "mongoose";

const ingredientSchema = new mongoose.Schema(
  {
    name: String,
    quantity: String,
    inPantry: Boolean,
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    price: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
);

const recipeSuggestionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    cookTimeMinutes: {
      type: Number,
      default: 20,
    },
    ingredients: {
      type: [ingredientSchema],
      default: [],
    },
    missingIngredients: {
      type: [ingredientSchema],
      default: [],
    },
    instructions: {
      type: [String],
      default: [],
    },
    expiringItemsUsed: {
      type: [String],
      default: [],
    },
    pantryHashAtGen: {
      type: String,
      default: "",
      index: true,
    },
    wasCooked: {
      type: Boolean,
      default: false,
    },
    cookedAt: {
      type: Date,
      default: null,
    },
    rating: {
      type: Number,
      default: null,
      min: 1,
      max: 5,
    },
  },
  { timestamps: true },
);

recipeSuggestionSchema.index({ userId: 1, createdAt: -1 });

const RecipeSuggestionModel = mongoose.model("RecipeSuggestion", recipeSuggestionSchema);
export default RecipeSuggestionModel;
