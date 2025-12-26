// User Routes
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { hashPassword } = require('../utils/passwords');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireTenantAdmin } = require('../middleware/authorizationMiddleware');
const { logAuditAction, getClientIp, AUDIT_ACTIONS } = require('../utils/auditLogger');
const { USER_ROLES, PLAN_LIMITS } = require('../config/constants');

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

    // Check tenant authorization
    if (req.user.tenantId !== tenantId && req.user.role !== USER_ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Check subscription limit
    const usersCount = await pool.query(
      'SELECT COUNT(*) FROM users WHERE tenant_id = $1',
      [tenantId]
    );

    const tenantResult = await pool.query(
      'SELECT max_users FROM tenants WHERE id = $1',
      [tenantId]
    );

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    const currentUsers = parseInt(usersCount.rows[0].count);
    const maxUsers = tenantResult.rows[0].max_users;

    if (currentUsers >= maxUsers) {
      return res.status(403).json({
        success: false,
        message: `User limit (${maxUsers}) reached for this tenant`
      });
    }

    // Check if email already exists in tenant
    const emailCheck = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND tenant_id = $2',
      [email, tenantId]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists in this tenant'
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const userResult = await pool.query(
      `INSERT INTO users (tenant_id, email, password_hash, full_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, email, full_name, role, is_active, created_at`,
      [tenantId, email, passwordHash, fullName, role]
    );

    const user = userResult.rows[0];

    // Log action
    await logAuditAction(
      tenantId,
      req.user.userId,
      AUDIT_ACTIONS.USER_CREATED,
      'user',
      user.id,
      getClientIp(req)
    );

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

    // Check tenant authorization
    if (req.user.tenantId !== tenantId && req.user.role !== USER_ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
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

    // Get total count
    const countResult = await pool.query(
      query.replace('SELECT *', 'SELECT COUNT(*)'),
      values
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated users
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
        users: users,
        total: total,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          limit: limit
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/:userId - Update user
router.put('/:userId', authenticateToken, [
  body('fullName').optional(),
  body('role').optional().isIn(['user', 'tenant_admin']),
  body('isActive').optional().isBoolean()
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

    const { userId } = req.params;
    const { fullName, role, isActive } = req.body;

    // Get user to check tenant
    const userResult = await pool.query(
      'SELECT tenant_id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userTenantId = userResult.rows[0].tenant_id;

    // Check authorization
    const isSelf = req.user.userId === userId;
    const isAdmin = req.user.role === USER_ROLES.TENANT_ADMIN || req.user.role === USER_ROLES.SUPER_ADMIN;
    const isTenantMember = req.user.tenantId === userTenantId;

    if (!isSelf && (!isAdmin || !isTenantMember)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Users can only update their own fullName
    if (isSelf && (role || isActive !== undefined)) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your full name'
      });
    }

    let query = 'UPDATE users SET ';
    const values = [];
    let paramCount = 1;

    if (fullName) {
      query += `full_name = $${paramCount}, `;
      values.push(fullName);
      paramCount++;
    }

    if (isAdmin && role) {
      query += `role = $${paramCount}, `;
      values.push(role);
      paramCount++;
    }

    if (isAdmin && isActive !== undefined) {
      query += `is_active = $${paramCount}, `;
      values.push(isActive);
      paramCount++;
    }

    query += `updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;
    values.push(userId);

    const result = await pool.query(query, values);
    const updatedUser = result.rows[0];

    // Log action
    await logAuditAction(
      userTenantId,
      req.user.userId,
      AUDIT_ACTIONS.USER_UPDATED,
      'user',
      userId,
      getClientIp(req)
    );

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: updatedUser.id,
        fullName: updatedUser.full_name,
        role: updatedUser.role,
        updatedAt: updatedUser.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/users/:userId - Delete user
router.delete('/:userId', authenticateToken, requireTenantAdmin, async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Get user to check tenant
    const userResult = await pool.query(
      'SELECT tenant_id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userTenantId = userResult.rows[0].tenant_id;

    // Check authorization
    if (req.user.tenantId !== userTenantId && req.user.role !== USER_ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Cannot delete self
    if (req.user.userId === userId) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete yourself'
      });
    }

    // Delete user (cascade will handle tasks)
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    // Log action
    await logAuditAction(
      userTenantId,
      req.user.userId,
      AUDIT_ACTIONS.USER_DELETED,
      'user',
      userId,
      getClientIp(req)
    );

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
