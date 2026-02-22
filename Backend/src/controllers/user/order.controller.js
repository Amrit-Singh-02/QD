import expressAsyncHandler from "express-async-handler";
import ApiResponse from "../../utils/ApiResponse.util.js";
import CustomError from "../../utils/customError.util.js";
import OrderModel from "../../models/order.model.js";
import CartModel from "../../models/cart.model.js";
import ProductModel from "../../models/product.model.js";
import AddressModel from "../../models/address.model.js";
import DeliveryAgentModel from "../../models/deliveryAgent.model.js";
import {
  assignDeliveryAgent,
  clearOrderTimer,
  releaseAgentLock,
} from "../../services/orderAssignment.service.js";
import {
  assertValidTransition,
  ORDER_STATUSES,
} from "../../utils/orderStatus.util.js";
import { getActiveAgentSocket } from "../../services/presence.service.js";

const buildShippingAddress = (address, fallbackCoords = null) => {
  const fallbackLat = fallbackCoords?.lat;
  const fallbackLng = fallbackCoords?.lng;
  const latitude =
    typeof address.latitude === "number"
      ? address.latitude
      : typeof address.lat === "number"
        ? address.lat
        : typeof fallbackLat === "number"
          ? fallbackLat
          : undefined;
  const longitude =
    typeof address.longitude === "number"
      ? address.longitude
      : typeof address.lon === "number"
        ? address.lon
        : typeof fallbackLng === "number"
          ? fallbackLng
          : undefined;

  return {
    fullName: address.fullName,
    phone: address.phone,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2 || "",
    city: address.city,
    state: address.state,
    postalCode: address.postalCode || address.pincode || "",
    pincode: address.pincode || address.postalCode || "",
    latitude,
    longitude,
    country: address.country,
    landmark: address.landmark || "",
  };
};


export const createOrderFromCart = expressAsyncHandler(
  async (req, res, next) => {
    const userId = req.myUser?.id;
    if (!userId) return next(new CustomError(401, "Unauthorized"));

    const { addressId, paymentMethod, notes, locationCoords } = req.body;
    if (!addressId) {
      return next(new CustomError(400, "Address id is required"));
    }

    const address = await AddressModel.findOne({ _id: addressId, user: userId });
    if (!address) return next(new CustomError(404, "Address not found"));

    const cartItems = await CartModel.find({ userId }).populate("productId");
    if (!cartItems || cartItems.length === 0) {
      return next(new CustomError(404, "Cart is empty"));
    }

    const items = [];
    let subtotal = 0;
    let totalQuantity = 0;

    for (const cartItem of cartItems) {
      const product = cartItem.productId;
      if (!product) return next(new CustomError(404, "Product not found"));

      const quantity = cartItem.quantity;
      if (product.stocks < quantity) {
        return next(
          new CustomError(400, `Insufficient stock for ${product.name}`),
        );
      }

      const price = product.price;
      const lineSubtotal = price * quantity;

      items.push({
        product: product._id,
        name: product.name,
        price,
        quantity,
        subtotal: lineSubtotal,
      });

      subtotal += lineSubtotal;
      totalQuantity += quantity;
    }

    const order = await OrderModel.create({
      user: userId,
      items,
      shippingAddress: buildShippingAddress(address, locationCoords),
      paymentMethod,
      notes,
      subtotal,
      totalQuantity,
      totalAmount: subtotal,
    });

    if (!order) return next(new CustomError(400, "Order creation failed"));

    assertValidTransition(order.orderStatus, ORDER_STATUSES.ASSIGNING);
    order.orderStatus = ORDER_STATUSES.ASSIGNING;
    await order.save();

    await assignDeliveryAgent(order, req.app);

    await CartModel.deleteMany({ userId });

    new ApiResponse(201, "Order placed successfully", order).send(res);
  },
);

export const getMyOrders = expressAsyncHandler(async (req, res, next) => {
  const userId = req.myUser?.id;
  if (!userId) return next(new CustomError(401, "Unauthorized"));

  const pageNum = Math.max(1, Number(req.query.page) || 1);
  const limitNum = Math.max(1, Math.min(50, Number(req.query.limit) || 10));
  const skip = (pageNum - 1) * limitNum;

  const [orders, total] = await Promise.all([
    OrderModel.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .select("-__v")
      .populate("items.product")
      .populate("assignedAgent", "name phone pincode currentLocation")
      .lean({ virtuals: true }),
    OrderModel.countDocuments({ user: userId }),
  ]);

  if (!total) {
    return next(new CustomError(404, "No orders found"));
  }

  const totalPages = Math.max(Math.ceil(total / limitNum), 1);
  const meta = {
    page: pageNum,
    limit: limitNum,
    totalItems: total,
    totalPages,
    hasNext: pageNum < totalPages,
    hasPrev: pageNum > 1,
  };

  new ApiResponse(200, "Fetched orders successfully", orders, meta).send(res);
});

export const getMyOrderById = expressAsyncHandler(async (req, res, next) => {
  const userId = req.myUser?.id;
  if (!userId) return next(new CustomError(401, "Unauthorized"));

  const { id } = req.params;
  if (!id) return next(new CustomError(400, "Order id is required"));

  const order = await OrderModel.findOne({ _id: id, user: userId })
    .select("-__v")
    .populate("items.product")
    .populate("assignedAgent", "name phone pincode currentLocation")
    .lean({ virtuals: true });

  if (!order) return next(new CustomError(404, "Order not found"));

  new ApiResponse(200, "Fetched order successfully", order).send(res);
});

export const cancelMyOrder = expressAsyncHandler(async (req, res, next) => {
  const userId = req.myUser?.id;
  if (!userId) return next(new CustomError(401, "Unauthorized"));

  const { id } = req.params;
  if (!id) return next(new CustomError(400, "Order id is required"));

  const order = await OrderModel.findOne({ _id: id, user: userId });
  if (!order) return next(new CustomError(404, "Order not found"));

  if (
    order.orderStatus === ORDER_STATUSES.CANCELLED ||
    order.orderStatus === ORDER_STATUSES.NO_AGENT_AVAILABLE
  ) {
    return next(new CustomError(400, "Order cannot be cancelled"));
  }

  if (
    [
      ORDER_STATUSES.PICKED_UP,
      ORDER_STATUSES.OUT_FOR_DELIVERY,
      ORDER_STATUSES.DELIVERED,
      ORDER_STATUSES.NO_AGENT_AVAILABLE,
    ].includes(order.orderStatus)
  ) {
    return next(
      new CustomError(400, "Order cannot be cancelled at this stage"),
    );
  }

  assertValidTransition(order.orderStatus, ORDER_STATUSES.CANCELLED);
  order.orderStatus = ORDER_STATUSES.CANCELLED;
  const assignedAgentId = order.assignedAgent;
  if (assignedAgentId) {
    order.cancelledByAgent = assignedAgentId;
  }
  order.assignedAgent = null;
  const isLegacy = typeof order.inventoryAdjusted === "undefined";
  const shouldRestock = order.inventoryAdjusted === true || isLegacy;
  if (shouldRestock) {
    order.inventoryAdjusted = false;
  }
  await order.save();

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
  }

  await clearOrderTimer(order._id, req.app);

  // release agent lock if order was being assigned
  if (order.orderStatus === ORDER_STATUSES.ASSIGNING) {
    const attempts = order.assignmentAttempts || [];
    if (attempts.length > 0) {
      await releaseAgentLock(attempts[attempts.length - 1].toString(), req.app);
    }
  }

  if (assignedAgentId) {
    const agent = await DeliveryAgentModel.findById(assignedAgentId);
    if (agent) {
      agent.isAvailable = true;
      agent.activeOrder = null;
      await agent.save();
    }

    const io = req.app.get("io");
    const agentSocketId = await getActiveAgentSocket(
      req.app,
      assignedAgentId.toString(),
    );
    if (io && agentSocketId) {
      io.to(agentSocketId).emit("orderCancelled", {
        orderId: order._id,
        status: order.orderStatus,
      });
    }
  }

  new ApiResponse(200, "Order cancelled successfully", order).send(res);
});

export const retryAssignOrder = expressAsyncHandler(async (req, res, next) => {
  const userId = req.myUser?.id;
  if (!userId) return next(new CustomError(401, "Unauthorized"));

  const { id } = req.params;
  if (!id) return next(new CustomError(400, "Order id is required"));

  const order = await OrderModel.findOne({ _id: id, user: userId });
  if (!order) return next(new CustomError(404, "Order not found"));

  if (order.orderStatus !== ORDER_STATUSES.NO_AGENT_AVAILABLE) {
    return next(new CustomError(400, "Order is not eligible for reassignment"));
  }

  const orderAgeMs = Date.now() - new Date(order.createdAt).getTime();
  if (orderAgeMs > 2 * 60 * 60 * 1000) {
    return next(
      new CustomError(
        400,
        "Try again order by adding item in cart",
      ),
    );
  }

  order.assignmentAttempts = [];
  assertValidTransition(order.orderStatus, ORDER_STATUSES.ASSIGNING);
  order.orderStatus = ORDER_STATUSES.ASSIGNING;
  await order.save();

  await assignDeliveryAgent(order, req.app);

  new ApiResponse(200, "Reassigning delivery agent", order).send(res);
});
