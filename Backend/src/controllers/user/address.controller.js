import expressAsyncHandler from "express-async-handler";
import ApiResponse from "../../utils/ApiResponse.util.js";
import CustomError from "../../utils/customError.util.js";
import AddressModel from "../../models/address.model.js";
import { checkServiceability } from "../../utils/delivery.util.js";

const buildFullAddress = ({
  addressLine1,
  addressLine2,
  city,
  state,
  postalCode,
  country,
}) => {
  return [
    addressLine1,
    addressLine2,
    city,
    state,
    postalCode,
    country,
  ]
    .filter(Boolean)
    .join(", ");
};

export const addAddress = expressAsyncHandler(async (req, res, next) => {
  const userId = req.myUser?.id;
  if (!userId) return next(new CustomError(401, "Unauthorized"));

  const {
    fullName,
    phone,
    addressLine1,
    addressLine2,
    city,
    state,
    postalCode,
    pincode,
    country,
    landmark,
    type,
    isDefault,
  } = req.body;

  const finalPostalCode = postalCode || pincode || "";
  const finalPincode = pincode || postalCode || "";
  const fullAddress = buildFullAddress({
    addressLine1,
    addressLine2,
    city,
    state,
    postalCode: finalPostalCode,
    country,
  });

  if (isDefault) {
    await AddressModel.updateMany({ user: userId }, { isDefault: false });
  }

  const newAddress = await AddressModel.create({
    user: userId,
    fullName,
    phone,
    addressLine1,
    addressLine2,
    city,
    state,
    postalCode: finalPostalCode,
    pincode: finalPincode,
    country,
    landmark,
    fullAddress,
    formattedAddress: fullAddress,
    type,
    isDefault: Boolean(isDefault),
  });

  if (!newAddress) {
    return next(new CustomError(400, "Cannot add address"));
  }

  new ApiResponse(201, "Address Added Successfully", newAddress).send(res);
});

const parseCoordinate = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed;
};

export const saveLocationAddress = expressAsyncHandler(async (req, res, next) => {
  const userId = req.myUser?.id;
  const user = req.myUser;
  if (!userId || !user) return next(new CustomError(401, "Unauthorized"));

  const {
    fullAddress,
    latitude,
    longitude,
    pincode,
    addressLine1,
    addressLine2,
    city,
    state,
    postalCode,
    country,
    type,
    isDefault,
  } = req.body || {};

  if (!fullAddress || latitude === undefined || longitude === undefined || !pincode) {
    return next(
      new CustomError(
        400,
        "fullAddress, latitude, longitude and pincode are required",
      ),
    );
  }

  const parsedLat = parseCoordinate(latitude);
  const parsedLon = parseCoordinate(longitude);

  if (parsedLat === null || parsedLon === null) {
    return next(new CustomError(400, "latitude and longitude must be valid numbers"));
  }

  if (parsedLat < -90 || parsedLat > 90 || parsedLon < -180 || parsedLon > 180) {
    return next(new CustomError(400, "latitude or longitude is out of range"));
  }

  if (isDefault) {
    await AddressModel.updateMany({ user: userId }, { isDefault: false });
  }

  const serviceability = checkServiceability({
    pincode,
    latitude: parsedLat,
    longitude: parsedLon,
  });
  if (!serviceability.serviceable) {
    return next(
      new CustomError(400, serviceability.reason || "Area not serviceable"),
    );
  }

  const safeCity = city || "Unknown";
  const safeState = state || "Unknown";
  const safePostalCode = postalCode || pincode || "000000";
  const safeCountry = country || "India";

  const newAddress = await AddressModel.create({
    user: userId,
    fullName: user.name || "Customer",
    phone: user.phone || "0000000000",
    addressLine1: addressLine1 || fullAddress,
    addressLine2: addressLine2 || "",
    city: safeCity,
    state: safeState,
    postalCode: safePostalCode,
    pincode,
    country: safeCountry,
    fullAddress,
    formattedAddress: fullAddress,
    latitude: parsedLat,
    longitude: parsedLon,
    lat: parsedLat,
    lon: parsedLon,
    type: type || "home",
    isDefault: Boolean(isDefault),
  });

  if (!newAddress) {
    return next(new CustomError(400, "Cannot save location"));
  }

  new ApiResponse(201, "Location saved", newAddress).send(res);
});

export const updateAddress = expressAsyncHandler(async (req, res, next) => {
  const userId = req.myUser?.id;
  if (!userId) return next(new CustomError(401, "Unauthorized"));

  const { id } = req.params;
  if (!id) return next(new CustomError(400, "Address id is required"));

  const updateData = { ...req.body };

  if (updateData.pincode && !updateData.postalCode) {
    updateData.postalCode = updateData.pincode;
  }
  if (updateData.postalCode && !updateData.pincode) {
    updateData.pincode = updateData.postalCode;
  }
  if (updateData.fullAddress && !updateData.formattedAddress) {
    updateData.formattedAddress = updateData.fullAddress;
  }
  if (updateData.formattedAddress && !updateData.fullAddress) {
    updateData.fullAddress = updateData.formattedAddress;
  }
  if (
    updateData.latitude !== undefined &&
    updateData.longitude !== undefined
  ) {
    updateData.lat = updateData.latitude;
    updateData.lon = updateData.longitude;
  }

  if (updateData.isDefault) {
    await AddressModel.updateMany({ user: userId }, { isDefault: false });
  }

  const updatedAddress = await AddressModel.findOneAndUpdate(
    { _id: id, user: userId },
    { $set: updateData },
    { new: true, runValidators: true },
  );

  if (!updatedAddress) {
    return next(new CustomError(404, "Address not found"));
  }

  new ApiResponse(200, "Address Updated Successfully", updatedAddress).send(
    res,
  );
});

export const deleteAddress = expressAsyncHandler(async (req, res, next) => {
  const userId = req.myUser?.id;
  if (!userId) return next(new CustomError(401, "Unauthorized"));

  const { id } = req.params;
  if (!id) return next(new CustomError(400, "Address id is required"));

  const deletedAddress = await AddressModel.findOneAndDelete({
    _id: id,
    user: userId,
  });

  if (!deletedAddress) {
    return next(new CustomError(404, "Address not found"));
  }

  new ApiResponse(200, "Address Deleted Successfully", deletedAddress).send(res);
});

export const getMyAddresses = expressAsyncHandler(async (req, res, next) => {
  const userId = req.myUser?.id;
  if (!userId) return next(new CustomError(401, "Unauthorized"));

  const addresses = await AddressModel.find({ user: userId });

  new ApiResponse(200, "Addresses Fetched Successfully", addresses).send(res);
});
