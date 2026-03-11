import CustomError from "../utils/customError.util.js";

const buckets = new Map();

const getClientKey = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || "unknown";
};

const buildRedisKey = (key) => `rateLimit:${key}`;

export const rateLimit = ({
  windowMs = 60 * 1000,
  max = 60,
  keyGenerator,
  message = "Too many requests. Please try again later.",
} = {}) => {
  return async (req, res, next) => {
    const key = typeof keyGenerator === "function" ? keyGenerator(req) : getClientKey(req);
    const redis = req.app?.get?.("redis");
    const now = Date.now();

    if (redis) {
      try {
        const redisKey = buildRedisKey(key);
        const current = await redis.incr(redisKey);
        if (current === 1) {
          await redis.pexpire(redisKey, windowMs);
        }
        if (current > max) {
          const ttlMs = await redis.pttl(redisKey);
          const retryAfter = Math.ceil(Math.max(ttlMs, 0) / 1000);
          res.setHeader("Retry-After", retryAfter);
          return next(new CustomError(429, message));
        }
        return next();
      } catch (err) {
        // fall back to in-memory limiter if redis fails
      }
    }

    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (current.count >= max) {
      const retryAfter = Math.ceil((current.resetAt - now) / 1000);
      res.setHeader("Retry-After", retryAfter);
      return next(new CustomError(429, message));
    }

    current.count += 1;
    buckets.set(key, current);
    return next();
  };
};
