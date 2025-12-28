const express = require("express");
const { z } = require("zod");

const { AuditLog } = require("../models/AuditLog");
const { requireAuth } = require("../middleware/requireAuth");
const { requireRole } = require("../middleware/requireRole");

const router = express.Router();

// Superadmin: list audit logs (basic pagination)
router.get("/", requireAuth, requireRole("superadmin"), async (req, res, next) => {
  try {
    const query = z
      .object({
        limit: z.coerce.number().int().min(1).max(200).optional(),
        skip: z.coerce.number().int().min(0).optional()
      })
      .parse(req.query);

    const limit = query.limit ?? 50;
    const skip = query.skip ?? 0;

    const [items, total] = await Promise.all([
      AuditLog.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AuditLog.countDocuments({})
    ]);

    res.json({ items, total, limit, skip });
  } catch (e) {
    next(e);
  }
});

module.exports = { auditLogsRouter: router };
