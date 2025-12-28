const express = require("express");

const { Commission } = require("../models/Commission");
const { requireAuth } = require("../middleware/requireAuth");
const { requireRole } = require("../middleware/requireRole");
const { HttpError } = require("../utils/httpError");
const { writeAudit } = require("../utils/audit");

const router = express.Router();

// Superadmin: list commissions (optionally filter by partnerId/customerId)
router.get("/", requireAuth, requireRole("superadmin"), async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.partnerId) filter.partnerId = req.query.partnerId;
    if (req.query.customerId) filter.customerId = req.query.customerId;

    const items = await Commission.find(filter)
      .sort({ createdAt: -1 })
      .populate("partnerId", "name")
      .populate("customerId", "name")
      .populate("employeeId", "firstName lastName email")
      .populate("deviceId", "name os")
      .lean();
    const total = items.reduce((sum, x) => sum + x.amount, 0);
    res.json({ items, total });
  } catch (e) {
    next(e);
  }
});

router.get("/me", requireAuth, requireRole("partner"), async (req, res, next) => {
  try {
    if (!req.user.partnerId) throw new HttpError(403, "Partner scope missing");

    const items = await Commission.find({ partnerId: req.user.partnerId })
      .sort({ createdAt: -1 })
      .populate("customerId", "name")
      .populate("employeeId", "firstName lastName email")
      .populate("deviceId", "name os")
      .lean();
    const total = items.reduce((sum, x) => sum + x.amount, 0);
    res.json({ items, total });
  } catch (e) {
    next(e);
  }
});

// Superadmin: delete a commission record
router.delete("/:id", requireAuth, requireRole("superadmin"), async (req, res, next) => {
  try {
    const commission = await Commission.findById(req.params.id);
    if (!commission) throw new HttpError(404, "Commission not found");

    const before = commission.toObject();
    await commission.deleteOne();

    await writeAudit({
      req,
      action: "commission.delete",
      entityType: "Commission",
      entityId: before._id,
      before,
      after: null
    });

    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

module.exports = { commissionsRouter: router };
