// Project Routes
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/authMiddleware');
const { logAuditAction, getClientIp, AUDIT_ACTIONS } = require('../utils/auditLogger');
const { USER_ROLES, PLAN_LIMITS } = require('../config/constants');

// POST /api/projects - Create project
router.post('/', authenticateToken, [
  body('name').notEmpty(),
  body('description').optional(),
  body('status').optional().isIn(['active', 'archived', 'completed'])
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

    const { name, description, status = 'active' } = req.body;
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;

    // Check project limit
    const projectsCount = await pool.query(
      'SELECT COUNT(*) FROM projects WHERE tenant_id = $1',
      [tenantId]
    );

    const tenantResult = await pool.query(
      'SELECT max_projects FROM tenants WHERE id = $1',
      [tenantId]
    );

    const currentProjects = parseInt(projectsCount.rows[0].count);
    const maxProjects = tenantResult.rows[0].max_projects;

    if (currentProjects >= maxProjects) {
      return res.status(403).json({
        success: false,
        message: `Project limit (${maxProjects}) reached for this tenant`
      });
    }

    // Create project
    const projectResult = await pool.query(
      `INSERT INTO projects (tenant_id, name, description, status, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [tenantId, name, description, status, userId]
    );

    const project = projectResult.rows[0];

    // Log action
    await logAuditAction(
      tenantId,
      userId,
      AUDIT_ACTIONS.PROJECT_CREATED,
      'project',
      project.id,
      getClientIp(req)
    );

    res.status(201).json({
      success: true,
      data: {
        id: project.id,
        tenantId: project.tenant_id,
        name: project.name,
        description: project.description,
        status: project.status,
        createdBy: project.created_by,
        createdAt: project.created_at
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/projects - List projects
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const status = req.query.status;
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM projects WHERE tenant_id = $1';
    const values = [tenantId];
    let paramCount = 2;

    if (status) {
      query += ` AND status = $${paramCount}`;
      values.push(status);
      paramCount++;
    }

    if (search) {
      query += ` AND name ILIKE $${paramCount}`;
      values.push(`%${search}%`);
      paramCount++;
    }

    // Get count
    const countResult = await pool.query(
      query.replace('SELECT *', 'SELECT COUNT(*)'),
      values
    );
    const total = parseInt(countResult.rows[0].count);

    // Get projects with pagination
    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const projectsResult = await pool.query(query, values);

    // Get task counts and creator info for each project
    const projects = await Promise.all(
      projectsResult.rows.map(async (project) => {
        const tasksCount = await pool.query(
          'SELECT COUNT(*) FROM tasks WHERE project_id = $1',
          [project.id]
        );

        const completedCount = await pool.query(
          'SELECT COUNT(*) FROM tasks WHERE project_id = $1 AND status = $2',
          [project.id, 'completed']
        );

        const creatorResult = await pool.query(
          'SELECT id, full_name FROM users WHERE id = $1',
          [project.created_by]
        );

        const creator = creatorResult.rows[0];

        return {
          id: project.id,
          name: project.name,
          description: project.description,
          status: project.status,
          createdBy: creator ? { id: creator.id, fullName: creator.full_name } : null,
          taskCount: parseInt(tasksCount.rows[0].count),
          completedTaskCount: parseInt(completedCount.rows[0].count),
          createdAt: project.created_at
        };
      })
    );

    res.json({
      success: true,
      data: {
        projects: projects,
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

// PUT /api/projects/:projectId - Update project
router.put('/:projectId', authenticateToken, [
  body('name').optional(),
  body('description').optional(),
  body('status').optional().isIn(['active', 'archived', 'completed'])
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

    const { projectId } = req.params;
    const { name, description, status } = req.body;
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;

    // Get project
    const projectResult = await pool.query(
      'SELECT * FROM projects WHERE id = $1',
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const project = projectResult.rows[0];

    // Check authorization (creator or tenant_admin or super_admin)
    if (project.tenant_id !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (project.created_by !== userId && req.user.role !== USER_ROLES.TENANT_ADMIN && req.user.role !== USER_ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Update project
    let query = 'UPDATE projects SET ';
    const values = [];
    let paramCount = 1;

    if (name) {
      query += `name = $${paramCount}, `;
      values.push(name);
      paramCount++;
    }

    if (description !== undefined) {
      query += `description = $${paramCount}, `;
      values.push(description);
      paramCount++;
    }

    if (status) {
      query += `status = $${paramCount}, `;
      values.push(status);
      paramCount++;
    }

    query += `updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;
    values.push(projectId);

    const updatedResult = await pool.query(query, values);
    const updatedProject = updatedResult.rows[0];

    // Log action
    await logAuditAction(
      tenantId,
      userId,
      AUDIT_ACTIONS.PROJECT_UPDATED,
      'project',
      projectId,
      getClientIp(req)
    );

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: {
        id: updatedProject.id,
        name: updatedProject.name,
        description: updatedProject.description,
        status: updatedProject.status,
        updatedAt: updatedProject.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/projects/:projectId - Delete project
router.delete('/:projectId', authenticateToken, async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;

    // Get project
    const projectResult = await pool.query(
      'SELECT * FROM projects WHERE id = $1',
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const project = projectResult.rows[0];

    // Check authorization
    if (project.tenant_id !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (project.created_by !== userId && req.user.role !== USER_ROLES.TENANT_ADMIN && req.user.role !== USER_ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Delete project (cascade will handle tasks)
    await pool.query('DELETE FROM projects WHERE id = $1', [projectId]);

    // Log action
    await logAuditAction(
      tenantId,
      userId,
      AUDIT_ACTIONS.PROJECT_DELETED,
      'project',
      projectId,
      getClientIp(req)
    );

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
