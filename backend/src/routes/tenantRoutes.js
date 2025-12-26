// Tenant Routes
const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireSuperAdmin, requireTenantAdmin, requireTenantAccess } = require('../middleware/authorizationMiddleware');
const { logAuditAction, getClientIp, AUDIT_ACTIONS } = require('../utils/auditLogger');
const { USER_ROLES } = require('../config/constants');

// GET /api/tenants/:tenantId - Get tenant details
router.get('/:tenantId', authenticateToken, async (req, res, next) => {
  try {
    const { tenantId } = req.params;

    // Check authorization
    if (req.user.role !== USER_ROLES.SUPER_ADMIN && req.user.tenantId !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    const tenantResult = await pool.query(
      'SELECT * FROM tenants WHERE id = $1',
      [tenantId]
    );

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    const tenant = tenantResult.rows[0];

    // Get statistics
    const usersCount = await pool.query(
      'SELECT COUNT(*) FROM users WHERE tenant_id = $1',
      [tenantId]
    );

    const projectsCount = await pool.query(
      'SELECT COUNT(*) FROM projects WHERE tenant_id = $1',
      [tenantId]
    );

    const tasksCount = await pool.query(
      'SELECT COUNT(*) FROM tasks WHERE tenant_id = $1',
      [tenantId]
    );

    res.json({
      success: true,
      data: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        status: tenant.status,
        subscriptionPlan: tenant.subscription_plan,
        maxUsers: tenant.max_users,
        maxProjects: tenant.max_projects,
        createdAt: tenant.created_at,
        updatedAt: tenant.updated_at,
        stats: {
          totalUsers: parseInt(usersCount.rows[0].count),
          totalProjects: parseInt(projectsCount.rows[0].count),
          totalTasks: parseInt(tasksCount.rows[0].count)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/tenants/:tenantId - Update tenant
router.put('/:tenantId', authenticateToken, requireTenantAdmin, async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const { name, status, subscriptionPlan, maxUsers, maxProjects } = req.body;

    // Check authorization
    if (req.user.role !== USER_ROLES.SUPER_ADMIN && req.user.tenantId !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    // Tenant admins can only update name
    if (req.user.role === USER_ROLES.TENANT_ADMIN && (status || subscriptionPlan || maxUsers || maxProjects)) {
      return res.status(403).json({
        success: false,
        message: 'You can only update tenant name'
      });
    }

    let query = 'UPDATE tenants SET ';
    const values = [];
    let paramCount = 1;

    if (name) {
      query += `name = $${paramCount}, `;
      values.push(name);
      paramCount++;
    }

    if (req.user.role === USER_ROLES.SUPER_ADMIN) {
      if (status) {
        query += `status = $${paramCount}, `;
        values.push(status);
        paramCount++;
      }
      if (subscriptionPlan) {
        query += `subscription_plan = $${paramCount}, `;
        values.push(subscriptionPlan);
        paramCount++;
      }
      if (maxUsers) {
        query += `max_users = $${paramCount}, `;
        values.push(maxUsers);
        paramCount++;
      }
      if (maxProjects) {
        query += `max_projects = $${paramCount}, `;
        values.push(maxProjects);
        paramCount++;
      }
    }

    query += `updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;
    values.push(tenantId);

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    const tenant = result.rows[0];

    // Log action
    await logAuditAction(
      tenantId,
      req.user.userId,
      AUDIT_ACTIONS.TENANT_UPDATED,
      'tenant',
      tenantId,
      getClientIp(req)
    );

    res.json({
      success: true,
      message: 'Tenant updated successfully',
      data: {
        id: tenant.id,
        name: tenant.name,
        updatedAt: tenant.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/tenants - List all tenants (super_admin only)
router.get('/', authenticateToken, requireSuperAdmin, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const offset = (page - 1) * limit;

    const countResult = await pool.query('SELECT COUNT(*) FROM tenants');
    const totalTenants = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalTenants / limit);

    const tenantsResult = await pool.query(
      'SELECT * FROM tenants ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    // Get user counts for each tenant
    const tenantsWithStats = await Promise.all(
      tenantsResult.rows.map(async (tenant) => {
        const usersCount = await pool.query(
          'SELECT COUNT(*) FROM users WHERE tenant_id = $1',
          [tenant.id]
        );
        const projectsCount = await pool.query(
          'SELECT COUNT(*) FROM projects WHERE tenant_id = $1',
          [tenant.id]
        );

        return {
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain,
          status: tenant.status,
          subscriptionPlan: tenant.subscription_plan,
          totalUsers: parseInt(usersCount.rows[0].count),
          totalProjects: parseInt(projectsCount.rows[0].count),
          createdAt: tenant.created_at
        };
      })
    );

    res.json({
      success: true,
      data: {
        tenants: tenantsWithStats,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalTenants: totalTenants,
          limit: limit
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
