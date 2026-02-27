import { createClient } from "redis";

let redisClient = null;
let connectPromise = null;

const buildRedisOptions = () => {
  const url = process.env.REDIS_URL;
  if (url) {
    return { url };
  }

  const host = process.env.REDIS_HOST || "127.0.0.1";
  const port = Number(process.env.REDIS_PORT || 6379);
  const username = process.env.REDIS_USER || "default";
  const password = process.env.REDIS_PASS || undefined;
  const useTls = process.env.REDIS_TLS === "true";

  return {
    username,
    password,
    socket: {
      host,
      port,
      tls: useTls || undefined,
    },
  };
};

export const client = async () => {
  if (redisClient?.isOpen) return redisClient;
  if (connectPromise) return connectPromise;

  const options = buildRedisOptions();
  redisClient = createClient(options);

  redisClient.on("error", (err) => {
    console.error("Redis Client Error", err);
  });

  connectPromise = redisClient.connect();
  try {
    await connectPromise;
    console.log("Redis connected");
    return redisClient;
  } catch (err) {
    redisClient = null;
    throw err;
  } finally {
    connectPromise = null;
  }
};
