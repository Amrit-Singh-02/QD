// Auth controller
import userModel from "../../models/user.model.js";
import expressAsyncHandler from "express-async-handler";
import ApiResponse from "../../utils/ApiResponse.util.js";
import CustomError from "../../utils/customError.util.js";
import { generateToken } from "../../utils/jwt.util.js";
import { sendEmail } from "../../utils/nodemailer.util.js";
import crypto from "crypto";

// ! ================ Register User ================================

export const registerUser = expressAsyncHandler(async (req, res, next) => {
  const { name, email, password, phone } = req.body;
  const newUser = await userModel.create({
    name,
    email,
    password,
    phone,
  });

  let emailVerificationToken = newUser.generateEmailVerificationToken();
  await newUser.save();

  let verification_url = `${process.env.FRONTEND_URL}/verify-email/${emailVerificationToken}`;

  await sendEmail(
    email,
    "Email Verification",
    `<h1> this is for verification</h1> <a href="${verification_url}">Click Here</a> <h3> ${emailVerificationToken} </h3>`,
  );

  new ApiResponse(201, "User Registered Successfully. Verification link sent to your email.", newUser).send(res);
});

// ! --------------------------------------------------------------

// ! ================================= verify email ====================

export const verifyEmail = expressAsyncHandler(async (req, res, next) => {
  let { emailToken } = req.params;
  let hashedToken = crypto
    .createHash("sha256")
    .update(emailToken)
    .digest("hex");

  let user = await userModel.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationTokenExpire: { $gt: Date.now() },
  });

  if (!user) return next(new CustomError(400, "Token expired"));
  if (user.isVerified)
    return next(new CustomError(400, "Email already verified"));

  user.isVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationTokenExpire = undefined;
  await user.save();

  new ApiResponse(200, "Email verified successfully").send(res);
});

// ! -------------------------------------------------------------------

// ! ======================= Resend Verification Link ====================

export const resendEmailVerificationLink = expressAsyncHandler(
  async (req, res, next) => {
    const { email } = req.body;
    let existingUser = await userModel.findOne({ email });
    if (!existingUser) return next(new CustomError(404, "Email not found"));
    if (existingUser.isVerified) {
      return next(new CustomError(400, "Email already verified"));
    }

    let emailVerificationToken = existingUser.generateEmailVerificationToken();

    let verification_url = `${process.env.FRONTEND_URL}/verify-email/${emailVerificationToken}`;

    await sendEmail(
      email,
      "Resend Email Verification",
      `<h1> this is for verification</h1> <a href="${verification_url}">Click Here</a> <h3> ${emailVerificationToken} </h3>`,
    );

    new ApiResponse(200, "Verification link sent successfully").send(res);
  },
);

// !----------------------------------------------------------------------

// ! ================== Login =====================================

export const login = expressAsyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  let existingUser = await userModel.findOne({ email }).select("+password");
  if (!existingUser) {
    return next(new CustomError(404, "Invalid Credentials"));
  }
  let isPasswordMatched = await existingUser.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new CustomError(401, "Invalid Credentials"));
  }

  let token = generateToken(existingUser.id);
  res.cookie("token", token, {
    maxAge: 1 * 60 * 60 * 1000,
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });

  new ApiResponse(200, "User Logged in successfully").send(res);
});

// ! ----------------------------------------------------------

// ! ======================== Logout ==================================

export const logout = expressAsyncHandler(async (req, res, next) => {
  res.clearCookie("token");
  new ApiResponse(200, "User Logged out successfully").send(res);
});

// !------------------------------------------------------------------

// ! ====================== Update Profile ===========================

export const updateProfile = expressAsyncHandler(async (req, res, next) => {
  let id = req.myUser.id;

  const updatedUser = await userModel.findByIdAndUpdate(id, req.body, {
    new: true,
    runvalidators: true,
  });
  if (!updatedUser) {
    return next(new CustomError(404, "User not found"));
  }

  new ApiResponse(200, "Profile Updated", updatedUser).send(res);
});

// !-------------------------------------------------------------------

// ! ========================== Change Password ======================

export const changePassword = expressAsyncHandler(async (req, res, next) => {
  const existingUser = await userModel
    .findById(req.myUser.id)
    .select("+password");
  existingUser.password = req.body.password;

  await existingUser.save();
  new ApiResponse(200, "Password Updated Successfully.").send(res);
});

// ! -----------------------------------------------------------------

// ! ======================== Forgot Password Link ===================

export const forgotPassword = expressAsyncHandler(async (req, res, next) => {
  const { email } = req.body;
  // const existingUser = await userModel.findOne({ email, isVerified: true });
  const existingUser = await userModel.findOne({ email });
  if (!existingUser)
    return next(new CustomError(404, "User not Found or not verified"));

  const passwordVerificationToken =
    existingUser.generatePasswordVerificationToken();

  let verification_url = `${process.env.FRONTEND_URL}/reset-password/${passwordVerificationToken}`;

  await sendEmail(
    email,
    "Reset Password",
    `<h1> Password Reset</h1> <a href="${verification_url}">Click Here</a> <h3> ${passwordVerificationToken} </h3>`,
  );

  await existingUser.save();
  new ApiResponse(
    200,
    `email sent to ${existingUser.email} successfully.`,
  ).send(res);
});

// ! ----------------------------------------------------------------

// ! =============================== Reset Password ======================

export const resetPassword = expressAsyncHandler(async (req, res, next) => {
  const { passwordToken } = req.params;
  let hashedPassword = crypto
    .createHash("sha256")
    .update(passwordToken)
    .digest("hex");
  const user = await userModel.findOne({
    passwordVerificationToken: hashedPassword,
    passwordVerificationTokenExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new CustomError(400, "Reset password token is invalid or has expires"),
    );
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(new CustomError(400, "Password do not Matched"));
  }

  user.password = req.body.password;
  user.passwordVerificationToken = undefined;
  user.passwordVerificationTokenExpire = undefined;

  await user.save();

  new ApiResponse(200, "Password reset successfully.").send(res);
});

// ! ----------------------------------------------------------------------------

// ! ========================== Get Current User ================================
export const currentUser = expressAsyncHandler(async (req, res, next) => {
  let user = req.myUser;
  if (!user) {
    return next(new CustomError("404", "User not found"));
  }
  new ApiResponse(200, "Current User:", user).send(res);
});
// ! ----------------------------------------------------------------------------'
