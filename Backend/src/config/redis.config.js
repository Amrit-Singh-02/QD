import { createClient } from "redis";

export const connectRedis = async () => {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  const client = createClient({ url });

  client.on("error", (err) => {
    console.error("Redis connection error:", err);
  });

  await client.connect();
  return client;
};
