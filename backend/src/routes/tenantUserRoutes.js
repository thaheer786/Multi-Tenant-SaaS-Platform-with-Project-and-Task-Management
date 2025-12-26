// Tenant User Routes (mounted under /api/tenants)
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { hashPassword } = require('../utils/passwords');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireTenantAdmin } = require('../middleware/authorizationMiddleware');
const { logAuditAction, getClientIp, AUDIT_ACTIONS } = require('../utils/auditLogger');
const { USER_ROLES } = require('../config/constants');

// POST /api/tenants/:tenantId/users - Add user to tenant
router.post('/:tenantId/users', authenticateToken, requireTenantAdmin, [
  body('email').isEmail(),
  body('password').isLength({ min: 8 }),
  body('fullName').notEmpty(),
  body('role').isIn(['user', 'tenant_admin'])
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

    const { tenantId } = req.params;
    const { email, password, fullName, role = 'user' } = req.body;

    if (req.user.tenantId !== tenantId && req.user.role !== USER_ROLES.SUPER_ADMIN) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const usersCount = await pool.query('SELECT COUNT(*) FROM users WHERE tenant_id = $1', [tenantId]);
    const tenantResult = await pool.query('SELECT max_users FROM tenants WHERE id = $1', [tenantId]);
    if (tenantResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }
    const currentUsers = parseInt(usersCount.rows[0].count);
    const maxUsers = tenantResult.rows[0].max_users;
    if (currentUsers >= maxUsers) {
      return res.status(403).json({ success: false, message: `User limit (${maxUsers}) reached for this tenant` });
    }

    const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1 AND tenant_id = $2', [email, tenantId]);
    if (emailCheck.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already exists in this tenant' });
    }

    const passwordHash = await hashPassword(password);
    const userResult = await pool.query(
      `INSERT INTO users (tenant_id, email, password_hash, full_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, email, full_name, role, is_active, created_at`,
      [tenantId, email, passwordHash, fullName, role]
    );

    const user = userResult.rows[0];
    await logAuditAction(tenantId, req.user.userId, AUDIT_ACTIONS.USER_CREATED, 'user', user.id, getClientIp(req));

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        tenantId: tenantId,
        isActive: user.is_active,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/tenants/:tenantId/users - List tenant users
router.get('/:tenantId/users', authenticateToken, async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const search = req.query.search || '';
    const role = req.query.role;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = (page - 1) * limit;

    if (req.user.tenantId !== tenantId && req.user.role !== USER_ROLES.SUPER_ADMIN) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    let query = 'SELECT * FROM users WHERE tenant_id = $1';
    const values = [tenantId];
    let paramCount = 2;

    if (search) {
      query += ` AND (email ILIKE $${paramCount} OR full_name ILIKE $${paramCount})`;
      values.push(`%${search}%`);
      paramCount++;
    }

    if (role) {
      query += ` AND role = $${paramCount}`;
      values.push(role);
      paramCount++;
    }

    const countResult = await pool.query(query.replace('SELECT *', 'SELECT COUNT(*)'), values);
    const total = parseInt(countResult.rows[0].count);

    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const usersResult = await pool.query(query, values);
    const users = usersResult.rows.map(user => ({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      isActive: user.is_active,
      createdAt: user.created_at
    }));

    res.json({
      success: true,
      data: {
        users,
        total,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          limit
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;