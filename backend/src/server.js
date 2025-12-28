const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const { env } = require("./config/env");
const { connectDb } = require("./db/connect");
const { errorHandler } = require("./middleware/errorHandler");

const { authRouter } = require("./routes/auth");
const { employeesRouter } = require("./routes/employees");
const { devicesRouter } = require("./routes/devices");
const { partnersRouter } = require("./routes/partners");
const { customersRouter } = require("./routes/customers");
const { commissionsRouter } = require("./routes/commissions");
const { auditLogsRouter } = require("./routes/auditLogs");
const { settingsRouter } = require("./routes/settings");

async function main() {
  await connectDb();

  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json());
  app.use(morgan("dev"));

  app.get("/", (req, res) => {
    res.json({
      name: "Belzir API",
      health: "/health",
      routes: ["/auth", "/employees", "/devices", "/partners", "/customers", "/commissions", "/audit-logs", "/settings"]
    });
  });

  app.get("/health", (req, res) => res.json({ ok: true }));

  app.use("/auth", authRouter);
  app.use("/employees", employeesRouter);
  app.use("/devices", devicesRouter);
  app.use("/partners", partnersRouter);
  app.use("/customers", customersRouter);
  app.use("/commissions", commissionsRouter);
  app.use("/audit-logs", auditLogsRouter);
  app.use("/settings", settingsRouter);

  app.use(errorHandler);

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${env.port}`);
  });
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
