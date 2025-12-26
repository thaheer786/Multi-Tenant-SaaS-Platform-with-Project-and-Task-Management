// Input validation utilities
const { body, validationResult } = require('express-validator');

// Validation rules
const validators = {
  // Email validation
  email: body('email').isEmail().normalizeEmail(),
  
  // Password validation (min 8 chars)
  password: body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  
  // Tenant name validation
  tenantName: body('tenantName')
    .isLength({ min: 2, max: 255 })
    .withMessage('Tenant name must be between 2 and 255 characters'),
  
  // Subdomain validation (alphanumeric, hyphens, no spaces)
  subdomain: body('subdomain')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Subdomain can only contain lowercase letters, numbers, and hyphens'),
  
  // Full name validation
  fullName: body('fullName')
    .isLength({ min: 2, max: 255 })
    .withMessage('Full name must be between 2 and 255 characters'),
  
  // UUID validation
  uuid: (paramName) => body(paramName).isUUID().withMessage('Invalid UUID format'),
  
  // Project name validation
  projectName: body('name')
    .isLength({ min: 1, max: 255 })
    .withMessage('Project name must be between 1 and 255 characters'),
  
  // Task title validation
  taskTitle: body('title')
    .isLength({ min: 1, max: 255 })
    .withMessage('Task title must be between 1 and 255 characters'),
  
  // Role validation
  role: body('role').isIn(['user', 'tenant_admin']).withMessage('Invalid role'),
  
  // Status validations
  tenantStatus: body('status').isIn(['active', 'suspended', 'trial']).withMessage('Invalid tenant status'),
  projectStatus: body('status').isIn(['active', 'archived', 'completed']).withMessage('Invalid project status'),
  taskStatus: body('status').isIn(['todo', 'in_progress', 'completed']).withMessage('Invalid task status'),
  
  // Priority validation
  priority: body('priority').isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  
  // Plan validation
  subscriptionPlan: body('subscriptionPlan').isIn(['free', 'pro', 'enterprise']).withMessage('Invalid subscription plan')
};

// Middleware to check validation errors
const checkValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

module.exports = {
  validators,
  checkValidationErrors
};
