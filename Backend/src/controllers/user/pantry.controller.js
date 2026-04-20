import expressAsyncHandler from "express-async-handler";
import ApiResponse from "../../utils/ApiResponse.util.js";
import CustomError from "../../utils/customError.util.js";
import PantryItemModel from "../../models/pantryItem.model.js";
import ProductModel from "../../models/product.model.js";
import OrderModel from "../../models/order.model.js";
import userModel from "../../models/user.model.js";
import { sendPushNotification } from "../../services/fcm.service.js";

export const getPantryItems = expressAsyncHandler(async (req, res, next) => {
  const userId = req.myUser?.id;
  if (!userId) return next(new CustomError(401, "Unauthorized"));

  const items = await PantryItemModel.find({ userId, isActive: true })
    .sort({ expiryDate: 1, createdAt: -1 })
    .populate("productId", "name price images avgShelfLifeDays pantryCategory")
    .lean();

  new ApiResponse(200, "Fetched pantry items successfully", items).send(res);
});

export const getPantryByCategory = expressAsyncHandler(async (req, res, next) => {
  const userId = req.myUser?.id;
  if (!userId) return next(new CustomError(401, "Unauthorized"));
  const category = String(req.query.category || "").trim();
  const filter = { userId, isActive: true };
  if (category) filter.category = category;
  const items = await PantryItemModel.find(filter)
    .sort({ expiryDate: 1, createdAt: -1 })
    .lean();
  new ApiResponse(200, "Fetched pantry items by category", items).send(res);
});

export const getExpiringItems = expressAsyncHandler(async (req, res, next) => {
  const userId = req.myUser?.id;
  if (!userId) return next(new CustomError(401, "Unauthorized"));

  const inDays = Math.max(1, Number(req.query.inDays) || 7);
  const now = new Date();
  const until = new Date(Date.now() + inDays * 24 * 60 * 60 * 1000);

  const items = await PantryItemModel.find({
    userId,
    isActive: true,
    expiryDate: { $ne: null, $gte: now, $lte: until },
  })
    .sort({ expiryDate: 1 })
    .populate("productId", "name price images")
    .lean();

  new ApiResponse(200, "Fetched expiring pantry items", items).send(res);
});

export const addPantryItem = expressAsyncHandler(async (req, res, next) => {
  const userId = req.myUser?.id;
  if (!userId) return next(new CustomError(401, "Unauthorized"));

  const { productId, name, quantity, unit, expiryDate, category } = req.body;
  // Import notification service

  if (!name && !productId) {
    return next(new CustomError(400, "Name or productId is required"));
  }

  let resolvedName = name;
  let resolvedCategory = category || "other";
  let resolvedUnit = unit || "piece";
  let resolvedExpiry = expiryDate || null;

  if (productId) {
    const product = await ProductModel.findById(productId).lean();
    if (!product) return next(new CustomError(404, "Product not found"));
    // Check stock availability
    if (product.stocks !== undefined && product.stocks <= 0) {
      // Create out‑of‑stock notification
      const { createNotification } = await import('../../services/notification.service.js');
      await createNotification(
        userId,
        'out_of_stock',
        `Product "${product.name}" is out of stock`,
        req.app,
      );
      return next(new CustomError(409, 'Product out of stock'));
    }
    resolvedName = resolvedName || product.name;
    resolvedCategory = category || product.pantryCategory || "other";
    resolvedUnit = unit || product.typicalReorderUnit || "piece";
    if (!resolvedExpiry && Number(product.avgShelfLifeDays) > 0) {
      resolvedExpiry = new Date(
        Date.now() + Number(product.avgShelfLifeDays) * 24 * 60 * 60 * 1000,
      );
    }
  }

  const doc = await PantryItemModel.create({
    userId,
    productId: productId || null,
    name: resolvedName,
    quantity: Math.max(0, Number(quantity) || 1),
    unit: resolvedUnit,
    expiryDate: resolvedExpiry,
    category: resolvedCategory,
    addedFrom: "manual",
  });

  new ApiResponse(201, "Pantry item added", doc).send(res);
});

export const addByBarcode = expressAsyncHandler(async (req, res, next) => {
  const userId = req.myUser?.id;
  if (!userId) return next(new CustomError(401, "Unauthorized"));
  const barcode = String(req.body?.barcode || "").trim();
  if (!barcode) return next(new CustomError(400, "Barcode is required"));

  const product = await ProductModel.findOne({
    $or: [{ barcodeVariants: barcode }, { sku: barcode }],
  }).lean();
  if (!product) return next(new CustomError(404, "No product found for barcode"));

  req.body = {
    productId: product._id,
    name: product.name,
    quantity: Number(req.body?.quantity) || 1,
    unit: product.typicalReorderUnit || "piece",
    category: product.pantryCategory || "other",
  };
  return addPantryItem(req, res, next);
});

export const updatePantryItem = expressAsyncHandler(async (req, res, next) => {
  const userId = req.myUser?.id;
  if (!userId) return next(new CustomError(401, "Unauthorized"));
  const { id } = req.params;

  const item = await PantryItemModel.findOne({ _id: id, userId, isActive: true });
  if (!item) return next(new CustomError(404, "Pantry item not found"));

  const updates = ["name", "quantity", "unit", "expiryDate", "category"];
  updates.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      item[field] = req.body[field];
    }
  });
  await item.save();

  new ApiResponse(200, "Pantry item updated", item).send(res);
});

export const markItemUsed = expressAsyncHandler(async (req, res, next) => {
  const userId = req.myUser?.id;
  if (!userId) return next(new CustomError(401, "Unauthorized"));
  const { id } = req.params;
  const decrementBy = Math.max(1, Number(req.body?.quantity) || 1);

  const item = await PantryItemModel.findOne({ _id: id, userId, isActive: true });
  if (!item) return next(new CustomError(404, "Pantry item not found"));

  item.quantity = Math.max(0, Number(item.quantity || 0) - decrementBy);
  if (item.quantity === 0) item.isActive = false;
  await item.save();

  new ApiResponse(200, "Pantry item updated after usage", item).send(res);
});

export const deletePantryItem = expressAsyncHandler(async (req, res, next) => {
  const userId = req.myUser?.id;
  if (!userId) return next(new CustomError(401, "Unauthorized"));
  const { id } = req.params;

  const item = await PantryItemModel.findOne({ _id: id, userId, isActive: true });
  if (!item) return next(new CustomError(404, "Pantry item not found"));
  item.isActive = false;
  await item.save();

  new ApiResponse(200, "Pantry item removed", item).send(res);
});

export const importFromOrder = expressAsyncHandler(async (req, res, next) => {
  const userId = req.myUser?.id;
  if (!userId) return next(new CustomError(401, "Unauthorized"));
  const { orderId } = req.params;

  const order = await OrderModel.findById(orderId).populate("items.product");
  if (!order) return next(new CustomError(404, "Order not found"));
  if (String(order.user) !== String(userId)) {
    return next(new CustomError(403, "You are not allowed to import this order"));
  }
  if (order.orderStatus !== "DELIVERED") {
    return next(new CustomError(400, "Only delivered orders can be imported"));
  }

  const pantryOps = order.items.map((item) => {
    const product = item.product;
    const shelfLifeDays = Number(product?.avgShelfLifeDays) || null;
    const expiryDate = shelfLifeDays
      ? new Date(Date.now() + shelfLifeDays * 24 * 60 * 60 * 1000)
      : null;

    return {
      updateOne: {
        filter: {
          userId,
          productId: product?._id || null,
          isActive: true,
        },
        update: {
          $inc: { quantity: Number(item.quantity) || 0 },
          $set: {
            expiryDate,
            addedFrom: "order_import",
            orderId: order._id,
            category: product?.pantryCategory || "other",
          },
          $setOnInsert: {
            name: product?.name || item.name || "Item",
            unit: product?.typicalReorderUnit || "piece",
          },
        },
        upsert: true,
      },
    };
  });

  if (pantryOps.length > 0) {
    await PantryItemModel.bulkWrite(pantryOps);
  }

  const user = await userModel.findById(userId).select("fcmToken").lean();
  await sendPushNotification(user?.fcmToken, {
    title: "Pantry updated",
    body: "Your delivered order was added to your pantry.",
    data: { type: "pantry_order_import", orderId: String(order._id) },
  });

  new ApiResponse(200, "Order imported into pantry", {
    importedItems: pantryOps.length,
  }).send(res);
});

export const getWasteReport = expressAsyncHandler(async (req, res, next) => {
  const userId = req.myUser?.id;
  if (!userId) return next(new CustomError(401, "Unauthorized"));
  const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const expired = await PantryItemModel.find({
    userId,
    isActive: false,
    expiryDate: { $lt: new Date() },
    updatedAt: { $gte: start },
  }).lean();
  const byCategory = expired.reduce((acc, item) => {
    const key = item.category || "other";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  new ApiResponse(200, "Fetched waste report", {
    totalExpiredItems: expired.length,
    byCategory,
  }).send(res);
});
