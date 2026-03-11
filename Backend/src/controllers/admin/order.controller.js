import expressAsyncHandler from "express-async-handler";
import ApiResponse from "../../utils/ApiResponse.util.js";
import CustomError from "../../utils/customError.util.js";
import OrderModel from "../../models/order.model.js";
import ProductModel from "../../models/product.model.js";
import UserModel from "../../models/user.model.js";
import mongoose from "mongoose";
import {
  assertValidTransition,
  normalizeOrderStatus,
  ORDER_STATUSES,
} from "../../utils/orderStatus.util.js";
import {
  consumeReservedInventory,
  releaseReservedInventory,
} from "../../services/inventory.service.js";
import { recordAuditLog } from "../../services/auditLog.service.js";

export const getAllOrders = expressAsyncHandler(async (req, res, next) => {
  const {
    status,
    userId,
    user,
    orderId,
    fromDate,
    toDate,
    page = 1,
    limit = 20,
  } = req.query;
  const filter = {};

  if (status) filter.orderStatus = normalizeOrderStatus(status);

  const userFilters = [];
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    userFilters.push(new mongoose.Types.ObjectId(userId));
  }

  if (user) {
    if (mongoose.Types.ObjectId.isValid(user)) {
      userFilters.push(new mongoose.Types.ObjectId(user));
    } else {
      const regex = new RegExp(user, "i");
      const matchedUsers = await UserModel.find({
        $or: [{ name: regex }, { email: regex }, { phone: regex }],
      }).select("_id");
      if (matchedUsers.length > 0) {
        matchedUsers.forEach((u) => userFilters.push(u._id));
      } else {
        return new ApiResponse(200, "Fetched orders successfully", {
          orders: [],
          pagination: {
            page: Number(page) || 1,
            limit: Number(limit) || 20,
            total: 0,
            totalPages: 0,
          },
        }).send(res);
      }
    }
  }

  if (userFilters.length > 0) {
    filter.user = { $in: userFilters };
  }

  if (orderId) {
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      filter._id = orderId;
    } else {
      filter.$expr = {
        $regexMatch: {
          input: { $toString: "$_id" },
          regex: orderId,
          options: "i",
        },
      };
    }
  }

  if (fromDate || toDate) {
    filter.createdAt = {};
    if (fromDate) {
      const start = new Date(fromDate);
      if (!Number.isNaN(start.getTime())) {
        filter.createdAt.$gte = start;
      }
    }
    if (toDate) {
      const end = new Date(toDate);
      if (!Number.isNaN(end.getTime())) {
        if (end.getHours() === 0 && end.getMinutes() === 0 && end.getSeconds() === 0) {
          end.setHours(23, 59, 59, 999);
        }
        filter.createdAt.$lte = end;
      }
    }
    if (Object.keys(filter.createdAt).length === 0) {
      delete filter.createdAt;
    }
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Math.min(100, Number(limit) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [orders, total] = await Promise.all([
    OrderModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .select("-__v")
      .populate("user")
      .populate("items.product")
      .lean({ virtuals: true }),
    OrderModel.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limitNum);

  new ApiResponse(200, "Fetched orders successfully", {
    orders,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
    },
  }).send(res);
});

export const updateOrderStatus = expressAsyncHandler(
  async (req, res, next) => {
    const { id } = req.params;
    if (!id) return next(new CustomError(400, "Order id is required"));

    const { orderStatus, paymentStatus } = req.body;

    if (!orderStatus && !paymentStatus) {
      return next(
        new CustomError(400, "Order status or payment status is required"),
      );
    }

    const order = await OrderModel.findById(id);

    if (!order) return next(new CustomError(404, "Order not found"));

    const beforeSnapshot = order.toObject();

    const normalizedStatus = orderStatus ? normalizeOrderStatus(orderStatus) : null;

    if (orderStatus) {
      assertValidTransition(order.orderStatus, normalizedStatus);
    }

    if (normalizedStatus === ORDER_STATUSES.DELIVERED) {
      await consumeReservedInventory(order, { save: false });
    }

    if (normalizedStatus === ORDER_STATUSES.CANCELLED) {
      if (order.inventoryLockedAt) {
        await releaseReservedInventory(order, {
          reason: "admin_cancelled",
          save: false,
        });
      } else {
        const isLegacy = typeof order.inventoryAdjusted === "undefined";
        const shouldRestock = order.inventoryAdjusted === true || isLegacy;
        if (shouldRestock) {
          const bulkOps = order.items.map((item) => ({
            updateOne: {
              filter: { _id: item.product },
              update: { $inc: { stocks: item.quantity } },
            },
          }));

          if (bulkOps.length > 0) {
            await ProductModel.bulkWrite(bulkOps);
          }

          order.inventoryAdjusted = false;
        }
      }
    }

    if (orderStatus) {
      order.orderStatus = normalizedStatus;
    }
    if (paymentStatus) order.paymentStatus = paymentStatus;
    await order.save();

    await recordAuditLog({
      actorId: req.myUser?.id,
      action: "order.update",
      entityType: "Order",
      entityId: order._id,
      before: beforeSnapshot,
      after: order,
      meta: { orderStatus: orderStatus || null, paymentStatus: paymentStatus || null },
      req,
    });

    new ApiResponse(200, "Order updated successfully", order).send(res);
  },
);
