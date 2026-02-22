const ACTIVE_AGENTS_KEY = "activeAgents";
const ACTIVE_USERS_KEY = "activeUsers";

const getRedisClient = (app) => app.get("redis");

const getMemoryStore = (app, key) => {
  const store = app.get(key) || {};
  app.set(key, store);
  return store;
};

export const setActiveAgent = async (app, agentId, socketId) => {
  if (!agentId || !socketId) return;
  const redis = getRedisClient(app);
  if (redis) {
    await redis.hSet(ACTIVE_AGENTS_KEY, agentId, socketId);
    return;
  }
  const store = getMemoryStore(app, ACTIVE_AGENTS_KEY);
  store[agentId] = socketId;
};

export const removeActiveAgent = async (app, agentId) => {
  if (!agentId) return;
  const redis = getRedisClient(app);
  if (redis) {
    await redis.hDel(ACTIVE_AGENTS_KEY, agentId);
    return;
  }
  const store = getMemoryStore(app, ACTIVE_AGENTS_KEY);
  delete store[agentId];
};

export const getActiveAgentSocket = async (app, agentId) => {
  if (!agentId) return null;
  const redis = getRedisClient(app);
  if (redis) {
    return await redis.hGet(ACTIVE_AGENTS_KEY, agentId);
  }
  const store = getMemoryStore(app, ACTIVE_AGENTS_KEY);
  return store[agentId] || null;
};

export const setActiveUser = async (app, userId, socketId) => {
  if (!userId || !socketId) return;
  const redis = getRedisClient(app);
  if (redis) {
    await redis.hSet(ACTIVE_USERS_KEY, userId, socketId);
    return;
  }
  const store = getMemoryStore(app, ACTIVE_USERS_KEY);
  store[userId] = socketId;
};

export const removeActiveUser = async (app, userId) => {
  if (!userId) return;
  const redis = getRedisClient(app);
  if (redis) {
    await redis.hDel(ACTIVE_USERS_KEY, userId);
    return;
  }
  const store = getMemoryStore(app, ACTIVE_USERS_KEY);
  delete store[userId];
};

export const getActiveUserSocket = async (app, userId) => {
  if (!userId) return null;
  const redis = getRedisClient(app);
  if (redis) {
    return await redis.hGet(ACTIVE_USERS_KEY, userId);
  }
  const store = getMemoryStore(app, ACTIVE_USERS_KEY);
  return store[userId] || null;
};
