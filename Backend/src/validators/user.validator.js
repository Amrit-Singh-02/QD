// User validator
import Joi from "joi";

export const registerSchema = Joi.object({
  name: Joi.string().max(75).required(),
  email: Joi.string().required().email(),
  password: Joi.string().min(3).max(50).required(),
  phone: Joi.string()
    .length(10)
    .required()
    .pattern(/^[6-9]\d{9}$/)
    .message("Invalid Mobile Number"),
});

export const loginSchema=Joi.object({
    email: Joi.string().required().email(),
    password: Joi.string().min(3).max(50).required(), 
});

export const updateProfileSchema = Joi.object({
  name: Joi.string().max(75).optional(),
  email: Joi.string().min(5).max(50).optional().email(),
  phone: Joi.string()
    .length(10)
    .optional()
    .pattern(/^[6-9]\d{9}$/)
    .message("Invalid Mobile Number"),
  contactNumber: Joi.string()
    .length(10)
    .optional()
    .pattern(/^[6-9]\d{9}$/)
    .message("Invalid Mobile Number"),
});

export const sendPhoneOtpSchema = Joi.object({
  phone: Joi.string()
    .length(10)
    .required()
    .pattern(/^[6-9]\d{9}$/)
    .message("Invalid Mobile Number"),
});

export const verifyPhoneOtpSchema = Joi.object({
  phone: Joi.string()
    .length(10)
    .required()
    .pattern(/^[6-9]\d{9}$/)
    .message("Invalid Mobile Number"),
  code: Joi.string().min(4).max(6).required(),
});

export const sendEmailOtpSchema = Joi.object({
  email: Joi.string().required().email(),
});

export const verifyEmailOtpSchema = Joi.object({
  email: Joi.string().required().email(),
  code: Joi.string().min(4).max(6).required(),
});

export const updatePasswordSchema = Joi.object({
  password: Joi.string().min(3).max(50).required(),
});



export const forgotPasswordSchema = Joi.object({
  email: Joi.string().required().email(),
});

export const resetPasswordSchema = Joi.object({
  password: Joi.string().min(8).required(),
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
    }),
});


