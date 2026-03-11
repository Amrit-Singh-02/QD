export const rateLimitConfig = {
  auth: {
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: "Too many authentication attempts. Please try again later.",
  },
  password: {
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Too many password requests. Please try again later.",
  },
  otp: {
    windowMs: 5 * 60 * 1000,
    max: 5,
    message: "Too many OTP requests. Please try again later.",
  },
  order: {
    windowMs: 60 * 1000,
    max: 10,
    message: "Too many order requests. Please try again shortly.",
  },
  payment: {
    windowMs: 60 * 1000,
    max: 12,
    message: "Too many payment requests. Please try again shortly.",
  },
};
