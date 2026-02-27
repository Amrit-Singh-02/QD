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
  capturePayPalOrder,
  createPayPalOrder,
  getPayPalClientId,
  getPayPalCurrency,
  getPayPalUsdRate,
  convertInrToUsd,
} from "../../services/paypal.service.js";
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

const normalizePaymentMethod = (value) =>
  String(value || "cod").trim().toLowerCase();

const buildOrderDraftFromCart = async ({
  userId,
  addressId,
  locationCoords,
}) => {
  if (!addressId) {
    throw new CustomError(400, "Address id is required");
  }

  const address = await AddressModel.findOne({ _id: addressId, user: userId });
  if (!address) {
    throw new CustomError(404, "Address not found");
  }

  const cartItems = await CartModel.find({ userId }).populate("productId");
  if (!cartItems || cartItems.length === 0) {
    throw new CustomError(404, "Cart is empty");
  }

  const items = [];
  let subtotal = 0;
  let totalQuantity = 0;

  for (const cartItem of cartItems) {
    const product = cartItem.productId;
    if (!product) {
      throw new CustomError(404, "Product not found");
    }

    const quantity = cartItem.quantity;
    if (product.stocks < quantity) {
      throw new CustomError(
        400,
        `Insufficient stock for ${product.name}`,
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

  return {
    items,
    shippingAddress: buildShippingAddress(address, locationCoords),
    subtotal,
    totalQuantity,
    totalAmount: subtotal,
  };
};


export const createOrderFromCart = expressAsyncHandler(
  async (req, res, next) => {
    const userId = req.myUser?.id;
    if (!userId) return next(new CustomError(401, "Unauthorized"));

    const { addressId, paymentMethod, notes, locationCoords } = req.body;
    const normalizedPayment = normalizePaymentMethod(paymentMethod);
    if (normalizedPayment !== "cod") {
      return next(
        new CustomError(
          400,
          "Online payments are handled via PayPal checkout.",
        ),
      );
    }

    const { items, shippingAddress, subtotal, totalQuantity, totalAmount } =
      await buildOrderDraftFromCart({
        userId,
        addressId,
        locationCoords,
      });

    const order = await OrderModel.create({
      user: userId,
      items,
      shippingAddress,
      paymentMethod: normalizedPayment,
      notes,
      subtotal,
      totalQuantity,
      totalAmount,
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

export const getPaypalClientConfig = expressAsyncHandler(
  async (req, res) => {
    const clientId = getPayPalClientId();
    const currency = getPayPalCurrency();
    new ApiResponse(200, "Fetched PayPal client config", {
      clientId,
      currency,
    }).send(res);
  },
);

export const createPaypalOrderFromCart = expressAsyncHandler(
  async (req, res, next) => {
    const userId = req.myUser?.id;
    if (!userId) return next(new CustomError(401, "Unauthorized"));

    const { addressId, notes, locationCoords } = req.body;

    const { items, shippingAddress, subtotal, totalQuantity, totalAmount } =
      await buildOrderDraftFromCart({
        userId,
        addressId,
        locationCoords,
      });

    const order = await OrderModel.create({
      user: userId,
      items,
      shippingAddress,
      paymentMethod: "paypal",
      paymentStatus: "pending",
      paymentDetails: {
        provider: "paypal",
      },
      notes,
      subtotal,
      totalQuantity,
      totalAmount,
    });

    if (!order) return next(new CustomError(400, "Order creation failed"));

    try {
      const currency = getPayPalCurrency();
      const usdRate = getPayPalUsdRate();
      const amountCharged =
        currency === "USD"
          ? convertInrToUsd(totalAmount, usdRate)
          : Number(totalAmount);
      const paypalOrder = await createPayPalOrder({
        amount: amountCharged,
        currency,
        referenceId: order._id.toString(),
      });

      order.paymentDetails = {
        ...(order.paymentDetails || {}),
        orderId: paypalOrder.id,
        status: paypalOrder.status,
        amountOriginal: totalAmount,
        currencyOriginal: "INR",
        amountCharged,
        currencyCharged: currency,
        exchangeRate: currency === "USD" ? usdRate : null,
        provider: "paypal",
      };
      await order.save();

      new ApiResponse(201, "PayPal order created", {
        orderId: order._id,
        paypalOrderId: paypalOrder.id,
      }).send(res);
    } catch (error) {
      await OrderModel.findByIdAndDelete(order._id);
      throw error;
    }
  },
);

export const capturePaypalOrderPayment = expressAsyncHandler(
  async (req, res, next) => {
    const userId = req.myUser?.id;
    if (!userId) return next(new CustomError(401, "Unauthorized"));

    const { orderId, paypalOrderId } = req.body;
    if (!orderId || !paypalOrderId) {
      return next(
        new CustomError(400, "Order id and PayPal order id are required"),
      );
    }

    const order = await OrderModel.findOne({ _id: orderId, user: userId });
    if (!order) return next(new CustomError(404, "Order not found"));

    if (order.paymentMethod !== "paypal") {
      return next(new CustomError(400, "Order is not a PayPal payment"));
    }

    if (
      [ORDER_STATUSES.CANCELLED, ORDER_STATUSES.DELIVERED].includes(
        order.orderStatus,
      )
    ) {
      return next(new CustomError(400, "Order cannot be paid at this stage"));
    }

    const normalizedPaymentStatus = String(order.paymentStatus || "").toLowerCase();
    if (["successful", "paid"].includes(normalizedPaymentStatus)) {
      return new ApiResponse(200, "Payment already captured", order).send(res);
    }

    if (
      order.paymentDetails?.orderId &&
      order.paymentDetails.orderId !== paypalOrderId
    ) {
      return next(new CustomError(400, "PayPal order id mismatch"));
    }

    const capture = await capturePayPalOrder(paypalOrderId);
    const purchaseUnit = capture?.purchase_units?.[0];
    const amountValue = purchaseUnit?.amount?.value;
    const currencyCode = purchaseUnit?.amount?.currency_code;
    const referenceId = purchaseUnit?.reference_id;
    const captureStatus = capture?.status;
    const captureId =
      purchaseUnit?.payments?.captures?.[0]?.id ||
      capture?.purchase_units?.[0]?.payments?.captures?.[0]?.id;
    const payerId = capture?.payer?.payer_id;
    const payerEmail = capture?.payer?.email_address;

    const expectedAmount = Number(order.totalAmount).toFixed(2);
    const receivedAmount = Number(amountValue).toFixed(2);
    const expectedCurrency =
      order.paymentDetails?.currencyCharged || getPayPalCurrency();
    const expectedCharged =
      typeof order.paymentDetails?.amountCharged === "number"
        ? Number(order.paymentDetails.amountCharged).toFixed(2)
        : null;
    let expectedValue = expectedCharged ?? expectedAmount;
    if (!expectedCharged && expectedCurrency === "USD") {
      const usdRate = getPayPalUsdRate();
      expectedValue = Number(convertInrToUsd(order.totalAmount, usdRate)).toFixed(2);
    }

    if (!Number.isFinite(Number(amountValue))) {
      return next(new CustomError(400, "Invalid PayPal capture amount"));
    }

    if (currencyCode && currencyCode !== expectedCurrency) {
      return next(
        new CustomError(
          400,
          `PayPal currency mismatch (expected ${expectedCurrency}, got ${currencyCode})`,
        ),
      );
    }

    if (referenceId && String(referenceId) !== String(order._id)) {
      return next(new CustomError(400, "PayPal reference id mismatch"));
    }

    if (receivedAmount !== expectedValue) {
      return next(
        new CustomError(
          400,
          `PayPal amount mismatch (expected ${expectedValue}, got ${receivedAmount})`,
        ),
      );
    }

    if (captureStatus !== "COMPLETED") {
      order.paymentStatus = "failed";
      order.paymentDetails = {
        ...(order.paymentDetails || {}),
        orderId: paypalOrderId,
        captureId,
        payerId,
        email: payerEmail,
        status: captureStatus || "FAILED",
        provider: "paypal",
      };
      await order.save();
      return next(new CustomError(400, "PayPal payment not completed"));
    }

    order.paymentStatus = "successful";
    order.paymentDetails = {
      ...(order.paymentDetails || {}),
      orderId: paypalOrderId,
      captureId,
      payerId,
      email: payerEmail,
      status: captureStatus,
      provider: "paypal",
    };
    await order.save();

    await CartModel.deleteMany({ userId });

    let responseOrder = order;
    if (order.orderStatus === ORDER_STATUSES.PLACED) {
      await assignDeliveryAgent(order._id.toString(), req.app);
      responseOrder = await OrderModel.findById(order._id);
    }

    new ApiResponse(200, "Payment captured successfully", responseOrder).send(res);
  },
);
