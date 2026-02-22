import expressAsyncHandler from "express-async-handler";
import HelpTicketModel from "../../models/helpTicket.model.js";
import CustomError from "../../utils/customError.util.js";
import ApiResponse from "../../utils/ApiResponse.util.js";

export const createTicket = expressAsyncHandler(async (req, res, next) => {
  const userId = req.myUser?.id;
  if (!userId) return next(new CustomError(401, "Unauthorized"));

  const { category, message, orderId } = req.body;

  if (!category) return next(new CustomError(400, "Category is required"));
  if (!message || message.trim().length < 10) {
    return next(
      new CustomError(400, "Message must be at least 10 characters long"),
    );
  }

  // Spam check: max 5 open tickets per user
  const openCount = await HelpTicketModel.countDocuments({
    userId,
    status: { $in: ["OPEN", "IN_PROGRESS"] },
  });
  if (openCount >= 5) {
    return next(
      new CustomError(
        429,
        "You have too many open tickets. Please wait for existing ones to be resolved.",
      ),
    );
  }

  const ticket = await HelpTicketModel.create({
    userId,
    orderId: orderId || null,
    category,
    message: message.trim(),
  });

  new ApiResponse(201, "Support ticket created successfully", ticket).send(res);
});

export const getMyTickets = expressAsyncHandler(async (req, res, next) => {
  const userId = req.myUser?.id;
  if (!userId) return next(new CustomError(401, "Unauthorized"));

  const tickets = await HelpTicketModel.find({ userId })
    .sort({ createdAt: -1 })
    .populate("orderId", "orderStatus totalAmount createdAt");

  new ApiResponse(200, "Your tickets", tickets).send(res);
});
