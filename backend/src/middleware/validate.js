/**
 * Validates req.body against a Zod schema, replacing it with the parsed
 * (and type-coerced/trimmed) result on success, or responding 400 with the
 * first validation issue on failure.
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const message = result.error.issues?.[0]?.message || 'Invalid request body';
    return res.status(400).json({ success: false, message });
  }
  req.body = result.data;
  next();
};

module.exports = validate;
