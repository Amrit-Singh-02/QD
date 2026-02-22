import DeliveryAgentModel from "../models/deliveryAgent.model.js";
import OrderModel from "../models/order.model.js";
import CustomError from "../utils/customError.util.js";
import {
  assertValidTransition,
  isTerminalStatus,
  ORDER_STATUSES,
} from "../utils/orderStatus.util.js";
import {
  getActiveAgentSocket,
  getActiveUserSocket,
} from "./presence.service.js";

/* ─── constants ─── */
const ASSIGNMENT_TIMEOUT_MS = 30 * 1000;
const AGENT_LOCK_PREFIX = "agentLock:";
const AGENT_LOCK_TTL_MS = 35 * 1000; // slightly longer than timer
export const ORDER_TIMER_KEY = "orderTimers";
export const ORDER_TIMER_LOCK_PREFIX = "orderTimerLock:";
export const ORDER_TIMER_LOCK_TTL_MS = 10000;

/* scoring weights — lower total score = better agent */
const W_DISTANCE = 0.5;
const W_PERFORMANCE = 0.3;
const W_ACCEPTANCE = 0.1;
const W_FAIRNESS = 0.1;

/* ─── helpers ─── */
const getStores = (app) => ({
  io: app.get("io"),
  redis: app.get("redis"),
  orderTimers: app.get("orderTimers") || {},
});

const parseNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const getStoreLocation = () => {
  const lat = parseNumber(process.env.STORE_LAT);
  const lon = parseNumber(process.env.STORE_LON);
  return lat !== null && lon !== null ? { lat, lon } : null;
};

const getAssignmentRadiusMeters = () => {
  const km = parseNumber(process.env.ASSIGNMENT_RADIUS_KM);
  return km !== null && km > 0 ? km * 1000 : 5000; // default 5km
};

/* ─── haversine distance in km ─── */
const haversineKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/* ─── Redis / in-memory agent lock ─── */
const inMemoryLocks = {};

export const acquireAgentLock = async (agentId, app) => {
  const { redis } = getStores(app);
  const key = `${AGENT_LOCK_PREFIX}${agentId}`;

  if (redis) {
    const result = await redis.set(key, "1", { NX: true, PX: AGENT_LOCK_TTL_MS });
    return !!result;
  }

  // in-memory fallback
  if (inMemoryLocks[key]) return false;
  inMemoryLocks[key] = setTimeout(() => delete inMemoryLocks[key], AGENT_LOCK_TTL_MS);
  return true;
};

export const releaseAgentLock = async (agentId, app) => {
  const { redis } = getStores(app);
  const key = `${AGENT_LOCK_PREFIX}${agentId}`;

  if (redis) {
    await redis.del(key);
    return;
  }

  if (inMemoryLocks[key]) {
    clearTimeout(inMemoryLocks[key]);
    delete inMemoryLocks[key];
  }
};

/* ─── scoring engine ─── */
const scoreAgents = (agents, storeLat, storeLon) => {
  const maxRadiusKm = (getAssignmentRadiusMeters() / 1000) || 5;

  // pre-compute per-agent distances
  const scored = agents.map((agent) => {
    const [agentLon, agentLat] = agent.currentLocation?.coordinates || [0, 0];
    const distKm = haversineKm(storeLat, storeLon, agentLat, agentLon);
    return { agent, distKm };
  });

  // find max values across candidates for normalisation
  const maxAvgTime = Math.max(...scored.map((s) => s.agent.avgDeliveryTimeMs || 0), 1);
  const maxRecent = Math.max(...scored.map((s) => s.agent.recentAssignments || 0), 1);

  return scored
    .map(({ agent, distKm }) => {
      const distanceScore = Math.min(distKm / maxRadiusKm, 1);
      const performanceScore = maxAvgTime > 0 ? (agent.avgDeliveryTimeMs || 0) / maxAvgTime : 0;
      const acceptanceScore = 1 - ((agent.acceptanceRate ?? 100) / 100);
      const fairnessScore = maxRecent > 0 ? (agent.recentAssignments || 0) / maxRecent : 0;

      const totalScore =
        W_DISTANCE * distanceScore +
        W_PERFORMANCE * performanceScore +
        W_ACCEPTANCE * acceptanceScore +
        W_FAIRNESS * fairnessScore;

      return { agent, totalScore, distKm };
    })
    .sort((a, b) => a.totalScore - b.totalScore);
};

/* ─── timer management (unchanged logic, uses Redis sorted-set or in-memory) ─── */
export const clearOrderTimer = async (orderId, app) => {
  const { redis, orderTimers } = getStores(app);
  const key = orderId?.toString?.() || String(orderId);

  if (redis) {
    await redis.zRem(ORDER_TIMER_KEY, key);
    return;
  }

  if (orderTimers[key]) {
    clearTimeout(orderTimers[key]);
    delete orderTimers[key];
  }
};

export const scheduleReassign = async (orderId, app) => {
  const { redis, orderTimers } = getStores(app);
  const key = orderId?.toString?.() || String(orderId);

  if (redis) {
    const dueAt = Date.now() + ASSIGNMENT_TIMEOUT_MS;
    await redis.zRem(ORDER_TIMER_KEY, key);
    await redis.zAdd(ORDER_TIMER_KEY, [{ score: dueAt, value: key }]);
    return;
  }

  if (orderTimers[key]) {
    clearTimeout(orderTimers[key]);
    delete orderTimers[key];
  }

  orderTimers[key] = setTimeout(() => {
    reassignOrder(key, app).catch((err) => {
      console.error("Reassign order failed:", err);
    });
  }, ASSIGNMENT_TIMEOUT_MS);
};

/* ─── build geospatial query ─── */
const buildEligibilityQuery = (order, storeLat, storeLon) => {
  const attempted = order.assignmentAttempts || [];
  const base = {
    isAvailable: true,
    isOnline: true,
    activeOrder: null,
    _id: attempted.length ? { $nin: attempted } : { $exists: true },
  };

  // pincode match as a soft filter alongside geo
  const pincode = order?.shippingAddress?.pincode;
  if (pincode) {
    base.pincode = pincode;
  }

  // geo query from store location
  if (storeLat !== null && storeLon !== null) {
    base.currentLocation = {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [storeLon, storeLat],
        },
        $maxDistance: getAssignmentRadiusMeters(),
      },
    };
  }

  return base;
};

/* ─── main assignment function ─── */
export const assignDeliveryAgent = async (orderOrId, app) => {
  const order =
    typeof orderOrId === "string"
      ? await OrderModel.findById(orderOrId)
      : orderOrId;

  if (!order) throw new CustomError(404, "Order not found");
  if (isTerminalStatus(order.orderStatus)) return null;
  if (order.orderStatus === ORDER_STATUSES.ACCEPTED) return null;

  const store = getStoreLocation();
  const storeLat = store?.lat ?? order?.shippingAddress?.latitude;
  const storeLon = store?.lon ?? order?.shippingAddress?.longitude;

  // 1. Fetch eligible agents (geo-sorted by $near)
  const query = buildEligibilityQuery(order, storeLat, storeLon);
  let agents = await DeliveryAgentModel.find(query).limit(20);

  // fallback: if geo query returns nothing, try without geo (pincode-only or all)
  if (!agents.length) {
    const attempted = order.assignmentAttempts || [];
    const fallback = {
      isAvailable: true,
      isOnline: true,
      activeOrder: null,
      _id: attempted.length ? { $nin: attempted } : { $exists: true },
    };
    const pincode = order?.shippingAddress?.pincode;
    if (pincode) fallback.pincode = pincode;
    agents = await DeliveryAgentModel.find(fallback).limit(20);
  }

  // 2. No agents at all → NO_AGENT_AVAILABLE
  if (!agents.length) {
    return await markNoAgentAvailable(order, app);
  }

  // 3. Score and rank agents
  const effectiveStoreLat = storeLat ?? 0;
  const effectiveStoreLon = storeLon ?? 0;
  const ranked = scoreAgents(agents, effectiveStoreLat, effectiveStoreLon);

  // 4. Try to lock and assign the top-ranked agent
  for (const { agent } of ranked) {
    const locked = await acquireAgentLock(agent._id.toString(), app);
    if (!locked) continue; // agent already locked by another assignment

    // successfully locked — assign this agent
    assertValidTransition(order.orderStatus, ORDER_STATUSES.ASSIGNING);
    order.orderStatus = ORDER_STATUSES.ASSIGNING;
    order.assignmentAttempts = [
      ...(order.assignmentAttempts || []),
      agent._id,
    ];
    await order.save();

    // increment agent's recentAssignments
    agent.recentAssignments = (agent.recentAssignments || 0) + 1;
    await agent.save();

    // send private socket notification to ONLY this agent
    const { io } = getStores(app);
    const socketId = await getActiveAgentSocket(app, agent._id.toString());
    if (io && socketId) {
      io.to(socketId).emit("newOrder", {
        orderId: order._id,
        order: order.toObject(),
      });
    }

    // start 30s acceptance timer
    await scheduleReassign(order._id.toString(), app);
    return agent;
  }

  // all candidates were locked or unavailable
  return await markNoAgentAvailable(order, app);
};

/* ─── mark no agent available ─── */
const markNoAgentAvailable = async (order, app) => {
  const { io } = getStores(app);
  await clearOrderTimer(order._id, app);

  assertValidTransition(order.orderStatus, ORDER_STATUSES.NO_AGENT_AVAILABLE);
  order.orderStatus = ORDER_STATUSES.NO_AGENT_AVAILABLE;
  await order.save();

  const userSocketId = await getActiveUserSocket(app, order.user?.toString());
  if (io && userSocketId) {
    io.to(userSocketId).emit("noAgentAvailable", { orderId: order._id });
  }
  return null;
};

/* ─── reassign (timeout / reject fallback) ─── */
export const reassignOrder = async (orderId, app) => {
  await clearOrderTimer(orderId, app);

  const order = await OrderModel.findById(orderId);
  if (!order) return null;
  if (isTerminalStatus(order.orderStatus)) return null;
  if (order.orderStatus === ORDER_STATUSES.ACCEPTED) return null;

  // release lock for the last attempted agent
  const attempts = order.assignmentAttempts || [];
  if (attempts.length > 0) {
    const lastAgentId = attempts[attempts.length - 1];
    await releaseAgentLock(lastAgentId.toString(), app);
  }

  return await assignDeliveryAgent(order, app);
};

/* ─── accept order ─── */
export const acceptOrder = async (orderId, agentId, app) => {
  const { io } = getStores(app);

  await clearOrderTimer(orderId, app);

  const order = await OrderModel.findById(orderId);
  if (!order) throw new CustomError(404, "Order not found");
  if (order.orderStatus === ORDER_STATUSES.ACCEPTED) return order;

  // validate that only the assigned (last attempted) agent can accept
  const attempts = order.assignmentAttempts || [];
  if (attempts.length > 0) {
    const lastAttempt = attempts[attempts.length - 1];
    if (String(lastAttempt) !== String(agentId)) {
      throw new CustomError(403, "You are not the assigned agent for this order");
    }
  }

  const agent = await DeliveryAgentModel.findById(agentId);
  if (!agent) throw new CustomError(404, "Delivery agent not found");

  assertValidTransition(order.orderStatus, ORDER_STATUSES.ACCEPTED);
  order.orderStatus = ORDER_STATUSES.ACCEPTED;
  order.assignedAgent = agent._id;
  await order.save();

  agent.isAvailable = false;
  agent.activeOrder = order._id;
  await agent.save();

  // release the agent lock
  await releaseAgentLock(agentId.toString(), app);

  const userSocketId = await getActiveUserSocket(app, order.user?.toString());
  if (io && userSocketId) {
    io.to(userSocketId).emit("orderAccepted", {
      orderId: order._id,
      agent: agent.toObject(),
    });
  }

  return order;
};

/* ─── reject order ─── */
export const rejectOrder = async (orderId, agentId, app) => {
  if (!orderId || !agentId) return null;
  await clearOrderTimer(orderId, app);

  const order = await OrderModel.findById(orderId);
  if (!order) return null;
  if (order.orderStatus !== ORDER_STATUSES.ASSIGNING) return null;

  const attempts = order.assignmentAttempts || [];
  if (attempts.length > 0) {
    const lastAttempt = attempts[attempts.length - 1];
    if (String(lastAttempt) !== String(agentId)) return null;
  }

  // release the agent lock
  await releaseAgentLock(agentId.toString(), app);

  // update agent's acceptance rate (they rejected)
  const agent = await DeliveryAgentModel.findById(agentId);
  if (agent) {
    const totalOffers = (agent.totalDeliveries || 0) + 1;
    const currentAccepted = Math.round(((agent.acceptanceRate ?? 100) / 100) * (totalOffers - 1));
    agent.acceptanceRate = Math.round((currentAccepted / totalOffers) * 100);
    await agent.save();
  }

  const alreadyAttempted = attempts.some(
    (attempt) => String(attempt) === String(agentId),
  );
  if (!alreadyAttempted) {
    order.assignmentAttempts = [...attempts, agentId];
    await order.save();
  }

  return await reassignOrder(orderId, app);
};
