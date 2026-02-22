const parseNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getServiceablePincodes = () => {
  const raw = process.env.SERVICEABLE_PINCODES || "";
  const list = raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return list;
};

const haversineKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const checkServiceability = ({ pincode, latitude, longitude }) => {
  const serviceablePincodes = getServiceablePincodes();
  if (serviceablePincodes.length > 0) {
    const matched = serviceablePincodes.includes(String(pincode || "").trim());
    return {
      serviceable: matched,
      reason: matched ? "" : "Pincode is not serviceable.",
    };
  }

  const centerLat = parseNumber(process.env.DELIVERY_CENTER_LAT);
  const centerLon = parseNumber(process.env.DELIVERY_CENTER_LON);
  const radiusKm = parseNumber(process.env.DELIVERY_RADIUS_KM);
  if (centerLat !== null && centerLon !== null && radiusKm !== null) {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return {
        serviceable: false,
        reason: "Location coordinates are required for delivery radius check.",
      };
    }
    const distance = haversineKm(centerLat, centerLon, latitude, longitude);
    const matched = distance <= radiusKm;
    return {
      serviceable: matched,
      reason: matched ? "" : "Address is outside the delivery radius.",
    };
  }

  return { serviceable: true, reason: "" };
};
