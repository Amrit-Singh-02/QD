import api from "./api";

export const pantryOSService = {
  getPantryItems: async () => {
    const res = await api.get("/pantry");
    return res.data;
  },
  getExpiringItems: async () => {
    const res = await api.get("/pantry/expiring");
    return res.data;
  },
  getWasteReport: async () => {
    const res = await api.get("/pantry/waste-report");
    return res.data;
  },
  addPantryItem: async (payload) => {
    const res = await api.post("/pantry/item", payload);
    return res.data;
  },
  scanBarcode: async (barcode, quantity = 1) => {
    const res = await api.post("/pantry/scan", { barcode, quantity });
    return res.data;
  },
  usePantryItem: async (id, quantity = 1) => {
    const res = await api.put(`/pantry/item/${id}/use`, { quantity });
    return res.data;
  },
  deletePantryItem: async (id) => {
    const res = await api.delete(`/pantry/item/${id}`);
    return res.data;
  },
  getRecipeSuggestions: async () => {
    const res = await api.get("/recipes/suggestions");
    return res.data;
  },
  regenerateRecipes: async () => {
    const res = await api.post("/recipes/generate", { force: true });
    return res.data;
  },
  markRecipeCooked: async (id) => {
    const res = await api.post(`/recipes/${id}/cook`);
    return res.data;
  },
  addMissingToCart: async (id) => {
    const res = await api.post(`/recipes/${id}/add-missing`);
    return res.data;
  },
  rateRecipe: async (id, rating) => {
    const res = await api.post(`/recipes/${id}/rate`, { rating });
    return res.data;
  },
  getPatterns: async () => {
    const res = await api.get("/reorder/patterns");
    return res.data;
  },
  getPendingReorders: async () => {
    const res = await api.get("/reorder/pending");
    return res.data;
  },
  getUpcomingReorders: async () => {
    const res = await api.get("/reorder/upcoming");
    return res.data;
  },
  togglePattern: async (patternId) => {
    const res = await api.post(`/reorder/toggle/${patternId}`);
    return res.data;
  },
  confirmReorder: async (patternId) => {
    const res = await api.post(`/reorder/confirm/${patternId}`);
    return res.data;
  },
  skipReorder: async (patternId) => {
    const res = await api.post(`/reorder/skip/${patternId}`);
    return res.data;
  },
};
