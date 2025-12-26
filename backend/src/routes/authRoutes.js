// Authentication Routes
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { generateToken, verifyToken } = require('../config/jwt');
const { hashPassword, comparePassword } = require('../utils/passwords');
const { logAuditAction, getClientIp, AUDIT_ACTIONS } = require('../utils/auditLogger');
const { authenticateToken } = require('../middleware/authMiddleware');
const { PLAN_LIMITS } = require('../config/constants');

// POST /api/auth/register-tenant - Register new tenant
router.post('/register-tenant', [
  body('tenantName').notEmpty().trim(),
  body('subdomain').notEmpty().matches(/^[a-z0-9-]+$/),
  body('adminEmail').isEmail().normalizeEmail(),
  body('adminPassword').isLength({ min: 8 }),
  body('adminFullName').notEmpty().trim()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { tenantName, subdomain, adminEmail, adminPassword, adminFullName } = req.body;

    // Check if subdomain already exists
    const subdmainCheck = await pool.query('SELECT id FROM tenants WHERE subdomain = $1', [subdomain]);
    if (subdmainCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Subdomain already exists'
      });
    }

    // Check if email already exists as tenant admin
    const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
    if (emailCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Hash password
    const passwordHash = await hashPassword(adminPassword);

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create tenant
      const tenantResult = await client.query(
        `INSERT INTO tenants (name, subdomain, subscription_plan, max_users, max_projects)
         VALUES ($1, $2, 'free', $3, $4)
         RETURNING *`,
        [tenantName, subdomain, PLAN_LIMITS.free.max_users, PLAN_LIMITS.free.max_projects]
      );

      const tenant = tenantResult.rows[0];

      // Create admin user
      const userResult = await client.query(
        `INSERT INTO users (tenant_id, email, password_hash, full_name, role, is_active)
         VALUES ($1, $2, $3, $4, 'tenant_admin', true)
         RETURNING id, email, full_name, role`,
        [tenant.id, adminEmail, passwordHash, adminFullName]
      );

      const adminUser = userResult.rows[0];

      // Log action
      await client.query(
        `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [tenant.id, adminUser.id, AUDIT_ACTIONS.TENANT_CREATED, 'tenant', tenant.id, getClientIp(req)]
      );

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        message: 'Tenant registered successfully',
        data: {
          tenantId: tenant.id,
          subdomain: tenant.subdomain,
          adminUser: {
            id: adminUser.id,
            email: adminUser.email,
            fullName: adminUser.full_name,
            role: adminUser.role
          }
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login - User login
router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty(),
  body('tenantSubdomain').notEmpty()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, tenantSubdomain } = req.body;

    // Find tenant
    const tenantResult = await pool.query(
      'SELECT id, status FROM tenants WHERE subdomain = $1',
      [tenantSubdomain]
    );

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    const tenant = tenantResult.rows[0];

    if (tenant.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Tenant is not active'
      });
    }

    // Find user in tenant
    const userResult = await pool.query(
      'SELECT id, password_hash, full_name, role, is_active FROM users WHERE email = $1 AND tenant_id = $2',
      [email, tenant.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive'
      });
    }

    // Verify password
    const passwordMatch = await comparePassword(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = generateToken(userResult.rows[0].id, tenant.id, user.role);

    // Log login
    await logAuditAction(
      tenant.id,
      user.id,
      AUDIT_ACTIONS.USER_LOGIN,
      'user',
      user.id,
      getClientIp(req)
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: email,
          fullName: user.full_name,
          role: user.role,
          tenantId: tenant.id
        },
        token: token,
        expiresIn: 86400
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me - Get current user
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const userResult = await pool.query(
      'SELECT id, email, full_name, role, is_active FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // Get tenant info
    const tenantResult = await pool.query(
      'SELECT id, name, subdomain, subscription_plan, max_users, max_projects FROM tenants WHERE id = $1',
      [req.user.tenantId]
    );

    const tenant = tenantResult.rows[0] || null;

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        isActive: user.is_active,
        tenant: tenant ? {
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain,
          subscriptionPlan: tenant.subscription_plan,
          maxUsers: tenant.max_users,
          maxProjects: tenant.max_projects
        } : null
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout - User logout
router.post('/logout', authenticateToken, async (req, res, next) => {
  try {
    // Log logout
    await logAuditAction(
      req.user.tenantId,
      req.user.userId,
      AUDIT_ACTIONS.USER_LOGOUT,
      'user',
      req.user.userId,
      getClientIp(req)
    );

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
