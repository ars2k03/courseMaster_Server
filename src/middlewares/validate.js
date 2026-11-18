// middleware to validate request bodies against Zod schemas

const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    const issues = err.issues || err.errors || [];
    return res.status(400).json({
      message: "Validation error",
      errors: issues,
    });
  }
};

module.exports = validate;
