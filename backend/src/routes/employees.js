const express = require("express");
const mongoose = require("mongoose");
const { z } = require("zod");

const { Employee } = require("../models/Employee");
const { Customer } = require("../models/Customer");
const { Partner } = require("../models/Partner");
const { Device } = require("../models/Device");
const { Commission } = require("../models/Commission");
const { HttpError } = require("../utils/httpError");
const { requireAuth } = require("../middleware/requireAuth");
const { requireRole } = require("../middleware/requireRole");
const { writeAudit } = require("../utils/audit");

const router = express.Router();

function mustObjectId(id) {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(400, "Invalid id");
  return id;
}

function commissionRuleForOption(option) {
  // Base amounts are internal constants; commission is partnerRate * base.
  // Only purchase/lease options generate commissions.
  if (option === 2) return { kind: "purchase", baseAmount: 2000 };
  if (option === 3) return { kind: "lease", baseAmount: 500 };
  return null;
}

async function scopedEmployeeFilterForUser(req) {
  const filter = {};

  if (req.user.role === "customer") {
    if (!req.user.customerId) throw new HttpError(403, "Customer scope missing");
    filter.customerId = req.user.customerId;
  }

  if (req.user.role === "partner") {
    if (!req.user.partnerId) throw new HttpError(403, "Partner scope missing");
    const customers = await Customer.find({ partnerId: req.user.partnerId, status: { $ne: "deleted" } })
      .select({ _id: 1 })
      .lean();
    filter.customerId = { $in: customers.map((c) => c._id) };
  }

  // superadmin: no additional scope filter
  return filter;
}

// List employees (scoped by role)
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const filter = {};

    if (req.user.role === "customer") {
      if (!req.user.customerId) throw new HttpError(403, "Customer scope missing");
      filter.customerId = req.user.customerId;
    }

    if (req.user.role === "partner") {
      if (!req.user.partnerId) throw new HttpError(403, "Partner scope missing");
      const customers = await Customer.find({ partnerId: req.user.partnerId, status: { $ne: "deleted" } })
        .select({ _id: 1 })
        .lean();
      filter.customerId = { $in: customers.map((c) => c._id) };
    }

    const items = await Employee.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

// Start onboarding (Step 1) - customer, partner, or superadmin
router.post("/", requireAuth, requireRole("customer", "partner", "superadmin"), async (req, res, next) => {
  try {
    const body = z
      .object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        location: z.string().min(1),
        customerId: z.string().optional(),
        jobTitle: z.string().min(1).optional(),
        department: z.string().min(1).optional(),
        startDate: z.string().datetime().optional(),

        // Superadmin-only overrides at creation
        status: z.enum(["onboarding", "active", "offboarding", "leave", "archived"]).optional(),
        onboardingStep: z.number().int().min(1).max(2).nullable().optional(),
        offboardingStep: z.number().int().min(1).max(3).nullable().optional(),
        accountDisabled: z.boolean().optional()
      })
      .parse(req.body);

    let customerId = req.user.customerId;
    if (req.user.role === "partner") {
      if (!req.user.partnerId) throw new HttpError(403, "Partner scope missing");
      if (!body.customerId) throw new HttpError(400, "customerId is required for partner onboarding");
      customerId = mustObjectId(body.customerId);
    }

    if (req.user.role === "superadmin") {
      if (!body.customerId) throw new HttpError(400, "customerId is required for superadmin employee creation");
      customerId = mustObjectId(body.customerId);
    }

    if (!customerId) throw new HttpError(403, "Customer scope missing");

    const customer = await Customer.findById(customerId).lean();
    if (!customer || customer.status !== "active") {
      throw new HttpError(400, "Customer is inactive/deleted");
    }

    if (req.user.role === "partner" && String(customer.partnerId) !== String(req.user.partnerId)) {
      throw new HttpError(403, "Cannot access other partners’ customers");
    }

    // Customer/partner create is always onboarding step 1.
    if (req.user.role !== "superadmin") {
      if (body.status !== undefined || body.onboardingStep !== undefined || body.offboardingStep !== undefined || body.accountDisabled !== undefined) {
        throw new HttpError(400, "Only superadmin can override workflow fields at creation");
      }
    }

    const desiredStatus = req.user.role === "superadmin" ? (body.status ?? "onboarding") : "onboarding";
    const created = await Employee.create({
      customerId,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email.toLowerCase(),
      location: body.location,
      jobTitle: body.jobTitle ?? null,
      department: body.department ?? null,
      startDate: body.startDate ? new Date(body.startDate) : null,
      status: desiredStatus,
      onboardingStep: desiredStatus === "onboarding" ? (req.user.role === "superadmin" ? (body.onboardingStep ?? 1) : 1) : null,
      offboardingStep: desiredStatus === "offboarding" ? (body.offboardingStep ?? 1) : null,
      accountDisabled: desiredStatus === "offboarding" ? (body.accountDisabled ?? true) : (body.accountDisabled ?? false)
    });

    await writeAudit({
      req,
      action: "employee.create",
      entityType: "Employee",
      entityId: created._id,
      before: null,
      after: created.toObject(),
      meta: { workflow: desiredStatus === "onboarding" ? "onboarding" : "admin", step: desiredStatus === "onboarding" ? 1 : null }
    });

    res.status(201).json({ item: created });
  } catch (e) {
    // Handle unique email per customer nicely
    if (e?.code === 11000) {
      next(new HttpError(400, "Employee email already exists under this customer"));
      return;
    }
    next(e);
  }
});

// Onboarding Step 2 - customer only
router.patch("/:id/onboarding/step2", requireAuth, requireRole("customer"), async (req, res, next) => {
  try {
    const id = mustObjectId(req.params.id);
    const body = z
      .object({
        deviceAcquisitionOption: z.number().int().min(1).max(4),
        deviceId: z.string().optional().nullable(),
        deviceApproved: z.boolean(),
        setupApproved: z.boolean(),
        viaPartner: z.boolean().optional().default(false)
      })
      .parse(req.body);

    const customerId = req.user.customerId;
    if (!customerId) throw new HttpError(403, "Customer scope missing");

    const employee = await Employee.findOne({ _id: id, customerId });
    if (!employee) throw new HttpError(404, "Employee not found");
    if (employee.status !== "onboarding" || employee.onboardingStep !== 1) {
      throw new HttpError(400, "Employee not in onboarding step 1");
    }

    // If selecting from inventory, validate device
    let chosenDevice = null;
    if (body.deviceId) {
      const deviceId = mustObjectId(body.deviceId);
      chosenDevice = await Device.findById(deviceId);
      if (!chosenDevice) throw new HttpError(400, "Device not found");
      if (chosenDevice.status !== "available") throw new HttpError(400, "Device not available");
      if (!(chosenDevice.ownerType === "belzir" || String(chosenDevice.customerId) === String(customerId))) {
        throw new HttpError(400, "Device not owned by customer or Belzir");
      }
    }

    const before = employee.toObject();

    employee.deviceAcquisitionOption = body.deviceAcquisitionOption;
    employee.deviceApproved = body.deviceApproved;
    employee.setupApproved = body.setupApproved;
    employee.onboardingStep = 2;

    if (chosenDevice) {
      employee.deviceId = chosenDevice._id;
      chosenDevice.status = "assigned";
      chosenDevice.assignedEmployeeId = employee._id;
      await chosenDevice.save();
    }

    await employee.save();

    // Commission: only if purchased/leased via partner
    const customer = await Customer.findById(customerId).lean();
    const rule = commissionRuleForOption(body.deviceAcquisitionOption);
    if (customer && rule && body.viaPartner) {
      const partner = await Partner.findById(customer.partnerId).lean();
      const rate = partner?.commissionRate ?? 0;
      const amount = Math.round(rule.baseAmount * rate);
      if (amount > 0) {
        await Commission.create({
          partnerId: customer.partnerId,
          customerId,
          employeeId: employee._id,
          deviceId: employee.deviceId,
          kind: rule.kind,
          amount
        });
      }
    }

    await writeAudit({
      req,
      action: "employee.onboarding.step2",
      entityType: "Employee",
      entityId: employee._id,
      before,
      after: employee.toObject(),
      meta: { workflow: "onboarding", step: 2 }
    });

    res.json({ item: employee });
  } catch (e) {
    next(e);
  }
});

// Onboarding Step 3 complete (Belzir / superadmin)
router.patch(
  "/:id/onboarding/step3/complete",
  requireAuth,
  requireRole("superadmin"),
  async (req, res, next) => {
    try {
      const id = mustObjectId(req.params.id);
      const employee = await Employee.findById(id);
      if (!employee) throw new HttpError(404, "Employee not found");

      if (employee.status !== "onboarding" || employee.onboardingStep !== 2) {
        throw new HttpError(400, "Employee not in onboarding step 2");
      }
      if (!employee.deviceApproved || !employee.setupApproved) {
        throw new HttpError(400, "Step 2 approvals are required");
      }

      const before = employee.toObject();

      employee.status = "active";
      employee.onboardingStep = null;
      await employee.save();

      await writeAudit({
        req,
        action: "employee.onboarding.step3.complete",
        entityType: "Employee",
        entityId: employee._id,
        before,
        after: employee.toObject(),
        meta: { workflow: "onboarding", step: 3 }
      });

      res.json({ item: employee });
    } catch (e) {
      next(e);
    }
  }
);

// Start offboarding (Step 1) - customer or partner
router.post(
  "/:id/offboarding/start",
  requireAuth,
  requireRole("customer", "partner"),
  async (req, res, next) => {
    try {
      const id = mustObjectId(req.params.id);

      const filter = { _id: id };

      if (req.user.role === "customer") {
        filter.customerId = req.user.customerId;
      }

      if (req.user.role === "partner") {
        if (!req.user.partnerId) throw new HttpError(403, "Partner scope missing");
        const customers = await Customer.find({ partnerId: req.user.partnerId, status: { $ne: "deleted" } })
          .select({ _id: 1 })
          .lean();
        filter.customerId = { $in: customers.map((c) => c._id) };
      }

      const employee = await Employee.findOne(filter);
      if (!employee) throw new HttpError(404, "Employee not found");
      if (employee.status !== "active") throw new HttpError(400, "Employee must be active to offboard");

      const before = employee.toObject();

      employee.status = "offboarding";
      employee.offboardingStep = 1;
      employee.accountDisabled = true;
      await employee.save();

      await writeAudit({
        req,
        action: "employee.offboarding.start",
        entityType: "Employee",
        entityId: employee._id,
        before,
        after: employee.toObject(),
        meta: { workflow: "offboarding", step: 1 }
      });

      res.json({ item: employee });
    } catch (e) {
      next(e);
    }
  }
);

// Offboarding step 2 - device return received
router.patch(
  "/:id/offboarding/step2/receive-device",
  requireAuth,
  requireRole("customer", "superadmin"),
  async (req, res, next) => {
    try {
      const id = mustObjectId(req.params.id);
      const employee = await Employee.findById(id);
      if (!employee) throw new HttpError(404, "Employee not found");
      if (req.user.role === "customer" && String(employee.customerId) !== String(req.user.customerId)) {
        throw new HttpError(403, "Forbidden");
      }

      if (employee.status !== "offboarding" || employee.offboardingStep !== 1) {
        throw new HttpError(400, "Employee not in offboarding step 1");
      }
      if (!employee.accountDisabled) {
        throw new HttpError(400, "Account must be disabled before receiving device");
      }

      const before = employee.toObject();

      if (employee.deviceId) {
        const device = await Device.findById(employee.deviceId);
        if (device) {
          device.status = "available";
          device.assignedEmployeeId = null;
          await device.save();
        }
      }

      employee.offboardingStep = 2;
      await employee.save();

      await writeAudit({
        req,
        action: "employee.offboarding.step2.receiveDevice",
        entityType: "Employee",
        entityId: employee._id,
        before,
        after: employee.toObject(),
        meta: { workflow: "offboarding", step: 2 }
      });

      res.json({ item: employee });
    } catch (e) {
      next(e);
    }
  }
);

// Offboarding step 3 complete - archive by default
router.patch(
  "/:id/offboarding/step3/complete",
  requireAuth,
  requireRole("customer", "superadmin"),
  async (req, res, next) => {
    try {
      const id = mustObjectId(req.params.id);
      const body = z
        .object({
          archive: z.boolean().optional().default(true)
        })
        .parse(req.body || {});

      const employee = await Employee.findById(id);
      if (!employee) throw new HttpError(404, "Employee not found");
      if (req.user.role === "customer" && String(employee.customerId) !== String(req.user.customerId)) {
        throw new HttpError(403, "Forbidden");
      }

      if (employee.status !== "offboarding") throw new HttpError(400, "Employee not in offboarding");
      if (employee.offboardingStep !== 2) throw new HttpError(400, "Device must be returned first");
      if (!employee.accountDisabled) throw new HttpError(400, "Account must be disabled");

      const before = employee.toObject();

      employee.offboardingStep = 3;
      employee.status = body.archive ? "archived" : "active";
      await employee.save();

      await writeAudit({
        req,
        action: "employee.offboarding.step3.complete",
        entityType: "Employee",
        entityId: employee._id,
        before,
        after: employee.toObject(),
        meta: { workflow: "offboarding", step: 3, archive: body.archive }
      });

      res.json({ item: employee });
    } catch (e) {
      next(e);
    }
  }
);

// Superadmin override/update (CRUD)
router.patch("/:id", requireAuth, requireRole("superadmin", "customer", "partner"), async (req, res, next) => {
  try {
    const id = mustObjectId(req.params.id);
    const body = z
      .object({
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        email: z.string().email().optional(),
        location: z.string().min(1).optional(),
        jobTitle: z.string().min(1).optional().nullable(),
        department: z.string().min(1).optional().nullable(),
        startDate: z.string().datetime().optional().nullable(),
        status: z.enum(["onboarding", "active", "offboarding", "leave", "archived"]).optional(),
        onboardingStep: z.number().int().min(1).max(2).nullable().optional(),
        offboardingStep: z.number().int().min(1).max(3).nullable().optional(),
        accountDisabled: z.boolean().optional(),
        deviceId: z.string().nullable().optional()
      })
      .parse(req.body);

    const scopeFilter = await scopedEmployeeFilterForUser(req);
    const employee = await Employee.findOne({ _id: id, ...scopeFilter });
    if (!employee) throw new HttpError(404, "Employee not found");

    const before = employee.toObject();

    if (body.firstName !== undefined) employee.firstName = body.firstName;
    if (body.lastName !== undefined) employee.lastName = body.lastName;
    if (body.email !== undefined) employee.email = body.email.toLowerCase();
    if (body.location !== undefined) employee.location = body.location;

    if (body.jobTitle !== undefined) employee.jobTitle = body.jobTitle;
    if (body.department !== undefined) employee.department = body.department;
    if (body.startDate !== undefined) employee.startDate = body.startDate ? new Date(body.startDate) : null;

    if (req.user.role === "superadmin") {
      if (body.status !== undefined) employee.status = body.status;
      if (body.onboardingStep !== undefined) employee.onboardingStep = body.onboardingStep;
      if (body.offboardingStep !== undefined) employee.offboardingStep = body.offboardingStep;
      if (body.accountDisabled !== undefined) employee.accountDisabled = body.accountDisabled;

      // Normalize workflow fields based on status to avoid stale values when overriding.
      if (body.status !== undefined) {
        if (employee.status === "onboarding") {
          employee.offboardingStep = null;
          if (employee.onboardingStep == null) employee.onboardingStep = 1;
          if (body.accountDisabled === undefined) employee.accountDisabled = false;
        }

        if (employee.status === "offboarding") {
          employee.onboardingStep = null;
          if (employee.offboardingStep == null) employee.offboardingStep = 1;
          if (body.accountDisabled === undefined) employee.accountDisabled = true;
        }

        if (employee.status === "active" || employee.status === "leave") {
          employee.onboardingStep = null;
          employee.offboardingStep = null;
          if (body.accountDisabled === undefined) employee.accountDisabled = false;
        }

        if (employee.status === "archived") {
          employee.onboardingStep = null;
          employee.offboardingStep = null;
          if (body.accountDisabled === undefined) employee.accountDisabled = true;
        }
      }
    } else {
      // For customer/partner, keep workflow endpoints as the source of truth.
      // Allow only Active <-> Leave toggles here.
      if (body.status !== undefined) {
        const curr = employee.status;
        const nextStatus = body.status;
        const allowed =
          (curr === "active" && nextStatus === "leave") ||
          (curr === "leave" && nextStatus === "active") ||
          (curr === nextStatus);
        if (!allowed) {
          throw new HttpError(400, "Status change not allowed. Use onboarding/offboarding actions.");
        }
        employee.status = nextStatus;
      }

      if (body.onboardingStep !== undefined || body.offboardingStep !== undefined || body.accountDisabled !== undefined) {
        throw new HttpError(400, "Workflow fields cannot be edited directly.");
      }
      if (body.deviceId !== undefined) {
        throw new HttpError(400, "Device assignment must be done via onboarding/offboarding.");
      }
    }

    if (req.user.role === "superadmin" && body.deviceId !== undefined) {
      // Free previous device
      if (employee.deviceId) {
        const oldDevice = await Device.findById(employee.deviceId);
        if (oldDevice) {
          oldDevice.status = "available";
          oldDevice.assignedEmployeeId = null;
          await oldDevice.save();
        }
      }

      if (body.deviceId) {
        const newDeviceId = mustObjectId(body.deviceId);
        const newDevice = await Device.findById(newDeviceId);
        if (!newDevice) throw new HttpError(400, "Device not found");
        if (newDevice.status !== "available") throw new HttpError(400, "Device not available");
        employee.deviceId = newDevice._id;
        newDevice.status = "assigned";
        newDevice.assignedEmployeeId = employee._id;
        await newDevice.save();
      } else {
        employee.deviceId = null;
      }
    }

    await employee.save();

    await writeAudit({
      req,
      action: "employee.update",
      entityType: "Employee",
      entityId: employee._id,
      before,
      after: employee.toObject(),
      meta: { override: req.user.role === "superadmin" }
    });

    res.json({ item: employee });
  } catch (e) {
    // Handle unique email per customer nicely
    if (e?.code === 11000) {
      next(new HttpError(400, "Employee email already exists under this customer"));
      return;
    }
    next(e);
  }
});

router.delete("/:id", requireAuth, requireRole("superadmin"), async (req, res, next) => {
  try {
    const id = mustObjectId(req.params.id);
    const employee = await Employee.findById(id);
    if (!employee) throw new HttpError(404, "Employee not found");

    const before = employee.toObject();

    if (employee.deviceId) {
      const device = await Device.findById(employee.deviceId);
      if (device) {
        device.status = "available";
        device.assignedEmployeeId = null;
        await device.save();
      }
    }

    await employee.deleteOne();

    await writeAudit({
      req,
      action: "employee.delete",
      entityType: "Employee",
      entityId: before._id,
      before,
      after: null
    });

    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

module.exports = { employeesRouter: router };
