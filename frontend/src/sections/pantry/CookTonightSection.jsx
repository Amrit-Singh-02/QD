import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { pantryOSService } from "../../services/pantryOSService";
import { usePantry } from "../../context/PantryContext";

const quickTags = ["Comfort", "Light", "Protein", "Spicy", "Budget", "Kids-friendly"];

const CookTonightSection = () => {
  const { pantryItems, expiringItems, refreshPantry } = usePantry();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [lastError, setLastError] = useState("");
  const [prefs, setPrefs] = useState({
    mealType: "any",
    diet: "any",
    maxTimeMinutes: "",
    servings: 2,
    spiceLevel: "medium",
    avoidIngredients: "",
    notes: "",
    tags: [],
    useExpiringFirst: true,
  });

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

  useEffect(() => {
    refreshPantry();
  }, [refreshPantry]);

  const lastGeneratedAt = useMemo(() => {
    const stamp = recipes
      .map((r) => r?.createdAt || r?.updatedAt)
      .filter(Boolean)
      .map((d) => new Date(d).getTime())
      .sort((a, b) => b - a)[0];
    return stamp ? new Date(stamp).toLocaleString() : "";
  }, [recipes]);

  const buildPreferencesPayload = () => {
    const payload = {
      mealType: prefs.mealType !== "any" ? prefs.mealType : undefined,
      diet: prefs.diet !== "any" ? prefs.diet : undefined,
      maxTimeMinutes: prefs.maxTimeMinutes ? Number(prefs.maxTimeMinutes) : undefined,
      servings: prefs.servings ? Number(prefs.servings) : undefined,
      spiceLevel: prefs.spiceLevel !== "any" ? prefs.spiceLevel : undefined,
      avoidIngredients: prefs.avoidIngredients.trim() || undefined,
      notes: prefs.notes.trim() || undefined,
      tags: prefs.tags.length ? prefs.tags : undefined,
      useExpiringFirst: prefs.useExpiringFirst,
    };
    return payload;
  };

  const handleRegenerate = async () => {
    try {
      setRegenerating(true);
      setLastError("");
      const preferences = buildPreferencesPayload();
      const res = await pantryOSService.regenerateRecipes({ preferences });
      setRecipes(res?.payload || []);
      toast.success(res?.message || "Recipes regenerated");
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to regenerate recipes";
      setLastError(msg);
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

  const toggleTag = (tag) => {
    setPrefs((prev) => {
      const exists = prev.tags.includes(tag);
      return { ...prev, tags: exists ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag] };
    });
  };

  const getMissingIngredients = (recipe) => {
    if (Array.isArray(recipe?.missingIngredients) && recipe.missingIngredients.length) {
      return recipe.missingIngredients;
    }
    if (Array.isArray(recipe?.ingredients)) {
      return recipe.ingredients.filter((i) => i?.inPantry === false);
    }
    return [];
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-blinkit-dark">Cook Tonight AI</h1>
          <p className="text-sm text-blinkit-gray mt-1">Personalized recipes from your pantry, right now.</p>
          {lastGeneratedAt && (
            <p className="text-xs text-blinkit-gray mt-1">Last generated: {lastGeneratedAt}</p>
          )}
        </div>
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="rounded-xl bg-blinkit-green text-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {regenerating ? "Regenerating..." : "Regenerate"}
        </button>
      </div>

      {lastError && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {lastError}
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4">
        <section className="rounded-2xl border border-blinkit-border bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-blinkit-dark uppercase tracking-wider">Personalize</h2>
              <p className="text-xs text-blinkit-gray mt-1">Tell us what you feel like eating tonight.</p>
            </div>
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="text-xs px-3 py-1.5 rounded-lg border border-blinkit-border"
            >
              Use these prefs
            </button>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-xs text-blinkit-gray">
              Meal type
              <select
                value={prefs.mealType}
                onChange={(e) => setPrefs((p) => ({ ...p, mealType: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-blinkit-border px-3 py-2 text-sm"
              >
                <option value="any">Any</option>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </label>

            <label className="text-xs text-blinkit-gray">
              Diet
              <select
                value={prefs.diet}
                onChange={(e) => setPrefs((p) => ({ ...p, diet: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-blinkit-border px-3 py-2 text-sm"
              >
                <option value="any">Any</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="non-veg">Non-veg</option>
              </select>
            </label>

            <label className="text-xs text-blinkit-gray">
              Max time (minutes)
              <select
                value={prefs.maxTimeMinutes}
                onChange={(e) => setPrefs((p) => ({ ...p, maxTimeMinutes: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-blinkit-border px-3 py-2 text-sm"
              >
                <option value="">Any</option>
                <option value="15">15</option>
                <option value="30">30</option>
                <option value="45">45</option>
                <option value="60">60</option>
              </select>
            </label>

            <label className="text-xs text-blinkit-gray">
              Servings
              <input
                type="number"
                min="1"
                max="10"
                value={prefs.servings}
                onChange={(e) => setPrefs((p) => ({ ...p, servings: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-blinkit-border px-3 py-2 text-sm"
              />
            </label>

            <label className="text-xs text-blinkit-gray">
              Spice level
              <select
                value={prefs.spiceLevel}
                onChange={(e) => setPrefs((p) => ({ ...p, spiceLevel: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-blinkit-border px-3 py-2 text-sm"
              >
                <option value="any">Any</option>
                <option value="mild">Mild</option>
                <option value="medium">Medium</option>
                <option value="hot">Hot</option>
              </select>
            </label>

            <label className="text-xs text-blinkit-gray">
              Avoid ingredients
              <input
                value={prefs.avoidIngredients}
                onChange={(e) => setPrefs((p) => ({ ...p, avoidIngredients: e.target.value }))}
                placeholder="e.g. onion, garlic"
                className="mt-1 w-full rounded-xl border border-blinkit-border px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-blinkit-gray">Quick mood</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {quickTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                    prefs.tags.includes(tag)
                      ? "bg-blinkit-green text-white border-blinkit-green"
                      : "bg-white border-blinkit-border text-blinkit-dark"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
            <label className="text-xs text-blinkit-gray">
              Notes for the cook
              <input
                value={prefs.notes}
                onChange={(e) => setPrefs((p) => ({ ...p, notes: e.target.value }))}
                placeholder="e.g. kid friendly, no deep fry"
                className="mt-1 w-full rounded-xl border border-blinkit-border px-3 py-2 text-sm"
              />
            </label>

            <label className="flex items-center gap-2 text-xs text-blinkit-gray">
              <input
                type="checkbox"
                checked={prefs.useExpiringFirst}
                onChange={(e) => setPrefs((p) => ({ ...p, useExpiringFirst: e.target.checked }))}
              />
              Use expiring items first
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-blinkit-border bg-white p-4">
          <h2 className="text-sm font-bold text-blinkit-dark uppercase tracking-wider">Pantry snapshot</h2>
          <p className="text-xs text-blinkit-gray mt-1">
            {pantryItems.length} items in pantry | {expiringItems.length} expiring soon
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(expiringItems || []).slice(0, 6).map((item) => (
              <span
                key={item._id || item.id}
                className="px-2 py-1 rounded-full text-[11px] bg-amber-50 border border-amber-200 text-amber-700"
              >
                {item.name}
              </span>
            ))}
            {expiringItems.length === 0 && (
              <span className="text-xs text-blinkit-gray">No items expiring soon.</span>
            )}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Link
              to="/pantry-os/pantry"
              className="text-xs px-3 py-1.5 rounded-lg border border-blinkit-border"
            >
              View pantry
            </Link>
            <button
              onClick={handleRegenerate}
              className="text-xs px-3 py-1.5 rounded-lg bg-blinkit-green text-white"
            >
              Generate now
            </button>
          </div>
        </section>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-3">
        {(recipes || []).map((recipe) => {
          const missing = getMissingIngredients(recipe);
          const isExpanded = expandedId === (recipe._id || recipe.id);
          const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
          const hasMissing = missing.length > 0;

          return (
            <div key={recipe._id || recipe.id} className="rounded-2xl border border-blinkit-border bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-blinkit-dark">{recipe.title}</h3>
                  <p className="text-sm text-blinkit-gray mt-1">{recipe.description}</p>
                  <p className="text-xs text-blinkit-gray mt-2">{recipe.cookTimeMinutes || 20} mins</p>
                </div>
                {recipe.wasCooked && (
                  <span className="text-[11px] px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                    Cooked
                  </span>
                )}
              </div>

              {Array.isArray(recipe.expiringItemsUsed) && recipe.expiringItemsUsed.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {recipe.expiringItemsUsed.map((item) => (
                    <span
                      key={item}
                      className="px-2 py-1 rounded-full text-[11px] bg-red-50 border border-red-200 text-red-700"
                    >
                      Uses: {item}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-blinkit-gray">Ingredients</p>
                  <ul className="mt-2 space-y-1 text-sm text-blinkit-dark">
                    {ingredients.map((ing, idx) => (
                      <li key={`${ing.name}-${idx}`} className="flex items-center justify-between">
                        <span>{ing.name}</span>
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full ${
                            ing.inPantry
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {ing.inPantry ? "In pantry" : "Missing"}
                        </span>
                      </li>
                    ))}
                    {ingredients.length === 0 && (
                      <li className="text-xs text-blinkit-gray">No ingredient list provided.</li>
                    )}
                  </ul>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-blinkit-gray">Steps</p>
                    <button
                      onClick={() =>
                        setExpandedId(isExpanded ? null : recipe._id || recipe.id)
                      }
                      className="text-xs text-blinkit-green"
                    >
                      {isExpanded ? "Hide" : "Show"}
                    </button>
                  </div>
                  {isExpanded && Array.isArray(recipe.instructions) && recipe.instructions.length > 0 ? (
                    <ol className="mt-2 list-decimal list-inside text-sm text-blinkit-dark space-y-1">
                      {recipe.instructions.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  ) : (
                    <p className="mt-2 text-xs text-blinkit-gray">
                      {Array.isArray(recipe.instructions) && recipe.instructions.length > 0
                        ? "Expand to see steps."
                        : "No instructions provided."}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-blinkit-gray">
                  Missing ingredients
                </p>
                <p className="text-sm mt-1 text-blinkit-dark">
                  {missing.map((m) => m.name).join(", ") || "None"}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleAddMissing(recipe._id || recipe.id)}
                  disabled={!hasMissing}
                  className="text-xs px-3 py-1.5 rounded-lg bg-blinkit-green text-white disabled:opacity-50"
                >
                  Add missing to cart
                </button>
                <button
                  onClick={() => handleMarkCooked(recipe._id || recipe.id)}
                  disabled={recipe.wasCooked}
                  className="text-xs px-3 py-1.5 rounded-lg border border-blinkit-border disabled:opacity-50"
                >
                  Mark cooked
                </button>
                {[1, 2, 3, 4, 5].map((v) => (
                  <button
                    key={v}
                    onClick={() => handleRate(recipe._id || recipe.id, v)}
                    className={`w-7 h-7 rounded-full text-xs border ${
                      recipe.rating === v
                        ? "bg-amber-400 text-white border-amber-400"
                        : "border-blinkit-border"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {!loading && recipes.length === 0 && (
        <div className="mt-6 rounded-2xl border border-blinkit-border bg-white p-8 text-center text-sm text-blinkit-gray">
          Add pantry items first to generate recipes.
        </div>
      )}
    </>
  );
};

export default CookTonightSection;
