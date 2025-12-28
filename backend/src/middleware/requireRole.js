const { HttpError } = require("../utils/httpError");

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new HttpError(401, "Unauthorized"));
    if (!roles.includes(req.user.role)) {
      return next(new HttpError(403, "Forbidden"));
    }
    next();
  };
}

module.exports = { requireRole };
