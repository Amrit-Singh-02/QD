import Joi from "joi";

// const imageSchema = Joi.object({
//   url: Joi.string().uri().required(),
//   asset_id: Joi.string().required(),
//   public_id: Joi.string().required(),
// });

export const addProductValidator = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  description: Joi.string().trim().min(5).required(),
  price: Joi.number().positive().required(),
  // images: Joi.array().items(imageSchema).min(1).required(),
  category: Joi.alternatives()
    .try(Joi.string().trim(), Joi.array().items(Joi.string().trim()).min(1))
    .required(),
  subCategory: Joi.alternatives()
    .try(Joi.string().trim(), Joi.array().items(Joi.string().trim()).min(1))
    .optional(),
  brand: Joi.string().trim().required(),
  stocks: Joi.number().integer().min(0).required(),
  discount: Joi.number().min(0).optional().allow(null),
});

export const updateProductValidator = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  description: Joi.string().trim().min(5).optional(),
  price: Joi.number().positive().optional(),
  // images: Joi.array().items(imageSchema).min(1).optional(),
  category: Joi.alternatives()
    .try(Joi.string().trim(), Joi.array().items(Joi.string().trim()).min(1))
    .optional(),
  subCategory: Joi.alternatives()
    .try(Joi.string().trim(), Joi.array().items(Joi.string().trim()).min(1))
    .optional(),
  brand: Joi.string().trim().optional(),
  stocks: Joi.number().integer().min(0).optional(),
  discount: Joi.number().min(0).optional().allow(null),
});
