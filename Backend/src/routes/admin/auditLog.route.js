import { Router } from "express";
import { getAuditLogs } from "../../controllers/admin/auditLog.controller.js";
import { authenticate, authorizeRoles } from "../../middlewares/auth.middleware.js";

const auditLogRouter = Router();

auditLogRouter.get("/all", authenticate, authorizeRoles("admin"), getAuditLogs);

export default auditLogRouter;
