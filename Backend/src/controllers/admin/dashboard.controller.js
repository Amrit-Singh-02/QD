import expressAsyncHandler from "express-async-handler";
import OrderModel from "../../models/order.model.js";
import userModel from "../../models/user.model.js";
import ProductModel from "../../models/product.model.js";
import DeliveryAgentModel from "../../models/deliveryAgent.model.js";
import HelpTicketModel from "../../models/helpTicket.model.js";
import ApiResponse from "../../utils/ApiResponse.util.js";

export const getDashboard = expressAsyncHandler(async (req, res) => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // --- Users ---
  const [totalUsers, verifiedUsers, adminUsers] = await Promise.all([
    userModel.countDocuments(),
    userModel.countDocuments({ isVerified: true }),
    userModel.countDocuments({ role: "admin" }),
  ]);
  const newUsersThisMonth = await userModel.countDocuments({
    createdAt: { $gte: startOfMonth },
  });

  // --- Products ---
  const [totalProducts, outOfStock, lowStock] = await Promise.all([
    ProductModel.countDocuments(),
    ProductModel.countDocuments({ stocks: 0 }),
    ProductModel.countDocuments({ stocks: { $gt: 0, $lte: 10 } }),
  ]);
  const categoryDistribution = await ProductModel.aggregate([
    { $unwind: "$category" },
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // --- Orders ---
  const ordersByStatus = await OrderModel.aggregate([
    { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
  ]);

  const revenueAgg = await OrderModel.aggregate([
    { $match: { orderStatus: "DELIVERED" } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totalAmount" },
        totalOrders: { $sum: 1 },
        avgOrderValue: { $avg: "$totalAmount" },
      },
    },
  ]);

  const todayRevenue = await OrderModel.aggregate([
    {
      $match: {
        orderStatus: "DELIVERED",
        updatedAt: { $gte: startOfDay },
      },
    },
    { $group: { _id: null, revenue: { $sum: "$totalAmount" } } },
  ]);

  const weeklyRevenue = await OrderModel.aggregate([
    {
      $match: {
        orderStatus: "DELIVERED",
        updatedAt: { $gte: startOfWeek },
      },
    },
    { $group: { _id: null, revenue: { $sum: "$totalAmount" } } },
  ]);

  const monthlyRevenue = await OrderModel.aggregate([
    {
      $match: {
        orderStatus: "DELIVERED",
        updatedAt: { $gte: startOfMonth },
      },
    },
    { $group: { _id: null, revenue: { $sum: "$totalAmount" } } },
  ]);

  // Revenue trend (last 30 days, grouped by day)
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const revenueTrend = await OrderModel.aggregate([
    {
      $match: {
        orderStatus: "DELIVERED",
        updatedAt: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" },
        },
        revenue: { $sum: "$totalAmount" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Top selling products
  const topProducts = await OrderModel.aggregate([
    { $match: { orderStatus: "DELIVERED" } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.product",
        name: { $first: "$items.name" },
        totalSold: { $sum: "$items.quantity" },
        totalRevenue: { $sum: "$items.subtotal" },
      },
    },
    { $sort: { totalSold: -1 } },
    { $limit: 10 },
  ]);

  // Cancellation rate
  const totalOrderCount = await OrderModel.countDocuments();
  const cancelledCount = await OrderModel.countDocuments({
    orderStatus: "CANCELLED",
  });
  const cancellationRate =
    totalOrderCount > 0
      ? Math.round((cancelledCount / totalOrderCount) * 100 * 10) / 10
      : 0;

  // --- Delivery Agents ---
  const [totalAgents, onlineAgents] = await Promise.all([
    DeliveryAgentModel.countDocuments(),
    DeliveryAgentModel.countDocuments({ isOnline: true }),
  ]);

  const topAgents = await DeliveryAgentModel.find()
    .sort({ totalDeliveries: -1, rating: -1 })
    .limit(10)
    .select(
      "name phone totalDeliveries rating acceptanceRate avgDeliveryTimeMs isOnline profileImage",
    );

  const lowestAgents = await DeliveryAgentModel.find({
    totalDeliveries: { $gt: 0 },
  })
    .sort({ acceptanceRate: 1 })
    .limit(5)
    .select(
      "name phone totalDeliveries rating acceptanceRate avgDeliveryTimeMs isOnline",
    );

  // --- Zone/Area analytics ---
  const ordersByZone = await OrderModel.aggregate([
    {
      $group: {
        _id: "$shippingAddress.postalCode",
        orders: { $sum: 1 },
        revenue: {
          $sum: {
            $cond: [{ $eq: ["$orderStatus", "DELIVERED"] }, "$totalAmount", 0],
          },
        },
      },
    },
    { $sort: { orders: -1 } },
    { $limit: 15 },
  ]);

  // --- Help Tickets ---
  const ticketsByStatus = await HelpTicketModel.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const rev = revenueAgg[0] || {};

  const dashboard = {
    users: {
      total: totalUsers,
      verified: verifiedUsers,
      admins: adminUsers,
      newThisMonth: newUsersThisMonth,
    },
    products: {
      total: totalProducts,
      active: totalProducts - outOfStock,
      outOfStock,
      lowStock,
      categoryDistribution,
    },
    orders: {
      byStatus: ordersByStatus,
      totalRevenue: rev.totalRevenue || 0,
      totalDelivered: rev.totalOrders || 0,
      avgOrderValue: Math.round((rev.avgOrderValue || 0) * 100) / 100,
      todayRevenue: todayRevenue[0]?.revenue || 0,
      weeklyRevenue: weeklyRevenue[0]?.revenue || 0,
      monthlyRevenue: monthlyRevenue[0]?.revenue || 0,
      cancellationRate,
      revenueTrend,
      topProducts,
    },
    agents: {
      total: totalAgents,
      online: onlineAgents,
      offline: totalAgents - onlineAgents,
      topAgents,
      lowestAgents,
    },
    zones: ordersByZone,
    tickets: ticketsByStatus,
  };

  new ApiResponse(200, "Dashboard analytics", dashboard).send(res);
});
