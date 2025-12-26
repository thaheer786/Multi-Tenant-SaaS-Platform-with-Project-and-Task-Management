# Implementation Guide - Multi-Tenant SaaS Platform

This document provides detailed implementation guidance, RBAC matrix, subscription limits, and best practices for the multi-tenant SaaS platform.

## Table of Contents

- [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
- [Subscription Plans & Limits](#subscription-plans--limits)
- [Data Isolation Strategy](#data-isolation-strategy)
- [Audit Logging](#audit-logging)
- [Error Handling](#error-handling)
- [Security Best Practices](#security-best-practices)
- [Performance Considerations](#performance-considerations)

## Role-Based Access Control (RBAC)

### User Roles

The platform supports three user roles with hierarchical permissions:

#### 1. super_admin
- **Scope**: Platform-wide access
- **Tenant**: None (operates across all tenants)
- **Key Permissions**:
  - List all tenants with pagination
  - Update tenant subscription plans and limits
  - View audit logs across all tenants (future enhancement)
  - Cannot manage individual tenant users directly

#### 2. tenant_admin
- **Scope**: Single tenant (their organization)
- **Tenant**: Required (owns a specific tenant)
- **Key Permissions**:
  - Manage all users within their tenant
  - Create, update, delete projects
  - Create, update, delete tasks
  - Update tenant name (not subscription plan)
  - View tenant statistics (users, projects, tasks)
  - Cannot access other tenants' data

#### 3. user
- **Scope**: Single tenant (their organization)
- **Tenant**: Required (same as tenant_admin)
- **Key Permissions**:
  - Update own full name only
  - Create projects
  - Create tasks
  - Update own task assignments and status
  - View projects and tasks
  - Cannot manage users or delete projects/tasks
  - Cannot update own role or isActive status

### RBAC Matrix by Endpoint

| Endpoint | super_admin | tenant_admin | user |
|----------|-------------|--------------|------|
| POST /auth/register-tenant | No | No | No |
| POST /auth/login | Yes | Yes | Yes |
| GET /auth/me | Yes | Yes | Yes |
| POST /auth/logout | Yes | Yes | Yes |
| GET /api/tenants | Yes | No | No |
| GET /api/tenants/:tenantId | Yes | Yes* | Yes* |
| PUT /api/tenants/:tenantId | Yes (all) | Admin only (name) | No |
| POST /api/tenants/:tenantId/users | Yes | Yes | No |
| GET /api/tenants/:tenantId/users | Yes | Yes | Yes |
| PUT /api/users/:userId | Yes | Yes* | Self only |
| DELETE /api/users/:userId | Yes | Yes | No |
| POST /api/projects | Yes | Yes | Yes |
| GET /api/projects | Yes | Yes | Yes |
| PUT /api/projects/:projectId | Yes | Yes* | Creator only |
| DELETE /api/projects/:projectId | Yes | Yes* | Creator only |
| POST /api/projects/:projectId/tasks | Yes | Yes | Yes |
| GET /api/projects/:projectId/tasks | Yes | Yes | Yes |
| PUT /api/tasks/:taskId | Yes | Yes* | Creator only |
| PATCH /api/tasks/:taskId/status | Yes | Yes | Yes |
| DELETE /api/tasks/:taskId | Yes | Yes* | Creator only |

**\* = Tenant-scoped access (can only access own tenant's resources)**

## Subscription Plans & Limits

### Free Plan
- **Max Users**: 5
- **Max Projects**: 3
- **Monthly Cost**: $0
- **Features**: Basic project and task management
- **Audit Log Retention**: 30 days

### Pro Plan
- **Max Users**: 25
- **Max Projects**: 15
- **Monthly Cost**: $99
- **Features**: All Free features + advanced reporting
- **Audit Log Retention**: 90 days

### Enterprise Plan
- **Max Users**: 100
- **Max Projects**: 50
- **Monthly Cost**: Custom
- **Features**: All Pro features + dedicated support
- **Audit Log Retention**: 365 days

### Enforcement

Limits are enforced at creation time:

```javascript
// Example: User limit check
const currentUserCount = await getActiveTenantUserCount(tenantId);
const tenant = await getTenantPlan(tenantId);
const maxUsers = SUBSCRIPTION_LIMITS[tenant.subscriptionPlan].maxUsers;

if (currentUserCount >= maxUsers) {
  return res.status(409).json({
    success: false,
    message: `User limit (${maxUsers}) exceeded for ${tenant.subscriptionPlan} plan`
  });
}
```

## Data Isolation Strategy

### Multi-Tenancy Model

The platform uses **shared database, shared schema, row-level isolation**:

- **Database**: Single PostgreSQL instance
- **Schema**: All tables in public schema
- **Isolation**: tenant_id column on all tables enforces data separation
- **Enforcement**: Middleware validates tenant_id matches authenticated user's tenant

### Isolation Enforcement

```javascript
// middleware/authMiddleware.js
const authenticateToken = (req, res, next) => {
  // Extract token and decode
  // Attach user info to request: req.user = { userId, tenantId, role }
  next();
};

// middleware/authorizationMiddleware.js
const checkTenant = (tenantIdParam) => {
  return (req, res, next) => {
    if (req.user.tenantId !== tenantIdParam) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    next();
  };
};
```

### Database Schema Structure

All tables include `tenant_id` as a foreign key:

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  -- Other columns...
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enforce tenant isolation on queries
SELECT * FROM projects 
WHERE tenant_id = $1 AND id = $2;
```

## Audit Logging

### Logged Actions

All critical operations are logged in the `audit_logs` table:

- **Authentication**: User registration, login, logout
- **User Management**: User creation, deletion, role changes, status changes
- **Project Management**: Create, update, delete projects
- **Task Management**: Create, update, delete tasks, status changes
- **Tenant Management**: Tenant updates (name, subscription, limits)

### Audit Log Structure

```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "user_id": "uuid",
  "action": "PROJECT_CREATED",
  "entity_type": "project",
  "entity_id": "uuid",
  "changes": {
    "name": "Website Redesign",
    "description": "Complete redesign",
    "status": "active"
  },
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Accessing Audit Logs

Currently accessible via direct database queries:

```sql
-- Get all actions by a user
SELECT * FROM audit_logs 
WHERE tenant_id = $1 AND user_id = $2
ORDER BY timestamp DESC
LIMIT 100;

-- Get project activity
SELECT * FROM audit_logs 
WHERE tenant_id = $1 AND entity_type = 'project' AND entity_id = $2
ORDER BY timestamp DESC;
```

**Future Enhancement**: Add `/api/audit-logs` endpoint with role-based access control.

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "type": "field",
      "path": "email",
      "value": "invalid-email",
      "msg": "Invalid email format"
    }
  ]
}
```

### HTTP Status Codes

| Status | Meaning | Example |
|--------|---------|---------|
| 200 | Success | Project retrieved |
| 201 | Created | User created successfully |
| 400 | Bad Request | Invalid input validation |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate email/subdomain |
| 500 | Server Error | Database connection failed |

### Common Error Cases

#### 409 Conflict - Duplicate Subdomain

```
Request:
POST /api/auth/register-tenant
{ "subdomain": "acme", ... }

Response:
HTTP 409
{
  "success": false,
  "message": "Subdomain already exists"
}
```

#### 401 Unauthorized - Invalid Token

```
Request:
GET /api/projects
Headers: Authorization: Bearer invalid_token

Response:
HTTP 401
{
  "success": false,
  "message": "Invalid or expired token"
}
```

#### 403 Forbidden - Insufficient Permissions

```
Request:
DELETE /api/users/user-123 (as regular user)

Response:
HTTP 403
{
  "success": false,
  "message": "Unauthorized"
}
```

## Security Best Practices

### Authentication

1. **JWT Tokens**:
   - Algorithm: HS256
   - Expiry: 24 hours
   - Payload: userId, tenantId, role
   - Secret: 32+ character secret (environment variable)

2. **Password Security**:
   - Hashing: bcryptjs with 10 salt rounds
   - Validation: Minimum 8 characters
   - Storage: Never store plaintext passwords
   - Verification: Use bcryptjs.compare() for authentication

### API Security

1. **CORS Configuration**:
   - Origin whitelist: frontend URL only
   - Credentials: true (for cookie-based sessions if needed)
   - Methods: GET, POST, PUT, PATCH, DELETE

2. **Input Validation**:
   - Use express-validator for all inputs
   - Sanitize email addresses and strings
   - Validate UUID format for IDs
   - Check enum values (status, priority, role)

3. **Rate Limiting** (Recommended for Production):
   ```javascript
   const rateLimit = require('express-rate-limit');
   
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100, // 100 requests per windowMs
     message: 'Too many requests, please try again later'
   });
   
   app.use('/api/', limiter);
   ```

### Database Security

1. **Connection**:
   - Use SSL for production connections
   - Implement connection pooling
   - Set idle timeout (5-10 seconds)

2. **Access Control**:
   - Database user with minimal required permissions
   - No root/superuser access for application
   - Separate read-only user for reporting (future)

3. **Data Protection**:
   - All queries use parameterized statements ($1, $2, etc.)
   - Prevents SQL injection
   - Never interpolate user input into queries

### Example: Secure Query

```javascript
// ✓ SECURE - Parameterized query
const result = await pool.query(
  'SELECT * FROM users WHERE email = $1 AND tenant_id = $2',
  [email, tenantId]
);

// ✗ INSECURE - String interpolation
const result = await pool.query(
  `SELECT * FROM users WHERE email = '${email}'`
);
```

## Performance Considerations

### Database Optimization

1. **Indexing**:
   ```sql
   -- Key indexes for performance
   CREATE INDEX idx_users_tenant_id ON users(tenant_id);
   CREATE INDEX idx_projects_tenant_id ON projects(tenant_id);
   CREATE INDEX idx_tasks_project_id ON tasks(project_id);
   CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
   CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
   CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
   ```

2. **Query Optimization**:
   - Use pagination for list endpoints (default limit: 50, max: 100)
   - Select only needed columns
   - Use JOINs instead of N+1 queries for user data in tasks
   - Implement connection pooling (pg npm package does this)

3. **Caching** (Recommended for Production):
   - Cache tenant configuration (30-minute TTL)
   - Cache user roles and permissions
   - Use Redis for session tokens
   - Cache project/task counts

### Query Examples

#### Efficient Task Listing with Pagination

```javascript
// Get paginated tasks with full user info
const query = `
  SELECT 
    t.id, t.title, t.description, t.priority, t.status,
    t.due_date, t.created_at,
    u.id as assigned_user_id, u.full_name, u.email
  FROM tasks t
  LEFT JOIN users u ON t.assigned_to = u.id
  WHERE t.project_id = $1 AND t.tenant_id = $2
  ORDER BY t.priority DESC, t.due_date ASC
  LIMIT $3 OFFSET $4
`;

const offset = (page - 1) * limit;
const result = await pool.query(query, [projectId, tenantId, limit, offset]);
```

#### N+1 Problem Prevention

```javascript
// ✗ N+1: One query per task assignment
const tasks = await pool.query('SELECT * FROM tasks WHERE project_id = $1', [projectId]);
for (let task of tasks.rows) {
  const user = await pool.query('SELECT * FROM users WHERE id = $1', [task.assigned_to]);
  task.assignedUser = user.rows[0];
}

// ✓ BETTER: Single query with JOIN
const tasks = await pool.query(`
  SELECT t.*, u.full_name, u.email
  FROM tasks t
  LEFT JOIN users u ON t.assigned_to = u.id
  WHERE t.project_id = $1
`, [projectId]);
```

### Frontend Performance

1. **Code Splitting**: React Router lazy-loads components
2. **Image Optimization**: Use responsive images
3. **Bundle Size**: Tree-shake unused dependencies
4. **API Caching**: Store auth tokens in localStorage with TTL validation

## Deployment Checklist

- [ ] Set secure JWT_SECRET (32+ characters)
- [ ] Configure FRONTEND_URL for CORS
- [ ] Use strong database password
- [ ] Enable SSL for database connections
- [ ] Configure environment variables (.env)
- [ ] Run database migrations
- [ ] Execute seed data (if needed)
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Test all endpoints with production data
- [ ] Review audit logs for suspicious activity
- [ ] Plan rate limiting strategy
- [ ] Document custom environment variables

---

**Last Updated**: 2024-01-15
**Version**: 1.0.0
