const mongoose = require("mongoose");

const systemSettingsSchema = new mongoose.Schema(
  {
    singleton: { type: String, default: "singleton", unique: true },

    companyName: { type: String, default: "Belzir", trim: true },
    supportEmail: { type: String, default: "support@belzir.dev", trim: true },

    defaultPartnerCommissionRate: { type: Number, default: 0.05 },
    maintenanceMode: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const SystemSettings = mongoose.model("SystemSettings", systemSettingsSchema);

module.exports = { SystemSettings };
