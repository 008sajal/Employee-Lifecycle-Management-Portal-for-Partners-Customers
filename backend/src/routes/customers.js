const express = require("express");
const { z } = require("zod");

const { Customer } = require("../models/Customer");
const { Partner } = require("../models/Partner");
const { requireAuth } = require("../middleware/requireAuth");
const { requireRole } = require("../middleware/requireRole");
const { HttpError } = require("../utils/httpError");
const { writeAudit } = require("../utils/audit");

const router = express.Router();

// Superadmin: list/create
router.get("/", requireAuth, requireRole("superadmin"), async (req, res, next) => {
  try {
    const items = await Customer.find({ status: { $ne: "deleted" } })
      .sort({ createdAt: -1 })
      .populate("partnerId", "name")
      .lean();
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

router.post("/", requireAuth, requireRole("superadmin"), async (req, res, next) => {
  try {
    const body = z.object({ partnerId: z.string().min(1), name: z.string().min(1) }).parse(req.body);

    const partner = await Partner.findById(body.partnerId).lean();
    if (!partner) throw new HttpError(400, "Partner not found");

    const created = await Customer.create({ partnerId: body.partnerId, name: body.name });

    await writeAudit({ req, action: "customer.create", entityType: "Customer", entityId: created._id, before: null, after: created.toObject() });

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
        status: z.enum(["active", "inactive", "deleted"]).optional(),
        partnerId: z.string().min(1).optional()
      })
      .parse(req.body);

    if (body.partnerId) {
      const partner = await Partner.findById(body.partnerId).lean();
      if (!partner) throw new HttpError(400, "Partner not found");
    }

    const customer = await Customer.findById(req.params.id);
    if (!customer) throw new HttpError(404, "Customer not found");

    const before = customer.toObject();
    if (body.name !== undefined) customer.name = body.name;
    if (body.status !== undefined) customer.status = body.status;
    if (body.partnerId !== undefined) customer.partnerId = body.partnerId;
    await customer.save();

    await writeAudit({
      req,
      action: "customer.update",
      entityType: "Customer",
      entityId: customer._id,
      before,
      after: customer.toObject()
    });

    res.json({ item: customer });
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", requireAuth, requireRole("superadmin"), async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) throw new HttpError(404, "Customer not found");

    const before = customer.toObject();
    customer.status = "deleted";
    await customer.save();

    await writeAudit({
      req,
      action: "customer.delete",
      entityType: "Customer",
      entityId: customer._id,
      before,
      after: customer.toObject()
    });

    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

module.exports = { customersRouter: router };
