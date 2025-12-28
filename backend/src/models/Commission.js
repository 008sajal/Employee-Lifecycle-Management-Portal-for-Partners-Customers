const mongoose = require("mongoose");

const commissionSchema = new mongoose.Schema(
  {
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "Partner", required: true, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    deviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Device", default: null, index: true },

    kind: { type: String, enum: ["purchase", "lease"], required: true, index: true },
    amount: { type: Number, required: true }
  },
  { timestamps: true }
);

commissionSchema.index({ partnerId: 1, customerId: 1, createdAt: -1 });

const Commission = mongoose.model("Commission", commissionSchema);

module.exports = { Commission };
