const dotenv = require("dotenv");

dotenv.config();

function mustGet(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function getOrDefault(name, defaultValue) {
  return process.env[name] || defaultValue;
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  mongodbUri: getOrDefault("MONGODB_URI", "mongodb://127.0.0.1:27017/belzir"),
  jwtAccessSecret: getOrDefault("JWT_ACCESS_SECRET", "dev-secret-change-me"),
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "8h",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000"
};

module.exports = { env };
