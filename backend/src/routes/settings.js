const express = require("express");
const { z } = require("zod");

const { SystemSettings } = require("../models/SystemSettings");
const { requireAuth } = require("../middleware/requireAuth");
const { requireRole } = require("../middleware/requireRole");
const { writeAudit } = require("../utils/audit");

const router = express.Router();

async function getSingleton() {
  let doc = await SystemSettings.findOne({ singleton: "singleton" });
  if (!doc) {
    doc = await SystemSettings.create({ singleton: "singleton" });
  }
  return doc;
}

// Superadmin: read settings
router.get("/", requireAuth, requireRole("superadmin"), async (req, res, next) => {
  try {
    const doc = await getSingleton();
    res.json({ item: doc.toObject() });
  } catch (e) {
    next(e);
  }
});

// Superadmin: update settings
router.patch("/", requireAuth, requireRole("superadmin"), async (req, res, next) => {
  try {
    const body = z
      .object({
        companyName: z.string().min(1).optional(),
        supportEmail: z.string().email().optional(),
        defaultPartnerCommissionRate: z.number().min(0).max(1).optional(),
        maintenanceMode: z.boolean().optional()
      })
      .parse(req.body);

    const doc = await getSingleton();
    const before = doc.toObject();

    if (body.companyName !== undefined) doc.companyName = body.companyName;
    if (body.supportEmail !== undefined) doc.supportEmail = body.supportEmail;
    if (body.defaultPartnerCommissionRate !== undefined) doc.defaultPartnerCommissionRate = body.defaultPartnerCommissionRate;
    if (body.maintenanceMode !== undefined) doc.maintenanceMode = body.maintenanceMode;

    await doc.save();

    await writeAudit({
      req,
      action: "settings.update",
      entityType: "SystemSettings",
      entityId: doc._id,
      before,
      after: doc.toObject()
    });

    res.json({ item: doc.toObject() });
  } catch (e) {
    next(e);
  }
});

module.exports = { settingsRouter: router };
