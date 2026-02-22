import expressAsyncHandler from "express-async-handler";
import HelpTicketModel, {
  TICKET_STATUS,
} from "../../models/helpTicket.model.js";
import CustomError from "../../utils/customError.util.js";
import ApiResponse from "../../utils/ApiResponse.util.js";

const STATUS_TRANSITIONS = {
  OPEN: ["IN_PROGRESS", "CLOSED"],
  IN_PROGRESS: ["RESOLVED", "CLOSED"],
  RESOLVED: ["CLOSED"],
  CLOSED: [],
};

export const getAllTickets = expressAsyncHandler(async (req, res, next) => {
  const { status, fromDate, toDate } = req.query;
  const filter = {};

  if (status && TICKET_STATUS.includes(status)) {
    filter.status = status;
  }
  if (fromDate || toDate) {
    filter.createdAt = {};
    if (fromDate) filter.createdAt.$gte = new Date(fromDate);
    if (toDate) filter.createdAt.$lte = new Date(toDate);
  }

  const tickets = await HelpTicketModel.find(filter)
    .sort({ createdAt: -1 })
    .populate("userId", "name email phone")
    .populate("orderId", "orderStatus totalAmount createdAt");

  new ApiResponse(200, "All help tickets", tickets).send(res);
});

export const updateTicket = expressAsyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status, priority, adminResponse } = req.body;

  const ticket = await HelpTicketModel.findById(id);
  if (!ticket) return next(new CustomError(404, "Ticket not found"));

  if (status) {
    const allowed = STATUS_TRANSITIONS[ticket.status] || [];
    if (!allowed.includes(status)) {
      return next(
        new CustomError(
          400,
          `Cannot transition from ${ticket.status} to ${status}`,
        ),
      );
    }
    ticket.status = status;
  }

  if (priority) {
    ticket.priority = priority;
  }

  if (adminResponse !== undefined) {
    ticket.adminResponse = adminResponse;
  }

  await ticket.save();

  new ApiResponse(200, "Ticket updated", ticket).send(res);
});
