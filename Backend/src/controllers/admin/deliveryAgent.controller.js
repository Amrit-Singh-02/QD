import expressAsyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import DeliveryAgentModel from "../../models/deliveryAgent.model.js";
import OrderModel from "../../models/order.model.js";
import ApiResponse from "../../utils/ApiResponse.util.js";
import CustomError from "../../utils/customError.util.js";
import { uploadImage } from "../../utils/cloudinary.util.js";

const getURL = (bufferValue, mimetype) => {
  const b64 = bufferValue.toString("base64");
  return `data:${mimetype};base64,${b64}`;
};

export const createDeliveryAgent = expressAsyncHandler(
  async (req, res, next) => {
    const {
      name,
      phone,
      email,
      password,
      pincode,
      currentLocation,
      address,
      aadharNumber,
      age,
      bikeName,
      bikeNumber,
      deliveryPincodes,
      deliveryAreas,
      profileImage,
      profileImageUrl,
    } = req.body;
    if (!password) {
      return next(new CustomError(400, "Password is required"));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const normalizedPincodes = Array.isArray(deliveryPincodes)
      ? deliveryPincodes
          .map((value) => String(value).trim())
          .filter((value) => value.length > 0)
      : [];
    const normalizedAreas = Array.isArray(deliveryAreas)
      ? deliveryAreas
          .map((value) => String(value).trim())
          .filter((value) => value.length > 0)
      : [];
    const resolvedPincode =
      typeof pincode === "string" && pincode.trim()
        ? pincode.trim()
        : normalizedPincodes[0];
    const parsedAge = Number(age);
    let profilePayload =
      profileImage && typeof profileImage === "object"
        ? profileImage
        : profileImageUrl
          ? { url: profileImageUrl }
          : null;

    if (req.file) {
      const imageURL = getURL(req.file.buffer, req.file.mimetype);
      const uploadedImage = await uploadImage(imageURL);
      profilePayload = {
        url: uploadedImage.secure_url,
        public_id: uploadedImage.public_id,
        asset_id: uploadedImage.asset_id,
      };
    }

    const newDeliveryAgent = await DeliveryAgentModel.create({
      name,
      phone,
      email,
      password: hashedPassword,
      role: "delivery",
      isOnline: false,
      isAvailable: false,
      pincode: resolvedPincode,
      currentLocation,
      address: typeof address === "string" ? address.trim() : "",
      aadharNumber: typeof aadharNumber === "string" ? aadharNumber.trim() : "",
      age: Number.isFinite(parsedAge) ? parsedAge : null,
      bikeName: typeof bikeName === "string" ? bikeName.trim() : "",
      bikeNumber: typeof bikeNumber === "string" ? bikeNumber.trim() : "",
      deliveryPincodes: normalizedPincodes,
      deliveryAreas: normalizedAreas,
      ...(profilePayload ? { profileImage: profilePayload } : {}),
      createdByAdmin: req.myUser.id,
    });

    new ApiResponse(
      201,
      "Delivery agent created successfully",
      newDeliveryAgent,
    ).send(res);
  },
);

const normalizeList = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry).trim())
      .filter((entry) => entry.length > 0);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }
  return [];
};

export const getAllDeliveryAgents = expressAsyncHandler(
  async (req, res, next) => {
    const agents = await DeliveryAgentModel.find({}).lean();

    if (!agents || agents.length === 0) {
      return new ApiResponse(200, "No delivery agents found", []).send(res);
    }

    const agentIds = agents.map((agent) => agent._id);
    const deliveredOrders = await OrderModel.find({
      assignedAgent: { $in: agentIds },
      orderStatus: "DELIVERED",
    })
      .sort({ createdAt: -1 })
      .lean();

    const orderMap = new Map();
    for (const order of deliveredOrders) {
      const key = String(order.assignedAgent);
      if (!orderMap.has(key)) orderMap.set(key, []);
      orderMap.get(key).push(order);
    }

    const payload = agents.map((agent) => {
      const id = String(agent._id);
      return {
        ...agent,
        id: agent._id,
        deliveredOrders: orderMap.get(id) || [],
      };
    });

    new ApiResponse(200, "Fetched delivery agents successfully", payload).send(
      res,
    );
  },
);

export const updateDeliveryAgent = expressAsyncHandler(
  async (req, res, next) => {
    const { id } = req.params;
    if (!id) return next(new CustomError(400, "Agent id is required"));

    const update = {};
    const setIfString = (key, value) => {
      if (typeof value === "string") {
        update[key] = value.trim();
      }
    };

    setIfString("name", req.body.name);
    setIfString("email", req.body.email);
    setIfString("phone", req.body.phone);
    setIfString("address", req.body.address);
    setIfString("aadharNumber", req.body.aadharNumber);
    setIfString("bikeName", req.body.bikeName);
    setIfString("bikeNumber", req.body.bikeNumber);

    if (Object.prototype.hasOwnProperty.call(req.body, "age")) {
      const parsedAge = Number(req.body.age);
      if (Number.isFinite(parsedAge) && parsedAge >= 18) {
        update.age = parsedAge;
      } else if (req.body.age === "" || req.body.age === null) {
        update.age = null;
      } else {
        return next(new CustomError(400, "Invalid age"));
      }
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "pincode")) {
      const pincode =
        typeof req.body.pincode === "string" ? req.body.pincode.trim() : "";
      update.pincode = pincode;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "deliveryPincodes")) {
      update.deliveryPincodes = normalizeList(req.body.deliveryPincodes);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "deliveryAreas")) {
      update.deliveryAreas = normalizeList(req.body.deliveryAreas);
    }

    if (req.body.profileImageUrl && typeof req.body.profileImageUrl === "string") {
      update.profileImage = { url: req.body.profileImageUrl.trim() };
    }

    if (req.file) {
      const imageURL = getURL(req.file.buffer, req.file.mimetype);
      const uploadedImage = await uploadImage(imageURL);
      update.profileImage = {
        url: uploadedImage.secure_url,
        public_id: uploadedImage.public_id,
        asset_id: uploadedImage.asset_id,
      };
    }

    const updated = await DeliveryAgentModel.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return next(new CustomError(404, "Delivery agent not found"));
    }

    new ApiResponse(200, "Delivery agent updated successfully", updated).send(
      res,
    );
  },
);

export const deleteDeliveryAgent = expressAsyncHandler(
  async (req, res, next) => {
    const { id } = req.params;
    if (!id) return next(new CustomError(400, "Agent id is required"));

    const deleted = await DeliveryAgentModel.findByIdAndDelete(id);
    if (!deleted) {
      return next(new CustomError(404, "Delivery agent not found"));
    }

    new ApiResponse(200, "Delivery agent deleted successfully", deleted).send(
      res,
    );
  },
);
