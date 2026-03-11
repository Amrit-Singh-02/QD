import AuditLogModel from "../models/auditLog.model.js";

const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "accessToken",
  "refreshToken",
  "resetPasswordToken",
  "resetToken",
  "otp",
  "secret",
]);

const sanitize = (value) => {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(sanitize);
  if (typeof value !== "object") return value;

  const safe = Array.isArray(value) ? [] : {};
  Object.entries(value).forEach(([key, val]) => {
    if (SENSITIVE_KEYS.has(key)) return;
    safe[key] = sanitize(val);
  });
  return safe;
};

export const recordAuditLog = async ({
  actorId,
  actorRole = "admin",
  action,
  entityType,
  entityId = null,
  before = null,
  after = null,
  meta = null,
  req = null,
} = {}) => {
  if (!action || !entityType) return;
  try {
    await AuditLogModel.create({
      actor: actorId || null,
      actorRole,
      action,
      entityType,
      entityId,
      before: sanitize(before),
      after: sanitize(after),
      meta: sanitize(meta),
      ip: req?.ip || null,
      userAgent: req?.get?.("user-agent") || null,
    });
  } catch (err) {
    console.error("Audit log write failed:", err);
  }
};
