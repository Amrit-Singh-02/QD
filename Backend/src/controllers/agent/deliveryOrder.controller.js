import expressAsyncHandler from "express-async-handler";
import OrderModel from "../../models/order.model.js";
import DeliveryAgentModel from "../../models/deliveryAgent.model.js";
import CustomError from "../../utils/customError.util.js";
import ApiResponse from "../../utils/ApiResponse.util.js";
import {
  assertValidTransition,
  ORDER_STATUSES,
} from "../../utils/orderStatus.util.js";
import { consumeReservedInventory } from "../../services/inventory.service.js";
import { getUserRoom } from "../../services/presence.service.js";
import {
  releaseAgentLock,
  assignDeliveryAgent,
} from "../../services/orderAssignment.service.js";
import { learnReorderPatterns } from "../../services/pantryReorder.service.js";
import { createNotification } from "../../services/notification.service.js";

export const pickupOrder = expressAsyncHandler(async (req, res, next) => {
  const agentId = req.myDeliveryAgent?.id;
  const { id } = req.params;

  if (!agentId) {
    return next(new CustomError(401, "Unauthorized"));
  }
  if (!id) {
    return next(new CustomError(400, "Order id is required"));
  }

  const order = await OrderModel.findById(id);
  if (!order) return next(new CustomError(404, "Order not found"));

  if (String(order.assignedAgent || "") !== String(agentId)) {
    return next(
      new CustomError(403, "You are not assigned to this order."),
    );
  }

  if (order.orderStatus !== ORDER_STATUSES.ACCEPTED) {
    return next(
      new CustomError(400, "Order must be ACCEPTED before pickup."),
    );
  }

  assertValidTransition(order.orderStatus, ORDER_STATUSES.PICKED_UP);
  order.orderStatus = ORDER_STATUSES.PICKED_UP;
  await order.save();
  await learnReorderPatterns({ userId: order.user, orderItems: order.items });

  try {
    const userId = order.user?.toString?.() || order.user;
    if (userId) {
      await createNotification(
        userId,
        "order_picked_up",
        "Your order has been picked up.",
        req.app,
      );
    }
  } catch (err) {
    console.error("Failed to create notification (picked up):", err);
  }

  const io = req.app.get("io");
  const userId = order.user?.toString?.() || order.user;
  if (io && userId) {
    io.to(getUserRoom(userId)).emit("orderPickedUp", {
      orderId: order._id,
      status: order.orderStatus,
    });
  }

  new ApiResponse(200, "Order marked as picked up", order).send(res);
});

export const getActiveOrder = expressAsyncHandler(async (req, res, next) => {
  const agentId = req.myDeliveryAgent?.id;
  if (!agentId) {
    return next(new CustomError(401, "Unauthorized"));
  }

  const agent = await DeliveryAgentModel.findById(agentId);
  if (!agent || !agent.activeOrder) {
    return new ApiResponse(200, "No active order", null).send(res);
  }

  const order = await OrderModel.findById(agent.activeOrder)
    .populate("items.product")
    .populate("user");

  new ApiResponse(200, "Active order", order).send(res);
});

export const markOutForDelivery = expressAsyncHandler(
  async (req, res, next) => {
    const agentId = req.myDeliveryAgent?.id;
    const { id } = req.params;

    if (!agentId) {
      return next(new CustomError(401, "Unauthorized"));
    }
    if (!id) {
      return next(new CustomError(400, "Order id is required"));
    }

    const order = await OrderModel.findById(id);
    if (!order) return next(new CustomError(404, "Order not found"));

    if (String(order.assignedAgent || "") !== String(agentId)) {
      return next(
        new CustomError(403, "You are not assigned to this order."),
      );
    }

    if (order.orderStatus !== ORDER_STATUSES.PICKED_UP) {
      return next(
        new CustomError(400, "Order must be PICKED_UP before delivery."),
      );
    }

    assertValidTransition(order.orderStatus, ORDER_STATUSES.OUT_FOR_DELIVERY);
    order.orderStatus = ORDER_STATUSES.OUT_FOR_DELIVERY;
    await order.save();

    try {
      const userId = order.user?.toString?.() || order.user;
      if (userId) {
        await createNotification(
          userId,
          "order_out_for_delivery",
          "Your order is out for delivery.",
          req.app,
        );
      }
    } catch (err) {
      console.error("Failed to create notification (out for delivery):", err);
    }

    const io = req.app.get("io");
    const userId = order.user?.toString?.() || order.user;
    if (io && userId) {
      io.to(getUserRoom(userId)).emit("orderOutForDelivery", {
        orderId: order._id,
        status: order.orderStatus,
      });
    }

    new ApiResponse(200, "Order marked as out for delivery", order).send(res);
  },
);

export const markDelivered = expressAsyncHandler(async (req, res, next) => {
  const agentId = req.myDeliveryAgent?.id;
  const { id } = req.params;

  if (!agentId) {
    return next(new CustomError(401, "Unauthorized"));
  }
  if (!id) {
    return next(new CustomError(400, "Order id is required"));
  }

  const order = await OrderModel.findById(id);
  if (!order) return next(new CustomError(404, "Order not found"));

  if (String(order.assignedAgent || "") !== String(agentId)) {
    return next(new CustomError(403, "You are not assigned to this order."));
  }

  if (order.orderStatus !== ORDER_STATUSES.OUT_FOR_DELIVERY) {
    return next(
      new CustomError(400, "Order must be OUT_FOR_DELIVERY before delivery."),
    );
  }

  assertValidTransition(order.orderStatus, ORDER_STATUSES.DELIVERED);
  order.orderStatus = ORDER_STATUSES.DELIVERED;
  await consumeReservedInventory(order, { save: false });

  await order.save();

  const agent = req.myDeliveryAgent;
  agent.isAvailable = true;
  agent.activeOrder = null;
  const prevDeliveries = agent.totalDeliveries || 0;
  agent.totalDeliveries = prevDeliveries + 1;

  // update avgDeliveryTimeMs using running average
  const deliveryDurationMs = Date.now() - new Date(order.updatedAt).getTime();
  if (deliveryDurationMs > 0) {
    const prevAvg = agent.avgDeliveryTimeMs || 0;
    agent.avgDeliveryTimeMs = Math.round(
      (prevAvg * prevDeliveries + deliveryDurationMs) / (prevDeliveries + 1),
    );
  }

  await agent.save();

  try {
    const userId = order.user?.toString?.() || order.user;
    if (userId) {
      await createNotification(
        userId,
        "order_delivered",
        "Your order has been delivered.",
        req.app,
      );
    }
  } catch (err) {
    console.error("Failed to create notification (delivered):", err);
  }

  const io = req.app.get("io");
  const userId = order.user?.toString?.() || order.user;
  if (io && userId) {
    io.to(getUserRoom(userId)).emit("orderDelivered", {
      orderId: order._id,
      status: order.orderStatus,
    });
  }

  new ApiResponse(200, "Order marked as delivered", order).send(res);
});

export const markPaymentAccepted = expressAsyncHandler(
  async (req, res, next) => {
    const agentId = req.myDeliveryAgent?.id;
    const { id } = req.params;

    if (!agentId) {
      return next(new CustomError(401, "Unauthorized"));
    }
    if (!id) {
      return next(new CustomError(400, "Order id is required"));
    }

    const order = await OrderModel.findById(id);
    if (!order) return next(new CustomError(404, "Order not found"));

    if (String(order.assignedAgent || "") !== String(agentId)) {
      return next(new CustomError(403, "You are not assigned to this order."));
    }

    const allowedStatuses = [
      ORDER_STATUSES.PICKED_UP,
      ORDER_STATUSES.OUT_FOR_DELIVERY,
      ORDER_STATUSES.DELIVERED,
    ];
    if (!allowedStatuses.includes(order.orderStatus)) {
      return next(
        new CustomError(400, "Payment can be accepted after pickup."),
      );
    }

    const currentPaymentStatus = String(order.paymentStatus || "").toLowerCase();
    if (["paid", "successful"].includes(currentPaymentStatus)) {
      return new ApiResponse(200, "Payment already accepted", order).send(res);
    }

    order.paymentStatus = "successful";
    await order.save();

    try {
      const userId = order.user?.toString?.() || order.user;
      if (userId) {
        await createNotification(
          userId,
          "payment_accepted",
          "Payment for your order was accepted.",
          req.app,
        );
      }
    } catch (err) {
      console.error("Failed to create notification (payment accepted):", err);
    }

    const io = req.app.get("io");
    const userId = order.user?.toString?.() || order.user;
    if (io && userId) {
      io.to(getUserRoom(userId)).emit("paymentAccepted", {
        orderId: order._id,
        paymentStatus: order.paymentStatus,
      });
    }

    new ApiResponse(200, "Payment marked as accepted", order).send(res);
  },
);

export const getOrderHistory = expressAsyncHandler(async (req, res, next) => {
  const agentId = req.myDeliveryAgent?.id;
  if (!agentId) {
    return next(new CustomError(401, "Unauthorized"));
  }

  const historyStatuses = [ORDER_STATUSES.DELIVERED, ORDER_STATUSES.CANCELLED];

  const orders = await OrderModel.find({
    orderStatus: { $in: historyStatuses },
    $or: [{ assignedAgent: agentId }, { cancelledByAgent: agentId }],
  })
    .sort({ updatedAt: -1 })
    .populate("items.product");

  new ApiResponse(200, "Order history", orders).send(res);
});

export const cancelOrderByAgent = expressAsyncHandler(
  async (req, res, next) => {
    const agentId = req.myDeliveryAgent?.id;
    const { id } = req.params;

    if (!agentId) {
      return next(new CustomError(401, "Unauthorized"));
    }
    if (!id) {
      return next(new CustomError(400, "Order id is required"));
    }

    const order = await OrderModel.findById(id).populate("user", "name phone");
    if (!order) return next(new CustomError(404, "Order not found"));

    if (String(order.assignedAgent || "") !== String(agentId)) {
      return next(
        new CustomError(403, "You are not assigned to this order."),
      );
    }

    if (order.orderStatus !== ORDER_STATUSES.ACCEPTED) {
      return next(
        new CustomError(
          400,
          "Order can only be cancelled when status is ACCEPTED.",
        ),
      );
    }

    // Penalize agent
    const agent = await DeliveryAgentModel.findById(agentId);
    if (agent) {
      agent.acceptanceRate = Math.max(0, (agent.acceptanceRate || 100) - 5);
      agent.recentAssignments = (agent.recentAssignments || 0) + 1;
      agent.activeOrder = null;
      agent.isAvailable = true;
      await agent.save();
    }

    // Release agent lock
    await releaseAgentLock(agentId, req.app);

    // Update order for reassignment
    order.cancelledByAgent = agentId;
    order.assignedAgent = null;
    order.orderStatus = ORDER_STATUSES.ASSIGNING;
    if (!order.assignmentAttempts.map(String).includes(String(agentId))) {
      order.assignmentAttempts.push(agentId);
    }
    await order.save();

    const userId = order.user?._id?.toString?.() || order.user?.toString?.() || order.user;
    try {
      if (userId) {
        await createNotification(
          userId,
          "order_cancelled_by_agent",
          "Your delivery agent cancelled. We are reassigning your order.",
          req.app,
        );
      }
    } catch (err) {
      console.error("Failed to create notification (cancelled by agent):", err);
    }

    // Notify user
    const io = req.app.get("io");
    if (io && userId) {
      io.to(getUserRoom(userId)).emit("orderCancelledByAgent", {
        orderId: order._id,
        status: order.orderStatus,
        message: "Your delivery agent cancelled. Reassigning a new agent...",
      });
    }

    // Trigger reassignment
    try {
      await assignDeliveryAgent(order, req.app);
    } catch (err) {
      // reassignment failure is non-fatal
    }

    new ApiResponse(200, "Order cancelled. Reassigning to another agent.", order).send(res);
  },
);
