const { validationResult } = require('express-validator');

/**
 * Middleware that reads express-validator results and returns 400 if any errors exist.
 * Add this after your body() validators in a route definition.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    return res.status(400).json({
      success: false,
      message: messages[0],
      errors: messages,
    });
  }
  next();
};

module.exports = validate;
