import Bull from "bull";

const redisOptions = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT || 6379),
  password: process.env.REDIS_PASS || undefined,
};

export const expiryAlertQueue = new Bull("expiry-alerts", { redis: redisOptions });
export const autoReorderQueue = new Bull("auto-reorder", { redis: redisOptions });
