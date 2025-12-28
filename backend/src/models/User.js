const mongoose = require("mongoose");

const roles = ["superadmin", "partner", "customer"];

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: roles, index: true },

    // For scoping
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "Partner", default: null, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null, index: true },

    status: { type: String, enum: ["active", "inactive"], default: "active", index: true }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = { User, roles };
