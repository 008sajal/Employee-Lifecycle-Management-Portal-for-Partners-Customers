const express = require("express");
const { z } = require("zod");

const { Device } = require("../models/Device");
const { Employee } = require("../models/Employee");
const { HttpError } = require("../utils/httpError");
const { requireAuth } = require("../middleware/requireAuth");
const { requireRole } = require("../middleware/requireRole");
const { writeAudit } = require("../utils/audit");

const router = express.Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const filter = {};

    if (req.user.role === "customer") {
      filter.$or = [
        { ownerType: "customer", customerId: req.user.customerId },
        { ownerType: "belzir" }
      ];
    }

    const items = await Device.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

// Customer can add inventory devices; superadmin can add any
router.post("/", requireAuth, requireRole("customer", "superadmin"), async (req, res, next) => {
  try {
    const body = z
      .object({
        name: z.string().min(1),
        os: z.enum(["windows", "macos", "linux", "other"]).default("other"),
        cyberProtectionEnabled: z.boolean().optional().default(false),
        encryptionEnabled: z.boolean().optional().default(false)
      })
      .parse(req.body);

    const created = await Device.create({
      name: body.name,
      os: body.os,
      ownerType: req.user.role === "customer" ? "customer" : "belzir",
      customerId: req.user.role === "customer" ? req.user.customerId : null,
      status: "available",
      cyberProtectionEnabled: body.cyberProtectionEnabled,
      encryptionEnabled: body.encryptionEnabled
    });

    await writeAudit({
      req,
      action: "device.create",
      entityType: "Device",
      entityId: created._id,
      before: null,
      after: created.toObject()
    });

    res.status(201).json({ item: created });
  } catch (e) {
    next(e);
  }
});

router.patch("/:id", requireAuth, requireRole("customer", "superadmin"), async (req, res, next) => {
  try {
    const body = z
      .object({
        name: z.string().min(1).optional(),
        os: z.enum(["windows", "macos", "linux", "other"]).optional(),
        cyberProtectionEnabled: z.boolean().optional(),
        encryptionEnabled: z.boolean().optional(),
        status: z.enum(["available", "assigned"]).optional()
      })
      .parse(req.body);

    const device = await Device.findById(req.params.id);
    if (!device) throw new HttpError(404, "Device not found");

    if (req.user.role === "customer") {
      if (device.ownerType !== "customer" || String(device.customerId) !== String(req.user.customerId)) {
        throw new HttpError(403, "Forbidden");
      }
      // customers cannot force status changes to 'assigned'
      if (body.status && body.status !== device.status) {
        throw new HttpError(400, "Device status cannot be manually changed by customer");
      }
    }

    const before = device.toObject();
    if (body.name !== undefined) device.name = body.name;
    if (body.os !== undefined) device.os = body.os;
    if (body.cyberProtectionEnabled !== undefined) device.cyberProtectionEnabled = body.cyberProtectionEnabled;
    if (body.encryptionEnabled !== undefined) device.encryptionEnabled = body.encryptionEnabled;
    if (req.user.role === "superadmin" && body.status !== undefined) device.status = body.status;
    await device.save();

    await writeAudit({
      req,
      action: "device.update",
      entityType: "Device",
      entityId: device._id,
      before,
      after: device.toObject()
    });

    res.json({ item: device });
  } catch (e) {
    next(e);
  }
});

// Assign a device to an employee (CRUD mapping). Superadmin can assign any available device;
// Customer can assign available devices they can see (customer-owned under their customerId OR Belzir-owned)
// but only to employees under their customer.
router.patch("/:id/assign", requireAuth, requireRole("customer", "superadmin"), async (req, res, next) => {
  try {
    const body = z.object({ employeeId: z.string().min(1) }).parse(req.body);

    const device = await Device.findById(req.params.id);
    if (!device) throw new HttpError(404, "Device not found");
    if (device.status !== "available" || device.assignedEmployeeId) {
      throw new HttpError(400, "Device must be available to assign");
    }

    const employee = await Employee.findById(body.employeeId);
    if (!employee) throw new HttpError(400, "Employee not found");
    if (employee.status === "archived" || employee.status === "offboarding") {
      throw new HttpError(400, "Cannot assign device to archived/offboarding employee");
    }

    if (req.user.role === "customer") {
      if (!req.user.customerId) throw new HttpError(403, "Customer scope missing");

      const canSeeDevice =
        (device.ownerType === "customer" && String(device.customerId) === String(req.user.customerId)) ||
        device.ownerType === "belzir";
      if (!canSeeDevice) throw new HttpError(403, "Forbidden");

      if (String(employee.customerId) !== String(req.user.customerId)) throw new HttpError(403, "Forbidden");
    }

    const beforeDevice = device.toObject();
    const beforeEmployee = employee.toObject();

    // If employee already has a device, free it first
    if (employee.deviceId) {
      const oldDevice = await Device.findById(employee.deviceId);
      if (oldDevice) {
        oldDevice.status = "available";
        oldDevice.assignedEmployeeId = null;
        await oldDevice.save();
      }
    }

    device.status = "assigned";
    device.assignedEmployeeId = employee._id;
    await device.save();

    employee.deviceId = device._id;
    await employee.save();

    await writeAudit({
      req,
      action: "device.assign",
      entityType: "Device",
      entityId: device._id,
      before: beforeDevice,
      after: device.toObject(),
      meta: { employeeId: employee._id }
    });

    await writeAudit({
      req,
      action: "employee.device.assign",
      entityType: "Employee",
      entityId: employee._id,
      before: beforeEmployee,
      after: employee.toObject(),
      meta: { deviceId: device._id }
    });

    res.json({ item: device });
  } catch (e) {
    next(e);
  }
});

router.patch("/:id/unassign", requireAuth, requireRole("customer", "superadmin"), async (req, res, next) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) throw new HttpError(404, "Device not found");
    if (device.status !== "assigned" || !device.assignedEmployeeId) {
      throw new HttpError(400, "Device is not assigned");
    }

    const employee = await Employee.findById(device.assignedEmployeeId);

    if (req.user.role === "customer") {
      if (!req.user.customerId) throw new HttpError(403, "Customer scope missing");

      const canSeeDevice =
        (device.ownerType === "customer" && String(device.customerId) === String(req.user.customerId)) ||
        device.ownerType === "belzir";
      if (!canSeeDevice) throw new HttpError(403, "Forbidden");

      if (!employee || String(employee.customerId) !== String(req.user.customerId)) throw new HttpError(403, "Forbidden");
    }

    const beforeDevice = device.toObject();
    const beforeEmployee = employee ? employee.toObject() : null;

    device.status = "available";
    device.assignedEmployeeId = null;
    await device.save();

    if (employee && String(employee.deviceId) === String(beforeDevice._id)) {
      employee.deviceId = null;
      await employee.save();
    }

    await writeAudit({
      req,
      action: "device.unassign",
      entityType: "Device",
      entityId: device._id,
      before: beforeDevice,
      after: device.toObject(),
      meta: { employeeId: beforeDevice.assignedEmployeeId }
    });

    if (employee) {
      await writeAudit({
        req,
        action: "employee.device.unassign",
        entityType: "Employee",
        entityId: employee._id,
        before: beforeEmployee,
        after: employee.toObject(),
        meta: { deviceId: beforeDevice._id }
      });
    }

    res.json({ item: device });
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", requireAuth, requireRole("customer", "superadmin"), async (req, res, next) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) throw new HttpError(404, "Device not found");

    if (device.status !== "available" || device.assignedEmployeeId) {
      throw new HttpError(400, "Cannot delete an assigned device");
    }

    if (req.user.role === "customer") {
      if (device.ownerType !== "customer" || String(device.customerId) !== String(req.user.customerId)) {
        throw new HttpError(403, "Forbidden");
      }
      // already checked above
    }

    const before = device.toObject();
    await device.deleteOne();

    await writeAudit({
      req,
      action: "device.delete",
      entityType: "Device",
      entityId: before._id,
      before,
      after: null
    });

    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

module.exports = { devicesRouter: router };
