import api from "./api";

const normalizeReversePayload = (payload) => {
  if (!payload || typeof payload !== "object") {
    return { fullAddress: "", city: "", state: "", pincode: "" };
  }
  return {
    fullAddress:
      payload.fullAddress ||
      payload.formattedAddress ||
      payload.formatted ||
      payload.address ||
      payload.label ||
      "",
    city: payload.city || "",
    state: payload.state || "",
    pincode: payload.pincode || payload.postalCode || "",
    serviceable:
      typeof payload.serviceable === "boolean" ? payload.serviceable : true,
    serviceabilityReason: payload.serviceabilityReason || "",
  };
};

export const locationService = {
  async autoSuggest(query) {
    const response = await api.get("/location/autocomplete", {
      params: { text: query },
    });
    return response?.data?.payload || [];
  },

  async reverseGeocode(lat, lng) {
    const response = await api.post("/location/reverse", {
      lat,
      lon: lng,
    });
    const payload = response?.data?.payload || {};
    return normalizeReversePayload(payload);
  },
};
