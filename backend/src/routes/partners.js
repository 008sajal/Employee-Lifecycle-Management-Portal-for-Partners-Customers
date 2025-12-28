const express = require("express");
const { z } = require("zod");

const { Partner } = require("../models/Partner");
const { Customer } = require("../models/Customer");
const { Employee } = require("../models/Employee");
const { Commission } = require("../models/Commission");
const { requireAuth } = require("../middleware/requireAuth");
const { requireRole } = require("../middleware/requireRole");
const { HttpError } = require("../utils/httpError");
const { writeAudit } = require("../utils/audit");

const router = express.Router();

// Superadmin CRUD minimal
router.get("/", requireAuth, requireRole("superadmin"), async (req, res, next) => {
  try {
    const items = await Partner.find({ status: { $ne: "deleted" } }).sort({ createdAt: -1 }).lean();
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

router.post("/", requireAuth, requireRole("superadmin"), async (req, res, next) => {
  try {
    const body = z.object({ name: z.string().min(1), commissionRate: z.number().optional() }).parse(req.body);
    const created = await Partner.create({ name: body.name, commissionRate: body.commissionRate ?? 0.05 });

    await writeAudit({ req, action: "partner.create", entityType: "Partner", entityId: created._id, before: null, after: created.toObject() });

    res.status(201).json({ item: created });
  } catch (e) {
    next(e);
  }
});

router.patch("/:id", requireAuth, requireRole("superadmin"), async (req, res, next) => {
  try {
    const body = z
      .object({
        name: z.string().min(1).optional(),
        commissionRate: z.number().min(0).max(1).optional(),
        status: z.enum(["active", "inactive", "deleted"]).optional()
      })
      .parse(req.body);

    const partner = await Partner.findById(req.params.id);
    if (!partner) throw new HttpError(404, "Partner not found");

    const before = partner.toObject();
    if (body.name !== undefined) partner.name = body.name;
    if (body.commissionRate !== undefined) partner.commissionRate = body.commissionRate;
    if (body.status !== undefined) partner.status = body.status;
    await partner.save();

    await writeAudit({
      req,
      action: "partner.update",
      entityType: "Partner",
      entityId: partner._id,
      before,
      after: partner.toObject()
    });

    res.json({ item: partner });
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", requireAuth, requireRole("superadmin"), async (req, res, next) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner) throw new HttpError(404, "Partner not found");

    const before = partner.toObject();
    partner.status = "deleted";
    await partner.save();

    await writeAudit({
      req,
      action: "partner.delete",
      entityType: "Partner",
      entityId: partner._id,
      before,
      after: partner.toObject()
    });

    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

// Partner: dashboard summary
router.get("/me/dashboard", requireAuth, requireRole("partner"), async (req, res, next) => {
  try {
    if (!req.user.partnerId) throw new HttpError(403, "Partner scope missing");

    const customers = await Customer.find({ partnerId: req.user.partnerId, status: { $ne: "deleted" } }).lean();
    const customerIds = customers.map((c) => c._id);

    const counts = await Employee.aggregate([
      { $match: { customerId: { $in: customerIds } } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const commissions = await Commission.aggregate([
      { $match: { partnerId: req.user.partnerId } },
      { $group: { _id: "$customerId", total: { $sum: "$amount" } } }
    ]);

    const totalCommissions = commissions.reduce((sum, x) => sum + x.total, 0);

    res.json({
      customers,
      counts,
      commissions,
      totalCommissions
    });
  } catch (e) {
    next(e);
  }
});

// Partner: view assigned customers
router.get("/me/customers", requireAuth, requireRole("partner"), async (req, res, next) => {
  try {
    if (!req.user.partnerId) throw new HttpError(403, "Partner scope missing");
    const items = await Customer.find({ partnerId: req.user.partnerId, status: { $ne: "deleted" } })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

module.exports = { partnersRouter: router };
