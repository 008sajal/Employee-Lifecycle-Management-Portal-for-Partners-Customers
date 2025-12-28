const { AuditLog } = require("../models/AuditLog");

async function writeAudit({ req, action, entityType, entityId, before, after, meta }) {
  const actorUserId = req.user?.id || null;
  const actorRole = req.user?.role || null;

  await AuditLog.create({
    actorUserId,
    actorRole,
    action,
    entityType,
    entityId: entityId ? String(entityId) : null,
    before: before ?? null,
    after: after ?? null,
    meta: meta ?? null
  });
}

module.exports = { writeAudit };
