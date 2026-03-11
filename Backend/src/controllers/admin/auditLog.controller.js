import expressAsyncHandler from "express-async-handler";
import ApiResponse from "../../utils/ApiResponse.util.js";
import AuditLogModel from "../../models/auditLog.model.js";

export const getAuditLogs = expressAsyncHandler(async (req, res) => {
  const {
    action,
    entityType,
    actorId,
    fromDate,
    toDate,
    page = 1,
    limit = 20,
  } = req.query;

  const filter = {};
  if (action) filter.action = String(action).trim();
  if (entityType) filter.entityType = String(entityType).trim();
  if (actorId) filter.actor = actorId;

  if (fromDate || toDate) {
    filter.createdAt = {};
    if (fromDate) {
      const start = new Date(fromDate);
      if (!Number.isNaN(start.getTime())) {
        filter.createdAt.$gte = start;
      }
    }
    if (toDate) {
      const end = new Date(toDate);
      if (!Number.isNaN(end.getTime())) {
        if (end.getHours() === 0 && end.getMinutes() === 0 && end.getSeconds() === 0) {
          end.setHours(23, 59, 59, 999);
        }
        filter.createdAt.$lte = end;
      }
    }
    if (Object.keys(filter.createdAt).length === 0) {
      delete filter.createdAt;
    }
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Math.min(100, Number(limit) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [logs, total] = await Promise.all([
    AuditLogModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("actor", "name email role")
      .lean({ virtuals: true }),
    AuditLogModel.countDocuments(filter),
  ]);

  const totalPages = Math.max(Math.ceil(total / limitNum), 1);

  new ApiResponse(200, "Fetched audit logs", {
    logs,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
    },
  }).send(res);
});
