import express from "express";
import expressAsyncHandler from "express-async-handler";
import crypto from "crypto";
import userModel from "../models/user.model.js";
import { sendOTP, verifyOTP } from "../utils/twilio.js";
import ApiResponse from "../utils/ApiResponse.util.js";
import CustomError from "../utils/customError.util.js";
import { generateToken } from "../utils/jwt.util.js";

const router = express.Router();

const normalizePhone = (input = "") => {
  const raw = String(input).trim();
  const digits = raw.replace(/\D/g, "");

  if (!digits) {
    return { dbPhone: "", e164: "" };
  }

  if (digits.length === 10) {
    return { dbPhone: digits, e164: `+91${digits}` };
  }

  if (digits.length === 12 && digits.startsWith("91")) {
    return { dbPhone: digits.slice(2), e164: `+${digits}` };
  }

  if (raw.startsWith("+")) {
    return { dbPhone: digits, e164: raw };
  }

  return { dbPhone: digits, e164: `+${digits}` };
};

const buildUserPayload = ({ dbPhone, name, email, password }) => {
  const safeName = name?.trim() || `User ${dbPhone.slice(-4)}`;
  const safeEmail = email?.trim().toLowerCase() || `user${dbPhone}@phone.quickdrop.local`;
  const safePassword = password?.trim() || `Otp${crypto.randomBytes(5).toString("hex")}`;

  return {
    name: safeName,
    email: safeEmail,
    password: safePassword,
    phone: dbPhone,
    isVerified: true,
  };
};

router.post(
  "/send-otp",
  expressAsyncHandler(async (req, res, next) => {
    const { phone } = req.body;

    if (!phone) {
      return next(new CustomError(400, "Phone number is required"));
    }

    const { e164 } = normalizePhone(phone);
    if (!e164) {
      return next(new CustomError(400, "Invalid phone number"));
    }

    await sendOTP(e164);
    new ApiResponse(200, "OTP sent successfully").send(res);
  })
);

router.post(
  "/verify-otp",
  expressAsyncHandler(async (req, res, next) => {
    const { phone, code, name, email, password } = req.body;

    if (!phone || !code) {
      return next(new CustomError(400, "Phone and code are required"));
    }

    const { dbPhone, e164 } = normalizePhone(phone);
    if (!dbPhone || !e164) {
      return next(new CustomError(400, "Invalid phone number"));
    }

    const isValid = await verifyOTP(e164, code);
    if (!isValid) {
      return next(new CustomError(400, "Invalid OTP"));
    }

    let user = await userModel.findOne({ phone: dbPhone });
    let isNewUser = false;

    if (!user) {
      const payload = buildUserPayload({ dbPhone, name, email, password });
      user = await userModel.create(payload);
      isNewUser = true;
    }

    const token = generateToken(user.id);
    res.cookie("token", token, {
      maxAge: 1 * 60 * 60 * 1000,
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    new ApiResponse(
      200,
      isNewUser ? "Account created and logged in" : "OTP verified",
      null,
      { isNewUser }
    ).send(res);
  })
);

export default router;
