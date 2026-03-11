import Joi from "joi";

const objectId = Joi.string().hex().length(24);

const locationSchema = Joi.object({
  lat: Joi.number().optional(),
  lng: Joi.number().optional(),
  latitude: Joi.number().optional(),
  longitude: Joi.number().optional(),
  accuracy: Joi.number().optional(),
  timestamp: Joi.number().optional(),
}).optional().allow(null);

export const createOrderSchema = Joi.object({
  addressId: objectId.required(),
  paymentMethod: Joi.string().trim().valid("cod").optional(),
  notes: Joi.string().trim().allow("").max(500).optional(),
  locationCoords: locationSchema,
});

export const createPaypalOrderSchema = Joi.object({
  addressId: objectId.required(),
  notes: Joi.string().trim().allow("").max(500).optional(),
  locationCoords: locationSchema,
});

export const capturePaypalSchema = Joi.object({
  orderId: objectId.required(),
  paypalOrderId: Joi.string().trim().required(),
});

export const createStripeOrderSchema = Joi.object({
  addressId: objectId.required(),
  notes: Joi.string().trim().allow("").max(500).optional(),
  locationCoords: locationSchema,
});

export const confirmStripeSchema = Joi.object({
  orderId: objectId.required(),
  paymentIntentId: Joi.string().trim().required(),
});

export const updateOrderStatusSchema = Joi.object({
  orderStatus: Joi.string().trim().optional(),
  paymentStatus: Joi.string().trim().optional(),
}).or("orderStatus", "paymentStatus");
