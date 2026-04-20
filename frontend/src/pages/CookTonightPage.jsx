import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Navbar from "../component/Layout/Navbar";
import Footer from "../component/Layout/Footer";
import { pantryOSService } from "../services/pantryOSService";

const CookTonightPage = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await pantryOSService.getRecipeSuggestions();
      setRecipes(res?.payload || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRegenerate = async () => {
    try {
      setRegenerating(true);
      const res = await pantryOSService.regenerateRecipes();
      setRecipes(res?.payload || []);
      toast.success(res?.message || "Recipes regenerated");
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to regenerate recipes";
      toast.error(msg);
    } finally {
      setRegenerating(false);
    }
  };

  const handleAddMissing = async (recipeId) => {
    try {
      const res = await pantryOSService.addMissingToCart(recipeId);
      const added = Number(res?.payload?.addedCount || 0);
      if (added > 0) {
        toast.success(`Added ${added} missing item${added > 1 ? "s" : ""} to cart`);
      } else {
        toast("No matching catalog items found for missing ingredients");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Could not add missing items";
      toast.error(msg);
    }
  };

  const handleMarkCooked = async (recipeId) => {
    try {
      const res = await pantryOSService.markRecipeCooked(recipeId);
      toast.success(res?.message || "Recipe marked cooked");
      load();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Could not mark cooked";
      toast.error(msg);
    }
  };

  const handleRate = async (recipeId, rating) => {
    try {
      await pantryOSService.rateRecipe(recipeId, rating);
      toast.success(`Rated ${rating} star${rating > 1 ? "s" : ""}`);
      load();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Could not rate recipe";
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-blinkit-bg">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-blinkit-dark">Cook Tonight AI</h1>
            <p className="text-sm text-blinkit-gray mt-1">Recipes generated from your pantry</p>
          </div>
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="rounded-xl bg-blinkit-green text-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {regenerating ? "Regenerating..." : "Regenerate"}
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
          {(recipes || []).map((recipe) => (
            <div key={recipe._id || recipe.id} className="rounded-2xl border border-blinkit-border bg-white p-4">
              <h3 className="text-lg font-bold text-blinkit-dark">{recipe.title}</h3>
              <p className="text-sm text-blinkit-gray mt-1">{recipe.description}</p>
              <p className="text-xs text-blinkit-gray mt-2">{recipe.cookTimeMinutes || 20} mins</p>

              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-blinkit-gray">Missing ingredients</p>
                <p className="text-sm mt-1 text-blinkit-dark">
                  {(recipe.missingIngredients || []).map((m) => m.name).join(", ") || "None"}
                </p>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={() => handleAddMissing(recipe._id || recipe.id)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-blinkit-green text-white"
                >
                  Add missing to cart
                </button>
                <button
                  onClick={() => handleMarkCooked(recipe._id || recipe.id)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-blinkit-border"
                >
                  Mark cooked
                </button>
                {[1, 2, 3, 4, 5].map((v) => (
                  <button
                    key={v}
                    onClick={() => handleRate(recipe._id || recipe.id, v)}
                    className={`w-7 h-7 rounded-full text-xs border ${recipe.rating === v ? "bg-amber-400 text-white border-amber-400" : "border-blinkit-border"}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        {!loading && recipes.length === 0 && (
          <div className="mt-6 rounded-2xl border border-blinkit-border bg-white p-8 text-center text-sm text-blinkit-gray">
            Add pantry items first to generate recipes.
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CookTonightPage;
