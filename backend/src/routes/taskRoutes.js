// Task Routes
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/authMiddleware');
const { logAuditAction, getClientIp, AUDIT_ACTIONS } = require('../utils/auditLogger');
const { USER_ROLES } = require('../config/constants');

// POST /api/projects/:projectId/tasks - Create task
router.post('/:projectId/tasks', authenticateToken, [
  body('title').notEmpty(),
  body('description').optional(),
  // Accept UUIDs using the same relaxed pattern used in update
  body('assignedTo').optional().custom(value => !value || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('dueDate').optional().isISO8601()
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
    const { title, description, assignedTo, priority = 'medium', dueDate } = req.body;
    const tenantId = req.user.tenantId;

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

    if (project.tenant_id !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Check assigned_to user
    if (assignedTo) {
      const userResult = await pool.query(
        'SELECT id FROM users WHERE id = $1 AND tenant_id = $2',
        [assignedTo, tenantId]
      );

      if (userResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Assigned user not found in this tenant'
        });
      }
    }

    // Create task
    const taskResult = await pool.query(
      `INSERT INTO tasks (project_id, tenant_id, title, description, priority, assigned_to, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [projectId, tenantId, title, description, priority, assignedTo || null, dueDate || null]
    );

    const task = taskResult.rows[0];

    // Log action
    await logAuditAction(
      tenantId,
      req.user.userId,
      AUDIT_ACTIONS.TASK_CREATED,
      'task',
      task.id,
      getClientIp(req)
    );

    res.status(201).json({
      success: true,
      data: {
        id: task.id,
        projectId: task.project_id,
        tenantId: task.tenant_id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assignedTo: task.assigned_to,
        dueDate: task.due_date,
        createdAt: task.created_at
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:projectId/tasks - List project tasks
router.get('/:projectId/tasks', authenticateToken, async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const status = req.query.status;
    const assignedTo = req.query.assignedTo;
    const priority = req.query.priority;
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = (page - 1) * limit;
    const tenantId = req.user.tenantId;

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

    if (project.tenant_id !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    let query = 'SELECT * FROM tasks WHERE project_id = $1 AND tenant_id = $2';
    const values = [projectId, tenantId];
    let paramCount = 3;

    if (status) {
      query += ` AND status = $${paramCount}`;
      values.push(status);
      paramCount++;
    }

    if (assignedTo) {
      query += ` AND assigned_to = $${paramCount}`;
      values.push(assignedTo);
      paramCount++;
    }

    if (priority) {
      query += ` AND priority = $${paramCount}`;
      values.push(priority);
      paramCount++;
    }

    if (search) {
      query += ` AND title ILIKE $${paramCount}`;
      values.push(`%${search}%`);
      paramCount++;
    }

    // Get count
    const countResult = await pool.query(
      query.replace('SELECT *', 'SELECT COUNT(*)'),
      values
    );
    const total = parseInt(countResult.rows[0].count);

    // Get tasks with pagination
    query += ` ORDER BY priority DESC, due_date ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const tasksResult = await pool.query(query, values);

    // Get assigned user info for each task
    const tasks = await Promise.all(
      tasksResult.rows.map(async (task) => {
        let assignedUser = null;
        if (task.assigned_to) {
          const userResult = await pool.query(
            'SELECT id, full_name, email FROM users WHERE id = $1',
            [task.assigned_to]
          );
          if (userResult.rows.length > 0) {
            const user = userResult.rows[0];
            assignedUser = {
              id: user.id,
              fullName: user.full_name,
              email: user.email
            };
          }
        }

        return {
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          assignedTo: assignedUser,
          dueDate: task.due_date,
          createdAt: task.created_at
        };
      })
    );

    res.json({
      success: true,
      data: {
        tasks: tasks,
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

// PUT /api/tasks/:taskId - Update task
router.put('/:taskId', authenticateToken, [
  body('title').optional(),
  body('description').optional(),
  body('status').optional().isIn(['todo', 'in_progress', 'completed']),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('assignedTo').optional().custom(value => !value || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)),
  body('dueDate').optional().isISO8601()
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

    const { taskId } = req.params;
    const { title, description, status, priority, assignedTo, dueDate } = req.body;
    const tenantId = req.user.tenantId;

    // Get task
    const taskResult = await pool.query(
      'SELECT * FROM tasks WHERE id = $1',
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const task = taskResult.rows[0];

    if (task.tenant_id !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Check assigned_to user
    if (assignedTo && assignedTo !== '') {
      const userResult = await pool.query(
        'SELECT id FROM users WHERE id = $1 AND tenant_id = $2',
        [assignedTo, tenantId]
      );

      if (userResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Assigned user not found in this tenant'
        });
      }
    }

    // Update task
    let query = 'UPDATE tasks SET ';
    const values = [];
    let paramCount = 1;

    if (title) {
      query += `title = $${paramCount}, `;
      values.push(title);
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

    if (priority) {
      query += `priority = $${paramCount}, `;
      values.push(priority);
      paramCount++;
    }

    if (assignedTo !== undefined) {
      query += `assigned_to = $${paramCount}, `;
      values.push(assignedTo || null);
      paramCount++;
    }

    if (dueDate !== undefined) {
      query += `due_date = $${paramCount}, `;
      values.push(dueDate || null);
      paramCount++;
    }

    query += `updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;
    values.push(taskId);

    const updatedResult = await pool.query(query, values);
    const updatedTask = updatedResult.rows[0];

    // Get assigned user info
    let assignedUserInfo = null;
    if (updatedTask.assigned_to) {
      const userResult = await pool.query(
        'SELECT id, full_name, email FROM users WHERE id = $1',
        [updatedTask.assigned_to]
      );
      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        assignedUserInfo = {
          id: user.id,
          fullName: user.full_name,
          email: user.email
        };
      }
    }

    // Log action
    await logAuditAction(
      tenantId,
      req.user.userId,
      AUDIT_ACTIONS.TASK_UPDATED,
      'task',
      taskId,
      getClientIp(req)
    );

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: {
        id: updatedTask.id,
        title: updatedTask.title,
        description: updatedTask.description,
        status: updatedTask.status,
        priority: updatedTask.priority,
        assignedTo: assignedUserInfo,
        dueDate: updatedTask.due_date,
        updatedAt: updatedTask.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/tasks/:taskId/status - Update task status only
router.patch('/:taskId/status', authenticateToken, [
  body('status').notEmpty().isIn(['todo', 'in_progress', 'completed'])
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

    const { taskId } = req.params;
    const { status } = req.body;
    const tenantId = req.user.tenantId;

    // Get task
    const taskResult = await pool.query(
      'SELECT * FROM tasks WHERE id = $1',
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const task = taskResult.rows[0];

    if (task.tenant_id !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Update status
    const updatedResult = await pool.query(
      'UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, taskId]
    );

    const updatedTask = updatedResult.rows[0];

    // Log action
    await logAuditAction(
      tenantId,
      req.user.userId,
      AUDIT_ACTIONS.TASK_STATUS_UPDATED,
      'task',
      taskId,
      getClientIp(req)
    );

    res.json({
      success: true,
      data: {
        id: updatedTask.id,
        status: updatedTask.status,
        updatedAt: updatedTask.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/tasks/:taskId - Delete task
router.delete('/:taskId', authenticateToken, async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const tenantId = req.user.tenantId;

    // Get task
    const taskResult = await pool.query(
      'SELECT * FROM tasks WHERE id = $1',
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const task = taskResult.rows[0];

    if (task.tenant_id !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Delete task
    await pool.query('DELETE FROM tasks WHERE id = $1', [taskId]);

    // Log action
    await logAuditAction(
      tenantId,
      req.user.userId,
      AUDIT_ACTIONS.TASK_DELETED,
      'task',
      taskId,
      getClientIp(req)
    );

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
