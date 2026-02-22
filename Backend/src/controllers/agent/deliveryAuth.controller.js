import expressAsyncHandler from "express-async-handler";
import ApiResponse from "../../utils/ApiResponse.util.js";
import CustomError from "../../utils/customError.util.js";
import { generateToken } from "../../utils/jwt.util.js";
import DeliveryAgentModel from "../../models/deliveryAgent.model.js";

export const loginDeliveryAgent = expressAsyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const existingAgent = await DeliveryAgentModel.findOne({ email }).select(
    "+password",
  );
  if (!existingAgent) {
    return next(new CustomError(404, "Invalid Credentials"));
  }

  const isPasswordMatched = await existingAgent.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new CustomError(401, "Invalid Credentials"));
  }

  existingAgent.isOnline = true;
  existingAgent.isAvailable = true;
  await existingAgent.save();

  const token = generateToken(existingAgent.id);
  res.cookie("token", token, {
    maxAge: 1 * 60 * 60 * 1000,
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });

  const agentPayload = existingAgent.toObject();
  delete agentPayload.password;

  new ApiResponse(
    200,
    "Delivery agent logged in successfully",
    agentPayload,
  ).send(res);
});

export const logoutDeliveryAgent = expressAsyncHandler(
  async (req, res, next) => {
    const deliveryAgent = req.myDeliveryAgent;
    if (!deliveryAgent) {
      return next(new CustomError(401, "Please login to access this route."));
    }

    deliveryAgent.isOnline = false;
    deliveryAgent.isAvailable = false;
    await deliveryAgent.save();

    res.clearCookie("token");
    new ApiResponse(200, "Delivery agent logged out successfully").send(res);
  },
);

export const currentDeliveryAgent = expressAsyncHandler(
  async (req, res, next) => {
    const agent = req.myDeliveryAgent;
    if (!agent) {
      return next(new CustomError(404, "Delivery agent not found"));
    }
    new ApiResponse(200, "Current delivery agent", agent).send(res);
  },
);
