const mongoose = require("mongoose");

const partnerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    status: { type: String, enum: ["active", "inactive", "deleted"], default: "active", index: true },
    commissionRate: { type: Number, default: 0.05 }
  },
  { timestamps: true }
);

partnerSchema.index({ name: 1 }, { unique: true });

const Partner = mongoose.model("Partner", partnerSchema);

module.exports = { Partner };
