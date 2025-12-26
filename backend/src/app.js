// Main Express Application Setup
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');
const { authenticateToken } = require('./middleware/authMiddleware');

// Import routes
const authRoutes = require('./routes/authRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const userRoutes = require('./routes/userRoutes');
const tenantUserRoutes = require('./routes/tenantUserRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint (no auth required)
app.get('/api/health', async (req, res) => {
  try {
    const pool = require('./config/database');
    // Test database connection
    await pool.query('SELECT NOW()');
    
    res.json({
      success: true,
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'error',
      database: 'disconnected',
      error: error.message
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
// Mount tenant user operations under /api/tenants
app.use('/api/tenants', tenantUserRoutes);
// Mount user operations (update/delete) under /api/users
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
// Mount task operations under /api/projects to support /api/projects/:projectId/tasks
app.use('/api/projects', taskRoutes);
// Also mount task-level operations under /api/tasks for update/status/delete
app.use('/api/tasks', taskRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;
