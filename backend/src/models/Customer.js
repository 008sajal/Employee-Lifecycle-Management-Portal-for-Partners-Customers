const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "Partner", required: true, index: true },
    name: { type: String, required: true, trim: true },
    status: { type: String, enum: ["active", "inactive", "deleted"], default: "active", index: true }
  },
  { timestamps: true }
);

customerSchema.index({ partnerId: 1, name: 1 }, { unique: true });

const Customer = mongoose.model("Customer", customerSchema);

module.exports = { Customer };
