import expressAsyncHandler from "express-async-handler";
import CustomError from "../utils/customError.util.js";
import jwt from "jsonwebtoken";
import userModel from "../models/user.model.js";
import DeliveryAgentModel from "../models/deliveryAgent.model.js";

export const authenticate = expressAsyncHandler(async (req, res, next) => {
  let token = req?.cookies?.token;
  if (!token || token === undefined) {
    return next(new CustomError(401, "Please login to access this route."));
  }
  let decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  let user = await userModel.findById(decodedToken.id);
  if (!user) {
    return next(new CustomError(401, "Invalid session please login again"));
  }

  req.myUser = user;
  next();
});

export const authenticateDelivery = expressAsyncHandler(
  async (req, res, next) => {
    let token = req?.cookies?.token;
    if (!token || token === undefined) {
      return next(new CustomError(401, "Please login to access this route."));
    }
    let decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    let deliveryAgent = await DeliveryAgentModel.findById(decodedToken.id);
    if (!deliveryAgent) {
      return next(new CustomError(401, "Invalid session please login again"));
    }

    req.myDeliveryAgent = deliveryAgent;
    next();
  },
);

export const authorize = expressAsyncHandler(async (req, res, next) => {
  if (req.myUser.role === "admin") next();
  else
    return next(
      new CustomError(403, "You are not authorized to access this route."),
    );
});

export const authorizeRoles = (...roles) =>
  expressAsyncHandler(async (req, res, next) => {
    const role = req?.myUser?.role || req?.myDeliveryAgent?.role;
    if (!role) {
      return next(new CustomError(401, "Please login to access this route."));
    }
    if (!roles.includes(role)) {
      return next(
        new CustomError(403, "You are not authorized to access this route."),
      );
    }
    next();
  });
