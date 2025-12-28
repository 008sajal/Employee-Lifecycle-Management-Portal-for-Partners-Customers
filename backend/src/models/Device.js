const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    os: { type: String, enum: ["windows", "macos", "linux", "other"], default: "other", index: true },

    ownerType: { type: String, enum: ["customer", "belzir"], required: true, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null, index: true },

    status: { type: String, enum: ["available", "assigned"], default: "available", index: true },
    assignedEmployeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null, index: true },

    cyberProtectionEnabled: { type: Boolean, default: false },
    encryptionEnabled: { type: Boolean, default: false }
  },
  { timestamps: true }
);

deviceSchema.index({ customerId: 1, status: 1 });

const Device = mongoose.model("Device", deviceSchema);

module.exports = { Device };
