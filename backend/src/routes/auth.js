const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");

const { env } = require("../config/env");
const { User } = require("../models/User");
const { HttpError } = require("../utils/httpError");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();

router.post("/login", async (req, res, next) => {
  try {
    const body = z
      .object({
        email: z.string().email(),
        password: z.string().min(1)
      })
      .parse(req.body);

    const user = await User.findOne({ email: body.email.toLowerCase() });
    if (!user) throw new HttpError(401, "Invalid credentials");
    if (user.status !== "active") throw new HttpError(403, "User inactive");

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) throw new HttpError(401, "Invalid credentials");

    const accessToken = jwt.sign(
      { sub: String(user._id), role: user.role },
      env.jwtAccessSecret,
      { expiresIn: env.jwtAccessExpiresIn }
    );

    res.json({
      accessToken,
      user: {
        id: String(user._id),
        email: user.email,
        role: user.role,
        partnerId: user.partnerId,
        customerId: user.customerId
      }
    });
  } catch (e) {
    next(e);
  }
});

router.get("/me", requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = { authRouter: router };
