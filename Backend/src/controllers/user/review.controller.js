import expressAsyncHandler from "express-async-handler";
import ReviewModel from "../../models/review.model.js";
import OrderModel from "../../models/order.model.js";
import DeliveryAgentModel from "../../models/deliveryAgent.model.js";
import CustomError from "../../utils/customError.util.js";
import ApiResponse from "../../utils/ApiResponse.util.js";

export const createReview = expressAsyncHandler(async (req, res, next) => {
  const userId = req.myUser?.id;
  if (!userId) return next(new CustomError(401, "Unauthorized"));

  const { orderId, rating, comment } = req.body;
  if (!orderId) return next(new CustomError(400, "orderId is required"));
  if (!rating || rating < 1 || rating > 5) {
    return next(new CustomError(400, "Rating must be between 1 and 5"));
  }

  const order = await OrderModel.findById(orderId);
  if (!order) return next(new CustomError(404, "Order not found"));

  if (String(order.user) !== String(userId)) {
    return next(new CustomError(403, "You can only review your own orders"));
  }

  if (order.orderStatus !== "DELIVERED") {
    return next(
      new CustomError(400, "You can only review delivered orders"),
    );
  }

  if (!order.assignedAgent) {
    return next(new CustomError(400, "No agent was assigned to this order"));
  }

  // Check for existing review
  const existing = await ReviewModel.findOne({ order: orderId, user: userId });
  if (existing) {
    return next(new CustomError(400, "You have already reviewed this order"));
  }

  const review = await ReviewModel.create({
    user: userId,
    order: orderId,
    agent: order.assignedAgent,
    rating,
    comment: comment || "",
  });

  // Update agent rating
  const agent = await DeliveryAgentModel.findById(order.assignedAgent);
  if (agent) {
    const oldTotal = agent.totalReviews || 0;
    const oldRating = agent.rating || 0;
    agent.totalReviews = oldTotal + 1;
    agent.rating = Math.round(
      ((oldRating * oldTotal + rating) / (oldTotal + 1)) * 10,
    ) / 10;
    await agent.save();
  }

  new ApiResponse(201, "Review submitted successfully", review).send(res);
});

export const getOrderReview = expressAsyncHandler(async (req, res, next) => {
  const userId = req.myUser?.id;
  if (!userId) return next(new CustomError(401, "Unauthorized"));

  const { orderId } = req.params;
  if (!orderId) return next(new CustomError(400, "orderId is required"));

  const review = await ReviewModel.findOne({
    order: orderId,
    user: userId,
  });

  new ApiResponse(200, "Review fetched", review).send(res);
});
