const GEOAPIFY_BASE_URL = "https://api.geoapify.com/v1";

const pickFirstResult = (data) => {
  if (!data) return null;
  if (Array.isArray(data.results) && data.results.length > 0) {
    return data.results[0];
  }
  if (Array.isArray(data.features) && data.features.length > 0) {
    return data.features[0]?.properties || null;
  }
  return null;
};

const buildFormattedAddress = (result) => {
  if (!result || typeof result !== "object") return "";
  if (result.formatted) return result.formatted;
  if (result.formatted_address) return result.formatted_address;

  const parts = [
    result.address_line1,
    result.address_line2,
    result.city,
    result.state,
    result.postcode,
    result.country,
  ].filter(Boolean);

  return parts.join(", ");
};

const extractReverseData = (result) => {
  if (!result || typeof result !== "object") {
    return { fullAddress: "", city: "", state: "", pincode: "" };
  }

  const city =
    result.city ||
    result.town ||
    result.village ||
    result.suburb ||
    result.county ||
    "";
  const state = result.state || result.region || result.state_district || "";
  const pincode = result.postcode || result.postal_code || result.zipcode || "";
  const fullAddress = buildFormattedAddress(result);

  return { fullAddress, city, state, pincode };
};

const buildAutocompleteItem = (result, index) => {
  if (!result || typeof result !== "object") return null;

  const fullAddress = buildFormattedAddress(result);
  const city =
    result.city ||
    result.town ||
    result.village ||
    result.suburb ||
    result.county ||
    "";
  const state = result.state || result.region || result.state_district || "";
  const pincode = result.postcode || result.postal_code || result.zipcode || "";
  const country = result.country || "";
  const addressLine1 = result.address_line1 || fullAddress || "";
  const addressLine2 = result.address_line2 || "";

  const latitude = Number(result.lat);
  const longitude = Number(result.lon);

  const id =
    result.place_id ||
    result.rank?.importance ||
    result.datasource?.raw?.place_id ||
    `${fullAddress}-${index}`;

  return {
    id,
    fullAddress,
    latitude,
    longitude,
    city,
    state,
    pincode,
    country,
    addressLine1,
    addressLine2,
  };
};

const normalizeAutocompleteResults = (data) => {
  const results = Array.isArray(data?.results) ? data.results : [];
  return results
    .map((item, index) => buildAutocompleteItem(item, index))
    .filter(
      (item) =>
        item &&
        item.fullAddress &&
        Number.isFinite(item.latitude) &&
        Number.isFinite(item.longitude),
    );
};

const requireApiKey = () => {
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) {
    throw new Error("GEOAPIFY_API_KEY is not set");
  }
  return apiKey;
};

const requireFetch = () => {
  if (typeof fetch !== "function") {
    throw new Error(
      "Global fetch is not available. Use Node 18+ or add a fetch polyfill.",
    );
  }
  return fetch;
};

export const reverseGeocode = async ({ lat, lon }) => {
  if (lat === undefined || lon === undefined) {
    throw new Error("lat and lon are required");
  }

  const apiKey = requireApiKey();
  const doFetch = requireFetch();

  const url = `${GEOAPIFY_BASE_URL}/geocode/reverse?lat=${encodeURIComponent(
    lat,
  )}&lon=${encodeURIComponent(lon)}&format=json&apiKey=${encodeURIComponent(
    apiKey,
  )}`;

  const response = await doFetch(url);
  if (!response.ok) {
    throw new Error(`Geoapify reverse geocoding failed: ${response.status}`);
  }

  const data = await response.json();
  const result = pickFirstResult(data);
  return extractReverseData(result);
};

export const autocompleteAddress = async ({ text, limit = 10 }) => {
  if (!text) {
    throw new Error("text is required");
  }

  const apiKey = requireApiKey();
  const doFetch = requireFetch();

  const url = `${GEOAPIFY_BASE_URL}/geocode/autocomplete?text=${encodeURIComponent(
    text,
  )}&limit=${encodeURIComponent(limit)}&format=json&apiKey=${encodeURIComponent(
    apiKey,
  )}`;

  const response = await doFetch(url);
  if (!response.ok) {
    throw new Error(`Geoapify autocomplete failed: ${response.status}`);
  }

  const data = await response.json();
  return normalizeAutocompleteResults(data);
};
