import expressAsyncHandler from "express-async-handler";
import ApiResponse from "../utils/ApiResponse.util.js";
import CustomError from "../utils/customError.util.js";
import {
  reverseGeocode,
  autocompleteAddress,
} from "../services/location.service.js";
import { checkServiceability } from "../utils/delivery.util.js";

const parseCoordinate = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed;
};

export const reverseGeocodeLocation = expressAsyncHandler(
  async (req, res, next) => {
    const { lat, lon, lng } = req.body || {};
    const longitude = lon ?? lng;

    if (lat === undefined || longitude === undefined) {
      return next(new CustomError(400, "lat and lon are required"));
    }

    const parsedLat = parseCoordinate(lat);
    const parsedLon = parseCoordinate(longitude);

    if (parsedLat === null || parsedLon === null) {
      return next(new CustomError(400, "lat and lon must be valid numbers"));
    }

    if (parsedLat < -90 || parsedLat > 90 || parsedLon < -180 || parsedLon > 180) {
      return next(new CustomError(400, "lat or lon is out of range"));
    }

    const data = await reverseGeocode({ lat: parsedLat, lon: parsedLon });
    const serviceability = checkServiceability({
      pincode: data?.pincode,
      latitude: parsedLat,
      longitude: parsedLon,
    });

    const payload = {
      ...data,
      serviceable: serviceability.serviceable,
      serviceabilityReason: serviceability.reason || "",
    };

    new ApiResponse(200, "Location resolved", payload).send(res);
  },
);

export const autocompleteLocation = expressAsyncHandler(
  async (req, res, next) => {
    const text = `${req.query?.text || ""}`.trim();
    if (!text) {
      return next(new CustomError(400, "text query is required"));
    }
    if (text.length < 3) {
      return next(new CustomError(400, "text must be at least 3 characters"));
    }

    const limitRaw = req.query?.limit;
    const limitParsed = Number(limitRaw);
    const limit =
      Number.isFinite(limitParsed) && limitParsed > 0 ? limitParsed : 10;

    const results = await autocompleteAddress({ text, limit });
    const enriched = results.map((item) => {
      const serviceability = checkServiceability({
        pincode: item.pincode,
        latitude: item.latitude,
        longitude: item.longitude,
      });
      return {
        ...item,
        serviceable: serviceability.serviceable,
        serviceabilityReason: serviceability.reason || "",
      };
    });

    new ApiResponse(200, "Locations fetched", enriched).send(res);
  },
);
