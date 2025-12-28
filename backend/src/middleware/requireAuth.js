const jwt = require("jsonwebtoken");
const { env } = require("../config/env");
const { HttpError } = require("../utils/httpError");
const { User } = require("../models/User");

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw new HttpError(401, "Missing Authorization header");
    }

    const token = header.slice("Bearer ".length);
    const payload = jwt.verify(token, env.jwtAccessSecret);

    const user = await User.findById(payload.sub).lean();
    if (!user || user.status !== "active") {
      throw new HttpError(401, "Invalid user");
    }

    req.user = {
      id: String(user._id),
      role: user.role,
      partnerId: user.partnerId ? String(user.partnerId) : null,
      customerId: user.customerId ? String(user.customerId) : null
    };

    next();
  } catch (e) {
    next(e);
  }
}

module.exports = { requireAuth };
