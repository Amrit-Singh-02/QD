import ProductModel from "../models/product.model.js";
import CustomError from "../utils/customError.util.js";

const normalizeQuantity = (value) => {
  const qty = Number(value);
  return Number.isFinite(qty) ? qty : 0;
};

const normalizeProductId = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value._id) return value._id.toString();
  if (value.id) return value.id.toString();
  return value.toString?.() || null;
};

const aggregateItems = (items = []) => {
  const map = new Map();
  items.forEach((item) => {
    const productId = normalizeProductId(
      item?.product || item?.productId || item?.product?.id,
    );
    if (!productId) return;
    const quantity = normalizeQuantity(item?.quantity);
    if (quantity <= 0) return;
    const entry = map.get(productId) || {
      productId,
      quantity: 0,
      name: item?.name,
    };
    entry.quantity += quantity;
    if (!entry.name && item?.name) entry.name = item.name;
    map.set(productId, entry);
  });
  return Array.from(map.values());
};

export const getAvailableStock = (product) => {
  const stocks = normalizeQuantity(product?.stocks);
  const reserved = normalizeQuantity(product?.reserved);
  return stocks - reserved;
};

export const getInventoryLockExpiry = () => {
  const ttlMinutes = Number(process.env.INVENTORY_LOCK_TTL_MINUTES || 15);
  const safeMinutes = Number.isFinite(ttlMinutes) && ttlMinutes > 0 ? ttlMinutes : 15;
  return new Date(Date.now() + safeMinutes * 60 * 1000);
};

export const rollbackInventoryReservations = async (reservedItems = []) => {
  if (!reservedItems.length) return;
  const ops = reservedItems.map((item) => ({
    updateOne: {
      filter: { _id: item.productId },
      update: { $inc: { reserved: -item.quantity } },
    },
  }));
  await ProductModel.bulkWrite(ops, { ordered: false });
};

export const reserveInventoryForItems = async (items = []) => {
  const aggregated = aggregateItems(items);
  if (!aggregated.length) {
    throw new CustomError(400, "No items found to reserve inventory");
  }

  const reservedItems = [];
  try {
    for (const item of aggregated) {
      const updated = await ProductModel.findOneAndUpdate(
        {
          _id: item.productId,
          $expr: {
            $gte: [
              { $subtract: ["$stocks", { $ifNull: ["$reserved", 0] }] },
              item.quantity,
            ],
          },
        },
        { $inc: { reserved: item.quantity } },
        { new: true },
      );
      if (!updated) {
        throw new CustomError(
          400,
          `Insufficient stock for ${item.name || "product"}`,
        );
      }
      reservedItems.push({ productId: item.productId, quantity: item.quantity });
    }
  } catch (err) {
    await rollbackInventoryReservations(reservedItems);
    throw err;
  }

  return reservedItems;
};

export const releaseReservedInventory = async (
  order,
  { reason = "released", save = true } = {},
) => {
  if (!order?.inventoryLockedAt) return false;
  if (order.inventoryReleasedAt) return false;
  if (order.inventoryAdjusted) return false;

  const aggregated = aggregateItems(order.items);
  if (!aggregated.length) return false;

  const ops = aggregated.map((item) => ({
    updateOne: {
      filter: { _id: item.productId },
      update: { $inc: { reserved: -item.quantity } },
    },
  }));

  await ProductModel.bulkWrite(ops, { ordered: false });
  order.inventoryReleasedAt = new Date();
  order.inventoryReleaseReason = reason;
  if (save) {
    await order.save();
  }
  return true;
};

export const consumeReservedInventory = async (
  order,
  { save = true } = {},
) => {
  if (!order) return false;
  if (order.inventoryAdjusted === true) return false;

  const aggregated = aggregateItems(order.items);
  if (!aggregated.length) return false;

  const usesReservation = Boolean(order.inventoryLockedAt);
  const ops = aggregated.map((item) => ({
    updateOne: {
      filter: { _id: item.productId },
      update: {
        $inc: {
          stocks: -item.quantity,
          ...(usesReservation ? { reserved: -item.quantity } : {}),
        },
      },
    },
  }));

  await ProductModel.bulkWrite(ops, { ordered: false });

  order.inventoryAdjusted = true;
  if (usesReservation && !order.inventoryReleasedAt) {
    order.inventoryReleasedAt = new Date();
    order.inventoryReleaseReason = "consumed";
  }
  order.inventoryLockExpiresAt = null;

  if (save) {
    await order.save();
  }
  return true;
};
