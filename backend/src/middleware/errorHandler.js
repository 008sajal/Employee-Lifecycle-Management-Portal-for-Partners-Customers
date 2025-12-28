const { HttpError } = require("../utils/httpError");

function errorHandler(err, req, res, next) {
  const status = err instanceof HttpError ? err.status : 500;
  const message = err?.message || "Internal server error";

  if (process.env.NODE_ENV !== "test") {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(status).json({
    message,
    details: err instanceof HttpError ? err.details : undefined
  });
}

module.exports = { errorHandler };
