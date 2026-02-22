import app from "./app.js";
import { connectDB } from "./src/config/database.config.js";
import http from "http";
import { Server } from "socket.io";
import {
  acceptOrder,
  assignDeliveryAgent,
  clearOrderTimer,
  ORDER_TIMER_KEY,
  ORDER_TIMER_LOCK_PREFIX,
  ORDER_TIMER_LOCK_TTL_MS,
  rejectOrder,
  reassignOrder,
  releaseAgentLock,
} from "./src/services/orderAssignment.service.js";
import DeliveryAgentModel from "./src/models/deliveryAgent.model.js";
import OrderModel from "./src/models/order.model.js";
import { ORDER_STATUSES } from "./src/utils/orderStatus.util.js";
import { connectRedis } from "./src/config/redis.config.js";
import {
  getActiveAgentSocket,
  getActiveUserSocket,
  removeActiveAgent,
  removeActiveUser,
  setActiveAgent,
  setActiveUser,
} from "./src/services/presence.service.js";

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

const activeAgents = {};
const activeUsers = {};
const orderTimers = {};
const agentDisconnectTimers = {};
const agentLocationCache = new Map();
const userLocationCache = new Map();
const dirtyAgentLocations = new Set();
const dirtyUserLocations = new Set();
const lastAgentEmitAt = new Map();
const lastUserEmitAt = new Map();

app.set("io", io);
app.set("activeAgents", activeAgents);
app.set("activeUsers", activeUsers);
app.set("orderTimers", orderTimers);
app.set("agentDisconnectTimers", agentDisconnectTimers);

const AGENT_DISCONNECT_GRACE_MS = 15000;
const LOCATION_TTL_SEC = Number(process.env.LOCATION_TTL_SEC || 120);
const LOCATION_FLUSH_INTERVAL_MS = Number(
  process.env.LOCATION_FLUSH_INTERVAL_MS || 5000,
);
const LOCATION_FLUSH_BATCH = Number(process.env.LOCATION_FLUSH_BATCH || 100);
const LOCATION_EMIT_THROTTLE_MS = Number(
  process.env.LOCATION_EMIT_THROTTLE_MS || 1000,
);
const AGENT_LOC_KEY_PREFIX = "agentLoc:";
const USER_LOC_KEY_PREFIX = "userLoc:";
const AGENT_LOC_DIRTY_SET = "dirty:agentLoc";
const USER_LOC_DIRTY_SET = "dirty:userLoc";

const shouldEmit = (cache, key, throttleMs) => {
  const now = Date.now();
  const last = cache.get(key) || 0;
  if (now - last < throttleMs) return false;
  cache.set(key, now);
  return true;
};

let redis = null;
try {
  redis = await connectRedis();
  app.set("redis", redis);
} catch (err) {
  console.error("Redis connection failed. Falling back to in-memory stores.");
}

const startOrderTimerPoller = (appRef) => {
  const redisClient = appRef.get("redis");
  if (!redisClient) return;

  const poll = async () => {
    try {
      const now = Date.now();
      const dueOrders = await redisClient.zRangeByScore(
        ORDER_TIMER_KEY,
        0,
        now,
        { LIMIT: { offset: 0, count: 50 } },
      );
      if (!dueOrders.length) return;

      for (const orderId of dueOrders) {
        const lockKey = `${ORDER_TIMER_LOCK_PREFIX}${orderId}`;
        const locked = await redisClient.set(lockKey, "1", {
          NX: true,
          PX: ORDER_TIMER_LOCK_TTL_MS,
        });
        if (!locked) continue;

        await redisClient.zRem(ORDER_TIMER_KEY, orderId);
        await reassignOrder(orderId, appRef);
      }
    } catch (err) {
      console.error("Order timer poller failed:", err);
    }
  };

  poll();
  setInterval(poll, 2000);
};

const getDirtyBatch = async (redisClient, key) => {
  const batch = await redisClient.sRandMember(key, LOCATION_FLUSH_BATCH);
  if (!batch) return [];
  return Array.isArray(batch) ? batch : [batch];
};

const setCachedAgentLocation = async (appRef, agentId, latitude, longitude) => {
  const redisClient = appRef.get("redis");
  const payload = JSON.stringify({
    latitude,
    longitude,
    updatedAt: Date.now(),
  });

  if (redisClient) {
    const key = `${AGENT_LOC_KEY_PREFIX}${agentId}`;
    await redisClient.set(key, payload, { EX: LOCATION_TTL_SEC });
    await redisClient.sAdd(AGENT_LOC_DIRTY_SET, agentId);
    return;
  }

  agentLocationCache.set(agentId, {
    latitude,
    longitude,
    updatedAt: Date.now(),
  });
  dirtyAgentLocations.add(agentId);
};

const setCachedUserLocation = async (
  appRef,
  orderId,
  userId,
  latitude,
  longitude,
) => {
  const redisClient = appRef.get("redis");
  const payload = JSON.stringify({
    orderId,
    userId,
    latitude,
    longitude,
    updatedAt: Date.now(),
  });

  if (redisClient) {
    const key = `${USER_LOC_KEY_PREFIX}${orderId}`;
    await redisClient.set(key, payload, { EX: LOCATION_TTL_SEC });
    await redisClient.sAdd(USER_LOC_DIRTY_SET, orderId);
    return;
  }

  userLocationCache.set(orderId, {
    orderId,
    userId,
    latitude,
    longitude,
    updatedAt: Date.now(),
  });
  dirtyUserLocations.add(orderId);
};

const flushAgentLocations = async (appRef) => {
  const redisClient = appRef.get("redis");
  if (redisClient) {
    const batch = await getDirtyBatch(redisClient, AGENT_LOC_DIRTY_SET);
    if (!batch.length) return;

    const multi = redisClient.multi();
    batch.forEach((agentId) => {
      multi.get(`${AGENT_LOC_KEY_PREFIX}${agentId}`);
    });
    const results = await multi.exec();

    const ops = [];
    const removeIds = [];
    results.forEach((value, index) => {
      const agentId = batch[index];
      if (!value) {
        removeIds.push(agentId);
        return;
      }
      let parsed = null;
      try {
        parsed = JSON.parse(value);
      } catch (err) {
        removeIds.push(agentId);
        return;
      }

      const { latitude, longitude } = parsed || {};
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        removeIds.push(agentId);
        return;
      }

      ops.push({
        updateOne: {
          filter: { _id: agentId },
          update: {
            $set: {
              currentLocation: {
                type: "Point",
                coordinates: [longitude, latitude],
              },
            },
          },
        },
      });
      removeIds.push(agentId);
    });

    if (ops.length) {
      await DeliveryAgentModel.bulkWrite(ops, { ordered: false });
    }
    if (removeIds.length) {
      await redisClient.sRem(AGENT_LOC_DIRTY_SET, removeIds);
    }
    return;
  }

  if (!dirtyAgentLocations.size) return;
  const batch = Array.from(dirtyAgentLocations).slice(0, LOCATION_FLUSH_BATCH);
  const ops = [];
  batch.forEach((agentId) => {
    const data = agentLocationCache.get(agentId);
    dirtyAgentLocations.delete(agentId);
    if (!data) return;
    const { latitude, longitude } = data;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    ops.push({
      updateOne: {
        filter: { _id: agentId },
        update: {
          $set: {
            currentLocation: {
              type: "Point",
              coordinates: [longitude, latitude],
            },
          },
        },
      },
    });
  });
  if (ops.length) {
    await DeliveryAgentModel.bulkWrite(ops, { ordered: false });
  }
};

const flushUserLocations = async (appRef) => {
  const redisClient = appRef.get("redis");
  if (redisClient) {
    const batch = await getDirtyBatch(redisClient, USER_LOC_DIRTY_SET);
    if (!batch.length) return;

    const multi = redisClient.multi();
    batch.forEach((orderId) => {
      multi.get(`${USER_LOC_KEY_PREFIX}${orderId}`);
    });
    const results = await multi.exec();

    const ops = [];
    const removeIds = [];
    results.forEach((value, index) => {
      const orderId = batch[index];
      if (!value) {
        removeIds.push(orderId);
        return;
      }
      let parsed = null;
      try {
        parsed = JSON.parse(value);
      } catch (err) {
        removeIds.push(orderId);
        return;
      }

      const { userId, latitude, longitude, updatedAt } = parsed || {};
      if (!userId || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        removeIds.push(orderId);
        return;
      }

      const updatedAtDate = updatedAt ? new Date(updatedAt) : new Date();
      ops.push({
        updateOne: {
          filter: { _id: orderId, user: userId },
          update: {
            $set: {
              userLiveLocation: {
                latitude,
                longitude,
                updatedAt: updatedAtDate,
              },
            },
          },
        },
      });
      ops.push({
        updateOne: {
          filter: {
            _id: orderId,
            user: userId,
            $or: [
              { "shippingAddress.latitude": { $exists: false } },
              { "shippingAddress.latitude": null },
              { "shippingAddress.longitude": { $exists: false } },
              { "shippingAddress.longitude": null },
            ],
          },
          update: {
            $set: {
              "shippingAddress.latitude": latitude,
              "shippingAddress.longitude": longitude,
            },
          },
        },
      });
      removeIds.push(orderId);
    });

    if (ops.length) {
      await OrderModel.bulkWrite(ops, { ordered: false });
    }
    if (removeIds.length) {
      await redisClient.sRem(USER_LOC_DIRTY_SET, removeIds);
    }
    return;
  }

  if (!dirtyUserLocations.size) return;
  const batch = Array.from(dirtyUserLocations).slice(0, LOCATION_FLUSH_BATCH);
  const ops = [];
  batch.forEach((orderId) => {
    const data = userLocationCache.get(orderId);
    dirtyUserLocations.delete(orderId);
    if (!data) return;
    const { userId, latitude, longitude, updatedAt } = data;
    if (!userId || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    const updatedAtDate = updatedAt ? new Date(updatedAt) : new Date();
    ops.push({
      updateOne: {
        filter: { _id: orderId, user: userId },
        update: {
          $set: {
            userLiveLocation: {
              latitude,
              longitude,
              updatedAt: updatedAtDate,
            },
          },
        },
      },
    });
    ops.push({
      updateOne: {
        filter: {
          _id: orderId,
          user: userId,
          $or: [
            { "shippingAddress.latitude": { $exists: false } },
            { "shippingAddress.latitude": null },
            { "shippingAddress.longitude": { $exists: false } },
            { "shippingAddress.longitude": null },
          ],
        },
        update: {
          $set: {
            "shippingAddress.latitude": latitude,
            "shippingAddress.longitude": longitude,
          },
        },
      },
    });
  });
  if (ops.length) {
    await OrderModel.bulkWrite(ops, { ordered: false });
  }
};

const startLocationFlushPoller = (appRef) => {
  const poll = async () => {
    try {
      await flushAgentLocations(appRef);
      await flushUserLocations(appRef);
    } catch (err) {
      console.error("Location flush failed:", err);
    }
  };

  poll();
  setInterval(poll, LOCATION_FLUSH_INTERVAL_MS);
};

if (redis) {
  startOrderTimerPoller(app);
  startLocationFlushPoller(app);
} else {
  startLocationFlushPoller(app);
}

io.on("connection", (socket) => {
  socket.on("agentOnline", async (agentId) => {
    if (!agentId) return;
    const disconnectTimers = app.get("agentDisconnectTimers") || {};
    if (disconnectTimers[agentId]) {
      clearTimeout(disconnectTimers[agentId]);
      delete disconnectTimers[agentId];
    }
    await setActiveAgent(app, agentId, socket.id);
    socket.data.agentId = agentId;

    try {
      const agent = await DeliveryAgentModel.findById(agentId);
      if (agent) {
        agent.isOnline = true;
        if (!agent.activeOrder) {
          agent.isAvailable = true;
        }
        await agent.save();
      }
    } catch (err) {
      console.error("Failed to mark agent online:", err);
    }
  });

  socket.on("userOnline", async (userId) => {
    if (!userId) return;
    await setActiveUser(app, userId, socket.id);
    socket.data.userId = userId;
  });

  socket.on("acceptOrder", async (orderId) => {
    const agentId = socket.data?.agentId;
    if (!agentId || !orderId) return;
    try {
      await acceptOrder(orderId, agentId, app);
    } catch (err) {
      console.error("Accept order failed:", err);
    }
  });

  socket.on("rejectOrder", async (orderId) => {
    const agentId = socket.data?.agentId;
    if (!agentId || !orderId) return;
    try {
      await rejectOrder(orderId, agentId, app);
    } catch (err) {
      console.error("Reject order failed:", err);
    }
  });

  socket.on("agentLocationUpdate", async (payload) => {
    const { agentId, orderId, latitude, longitude } = payload || {};
    const sessionAgentId = socket.data?.agentId;
    const effectiveAgentId = sessionAgentId || agentId;
    if (!effectiveAgentId) return;
    if (sessionAgentId && agentId && agentId !== sessionAgentId) return;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    try {
      await setCachedAgentLocation(app, effectiveAgentId, latitude, longitude);

      if (!orderId) return;

      const order = await OrderModel.findById(orderId)
        .select("assignedAgent orderStatus user")
        .lean();
      if (!order) return;
      if (String(order.assignedAgent || "") !== String(effectiveAgentId)) return;

      const allowedStatuses = [
        ORDER_STATUSES.ACCEPTED,
        ORDER_STATUSES.PICKED_UP,
        ORDER_STATUSES.OUT_FOR_DELIVERY,
      ];
      if (!allowedStatuses.includes(order.orderStatus)) return;

      const userSocketId = await getActiveUserSocket(
        app,
        order.user?.toString(),
      );
      if (userSocketId) {
        const emitKey = `${orderId}:${effectiveAgentId}`;
        if (!shouldEmit(lastAgentEmitAt, emitKey, LOCATION_EMIT_THROTTLE_MS)) {
          return;
        }
        io.to(userSocketId).emit("liveLocationUpdate", {
          orderId: order._id,
          agentId: effectiveAgentId,
          latitude,
          longitude,
        });
      }
    } catch (err) {
      console.error("Agent location update failed:", err);
    }
  });

  socket.on("userLocationUpdate", async (payload) => {
    const { orderId, latitude, longitude } = payload || {};
    const sessionUserId = socket.data?.userId;
    if (!sessionUserId || !orderId) return;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    try {
      const order = await OrderModel.findById(orderId)
        .select("user orderStatus assignedAgent")
        .lean();
      if (!order) return;
      if (String(order.user || "") !== String(sessionUserId)) return;

      if (
        [
          ORDER_STATUSES.DELIVERED,
          ORDER_STATUSES.CANCELLED,
          ORDER_STATUSES.NO_AGENT_AVAILABLE,
        ].includes(order.orderStatus)
      ) {
        return;
      }

      await setCachedUserLocation(
        app,
        orderId,
        sessionUserId,
        latitude,
        longitude,
      );

      const agentId = order.assignedAgent;
      if (!agentId) return;

      const agentSocketId = await getActiveAgentSocket(
        app,
        agentId.toString(),
      );
      if (agentSocketId) {
        const emitKey = `${orderId}:${sessionUserId}`;
        if (!shouldEmit(lastUserEmitAt, emitKey, LOCATION_EMIT_THROTTLE_MS)) {
          return;
        }
        io.to(agentSocketId).emit("userLocationUpdate", {
          orderId: order._id,
          userId: sessionUserId,
          latitude,
          longitude,
        });
      }
    } catch (err) {
      console.error("User location update failed:", err);
    }
  });

  socket.on("messageAgent", async (payload) => {
    const { orderId, message } = payload || {};
    const sessionUserId = socket.data?.userId;
    const trimmed = typeof message === "string" ? message.trim() : "";
    if (!sessionUserId || !orderId || !trimmed) return;

    try {
      const order = await OrderModel.findById(orderId).populate(
        "user",
        "name phone",
      );
      if (!order) return;
      const orderUserId = order.user?._id || order.user;
      if (String(orderUserId || "") !== String(sessionUserId)) return;

      const agentId = order.assignedAgent;
      if (!agentId) return;

      const agentSocketId = await getActiveAgentSocket(
        app,
        agentId.toString(),
      );
      if (agentSocketId) {
        io.to(agentSocketId).emit("agentMessage", {
          orderId: order._id,
          message: trimmed,
          userId: sessionUserId,
          userName: order.user?.name || "",
          userPhone: order.user?.phone || "",
          sentAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error("Message agent failed:", err);
    }
  });

  socket.on("messageUser", async (payload) => {
    const { orderId, message } = payload || {};
    const agentId = socket.data?.agentId;
    const trimmed = typeof message === "string" ? message.trim() : "";
    if (!agentId || !orderId || !trimmed) return;

    try {
      const order = await OrderModel.findById(orderId);
      if (!order) return;
      if (String(order.assignedAgent || "") !== String(agentId)) return;

      const userSocketId = await getActiveUserSocket(
        app,
        order.user?.toString(),
      );
      if (userSocketId) {
        io.to(userSocketId).emit("userMessage", {
          orderId: order._id,
          message: trimmed,
          agentId,
          sentAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error("Message user failed:", err);
    }
  });

  socket.on("routeUpdate", async (payload) => {
    const { orderId, route } = payload || {};
    const agentId = socket.data?.agentId;
    if (!agentId || !orderId) return;
    if (route !== null && !Array.isArray(route)) return;

    try {
      const order = await OrderModel.findById(orderId);
      if (!order) return;
      if (String(order.assignedAgent || "") !== String(agentId)) return;

      const userSocketId = await getActiveUserSocket(
        app,
        order.user?.toString(),
      );
      if (userSocketId) {
        io.to(userSocketId).emit("routeUpdate", {
          orderId: order._id,
          route,
        });
      }
    } catch (err) {
      console.error("Route update failed:", err);
    }
  });

  socket.on("disconnect", () => {
    const { agentId, userId } = socket.data || {};
    if (agentId) removeActiveAgent(app, agentId);
    if (userId) removeActiveUser(app, userId);

    if (agentId) {
      const disconnectTimers = app.get("agentDisconnectTimers") || {};
      if (disconnectTimers[agentId]) {
        clearTimeout(disconnectTimers[agentId]);
      }
      disconnectTimers[agentId] = setTimeout(async () => {
        try {
          const activeSocket = await getActiveAgentSocket(app, agentId);
          if (activeSocket) return;

          const agent = await DeliveryAgentModel.findById(agentId);
          if (!agent) return;

          agent.isOnline = false;
          agent.isAvailable = false;
          await agent.save();

          if (!agent.activeOrder) return;

          const order = await OrderModel.findById(agent.activeOrder);
          if (!order) return;

          if (
            [
              ORDER_STATUSES.DELIVERED,
              ORDER_STATUSES.CANCELLED,
              ORDER_STATUSES.NO_AGENT_AVAILABLE,
            ].includes(order.orderStatus)
          ) {
            agent.activeOrder = null;
            await agent.save();
            return;
          }

          await clearOrderTimer(order._id, app);

          // release any pending agent lock
          await releaseAgentLock(agentId, app);

          order.orderStatus = ORDER_STATUSES.ASSIGNING;
          order.assignedAgent = null;
          await order.save();

          agent.activeOrder = null;
          await agent.save();

          await assignDeliveryAgent(order, app);
        } catch (err) {
          console.error("Agent disconnect handling failed:", err);
        } finally {
          const timers = app.get("agentDisconnectTimers") || {};
          if (timers[agentId]) {
            clearTimeout(timers[agentId]);
            delete timers[agentId];
          }
        }
      }, AGENT_DISCONNECT_GRACE_MS);
      app.set("agentDisconnectTimers", disconnectTimers);
    }
  });
});

await connectDB()
  .then(() => {
    server.listen(process.env.PORT, (err) => {
      if (err) {
        console.log(err);
        console.log(`Error while starting the server`);
        process.exit(1);
      } else console.log(`Server running at port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log(`Error while connecting to database`);
    console.log(err);
    process.exit(1);
  });
