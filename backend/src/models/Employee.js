const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },

    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    location: { type: String, required: true, trim: true },

    jobTitle: { type: String, default: null, trim: true },
    department: { type: String, default: null, trim: true },
    startDate: { type: Date, default: null },

    status: {
      type: String,
      enum: ["onboarding", "active", "offboarding", "leave", "archived"],
      default: "onboarding",
      index: true
    },

    onboardingStep: { type: Number, enum: [1, 2], default: 1 },
    offboardingStep: { type: Number, enum: [1, 2, 3], default: null },

    deviceAcquisitionOption: {
      type: Number,
      enum: [1, 2, 3, 4],
      default: null
    },

    deviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Device", default: null, index: true },
    setupApproved: { type: Boolean, default: false },
    deviceApproved: { type: Boolean, default: false },

    accountDisabled: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Uniqueness rule: email must be unique within a customer
employeeSchema.index({ customerId: 1, email: 1 }, { unique: true });
employeeSchema.index({ status: 1, customerId: 1 });

const Employee = mongoose.model("Employee", employeeSchema);

module.exports = { Employee };
