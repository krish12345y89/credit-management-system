const Joi = require('joi');

const signupSchema = Joi.object({
  email: Joi.string().email().required().normalize(),
  password: Joi.string().min(8).required(),
  name: Joi.string().min(2).max(50).required().trim()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().normalize(),
  password: Joi.string().required()
});

const addCreditsSchema = Joi.object({
  userId: Joi.string().required(),
  amount: Joi.number().integer().positive().required()
});

const createApiKeySchema = Joi.object({
  name: Joi.string().min(1).max(50).required().trim(),
  user: Joi.string().required(),
  scopes: Joi.array().items(Joi.string().valid('read', 'write', 'delete')).min(1).required(),
  expiresInDays: Joi.number().integer().min(1).max(365).default(90)
});

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    
    req.body = value;
    next();
  };
};

module.exports = {
  validateSignup: validate(signupSchema),
  validateLogin: validate(loginSchema),
  validateAddCredits: validate(addCreditsSchema),
  validateCreateApiKey: validate(createApiKeySchema)
};
