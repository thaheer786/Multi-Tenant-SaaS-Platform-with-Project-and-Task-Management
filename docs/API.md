# API Documentation

## Overview

This is a comprehensive RESTful API for a multi-tenant SaaS platform. All endpoints return a consistent JSON response format and require JWT authentication (except for auth endpoints).

## Base URL

- **Development**: `http://localhost:5000/api`
- **Docker**: `http://backend:5000/api`
- **Production**: `https://api.example.com/api`

## Response Format

All API responses follow this format:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

## Error Handling

Error responses include appropriate HTTP status codes:

```json
{
  "success": false,
  "message": "Error description",
  "errors": []
}
```

### Status Codes

- `200` - OK: Request successful
- `201` - Created: Resource created successfully
- `400` - Bad Request: Invalid input
- `401` - Unauthorized: Missing or invalid token
- `403` - Forbidden: Insufficient permissions
- `404` - Not Found: Resource not found
- `409` - Conflict: Unique constraint violation (duplicate email, subdomain)
- `500` - Internal Server Error: Server-side error

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

Tokens expire after 24 hours. Include the following data in JWT payload:
- `userId` - User ID
- `tenantId` - Tenant ID (null for super_admin)
- `role` - User role

## Health Check Endpoint

### GET /api/health

Check API health and database connection status.

**No authentication required**

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Authentication Endpoints

### POST /api/auth/register-tenant

Register a new organization and create the initial admin user.

**No authentication required**

**Request Body:**
```json
{
  "tenantName": "Company Inc.",
  "subdomain": "company-inc",
  "email": "admin@company.com",
  "password": "SecurePassword123",
  "fullName": "John Admin"
}
```

**Validation Rules:**
- `tenantName`: Required, minimum 2 characters
- `subdomain`: Required, alphanumeric and hyphens only, must be unique
- `email`: Required, valid email format, must be unique across all tenants
- `password`: Required, minimum 8 characters
- `fullName`: Required, minimum 2 characters

**Response:**
```json
{
  "success": true,
  "message": "Organization created successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "admin@company.com",
      "fullName": "John Admin",
      "role": "tenant_admin",
      "isActive": true,
      "tenantId": "550e8400-e29b-41d4-a716-446655440001"
    },
    "tenant": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Company Inc.",
      "subdomain": "company-inc",
      "subscriptionPlan": "free",
      "status": "active",
      "maxUsers": 5,
      "maxProjects": 3
    }
  }
}
```

**Error Cases:**
- `400` - Invalid input format
- `409` - Subdomain or email already exists

---

### POST /api/auth/login

Authenticate a user and receive a JWT token.

**No authentication required**

**Request Body:**
```json
{
  "email": "user@company.com",
  "password": "Password123",
  "subdomain": "company-inc"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@company.com",
      "fullName": "John User",
      "role": "user",
      "isActive": true,
      "tenantId": "550e8400-e29b-41d4-a716-446655440001"
    },
    "tenant": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Company Inc.",
      "subscriptionPlan": "pro",
      "status": "active"
    }
  }
}
```

**Error Cases:**
- `400` - Invalid credentials or tenant not found
- `401` - Incorrect password

---

### GET /api/auth/me

Get the current authenticated user's profile and tenant information.

**Authentication required**

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@company.com",
      "fullName": "John User",
      "role": "user",
      "isActive": true,
      "tenantId": "550e8400-e29b-41d4-a716-446655440001"
    },
    "tenant": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Company Inc.",
      "subscriptionPlan": "pro",
      "status": "active",
      "maxUsers": 25,
      "maxProjects": 15
    }
  }
}
```

**Error Cases:**
- `401` - Invalid or expired token

---

### POST /api/auth/logout

Logout the current user (logs the action for audit trail).

**Authentication required**

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Tenant Endpoints

### GET /api/tenants/:tenantId

Get tenant details including usage statistics.

**Authentication required** - User must belong to this tenant

**Path Parameters:**
- `tenantId` - UUID of the tenant

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Company Inc.",
    "subdomain": "company-inc",
    "status": "active",
    "subscriptionPlan": "pro",
    "maxUsers": 25,
    "maxProjects": 15,
    "userCount": 8,
    "projectCount": 3,
    "taskCount": 25,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### PUT /api/tenants/:tenantId

Update tenant information.

**Authentication required** - Tenant admin or super_admin only

**Path Parameters:**
- `tenantId` - UUID of the tenant

**Request Body:**
```json
{
  "name": "Updated Company Name",
  "subscriptionPlan": "enterprise"
}
```

**Note:** `name` can be updated by any admin. `subscriptionPlan`, `maxUsers`, and `maxProjects` can only be updated by super_admin.

**Response:**
```json
{
  "success": true,
  "message": "Tenant updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Updated Company Name",
    "subscriptionPlan": "enterprise"
  }
}
```

---

### GET /api/tenants

List all tenants with pagination.

**Authentication required** - Super admin only

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Company Inc.",
      "subdomain": "company-inc",
      "status": "active",
      "subscriptionPlan": "pro",
      "userCount": 8,
      "projectCount": 3
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "total": 95
  }
}
```

---

## User Endpoints

### POST /api/users/:tenantId/users

Create a new user in the tenant.

**Authentication required** - Tenant admin only

**Path Parameters:**
- `tenantId` - UUID of the tenant

**Request Body:**
```json
{
  "email": "newuser@company.com",
  "password": "SecurePassword123",
  "fullName": "New User",
  "role": "user"
}
```

**Validation:**
- User limit must not be exceeded based on subscription plan
- Email must be unique within the tenant
- Password minimum 8 characters
- Role must be "user" or "tenant_admin"

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "email": "newuser@company.com",
    "fullName": "New User",
    "role": "user",
    "isActive": true,
    "tenantId": "550e8400-e29b-41d4-a716-446655440001"
  }
}
```

**Error Cases:**
- `400` - Invalid input
- `409` - Email already exists in tenant or user limit exceeded

---

### GET /api/users/:tenantId/users

List users in a tenant with filtering and search.

**Authentication required** - Tenant member

**Query Parameters:**
- `page` - Page number (default: 1)
- `search` - Search by email or full name
- `role` - Filter by role (tenant_admin, user)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@company.com",
      "fullName": "John User",
      "role": "user",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "total": 8
  }
}
```

---

### PUT /api/users/:userId

Update user information.

**Authentication required**

**Path Parameters:**
- `userId` - UUID of the user

**Request Body:**
```json
{
  "fullName": "Updated Name",
  "role": "tenant_admin",
  "isActive": false
}
```

**Rules:**
- Users can update their own `fullName`
- Admins can update `role` and `isActive` for other users
- Cannot update own role or isActive

**Response:**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "fullName": "Updated Name",
    "role": "tenant_admin",
    "isActive": false
  }
}
```

---

### DELETE /api/users/:userId

Delete a user from the tenant.

**Authentication required** - Tenant admin only

**Path Parameters:**
- `userId` - UUID of the user

**Restrictions:**
- Cannot delete yourself
- Cannot delete users from other tenants

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

## Project Endpoints

### POST /api/projects

Create a new project.

**Authentication required** - Tenant member

**Request Body:**
```json
{
  "name": "New Project",
  "description": "Project description",
  "status": "active"
}
```

**Validation:**
- Project limit must not be exceeded based on subscription plan
- Name is required
- Status defaults to "active"

**Response:**
```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "name": "New Project",
    "description": "Project description",
    "status": "active",
    "tenantId": "550e8400-e29b-41d4-a716-446655440001",
    "createdBy": "550e8400-e29b-41d4-a716-446655440000",
    "taskCount": 0,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Cases:**
- `409` - Project limit exceeded

---

### GET /api/projects

List projects in a tenant with filtering.

**Authentication required** - Tenant member

**Query Parameters:**
- `page` - Page number (default: 1)
- `status` - Filter by status (active, on_hold, completed)
- `search` - Search by project name

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "name": "New Project",
      "description": "Project description",
      "status": "active",
      "taskCount": 5,
      "createdBy": "550e8400-e29b-41d4-a716-446655440000",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "total": 3
  }
}
```

---

### PUT /api/projects/:projectId

Update project information.

**Authentication required** - Project creator or tenant admin

**Path Parameters:**
- `projectId` - UUID of the project

**Request Body:**
```json
{
  "name": "Updated Project Name",
  "description": "Updated description",
  "status": "on_hold"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Project updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "name": "Updated Project Name",
    "description": "Updated description",
    "status": "on_hold"
  }
}
```

---

### DELETE /api/projects/:projectId

Delete a project and all its tasks.

**Authentication required** - Project creator or tenant admin

**Path Parameters:**
- `projectId` - UUID of the project

**Response:**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

---

## Task Endpoints

### POST /api/projects/:projectId/tasks

Create a new task in a project.

**Authentication required** - Tenant member

**Path Parameters:**
- `projectId` - UUID of the project

**Request Body:**
```json
{
  "title": "Task Title",
  "description": "Task description",
  "priority": "high",
  "status": "todo",
  "assignedTo": "550e8400-e29b-41d4-a716-446655440002",
  "dueDate": "2024-12-31"
}
```

**Validation:**
- Title is required
- Priority must be: low, medium, high
- Status must be: todo, in_progress, completed
- assignedTo user must exist in the same tenant
- dueDate format: YYYY-MM-DD

**Response:**
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440004",
    "title": "Task Title",
    "description": "Task description",
    "priority": "high",
    "status": "todo",
    "projectId": "550e8400-e29b-41d4-a716-446655440003",
    "assignedTo": "550e8400-e29b-41d4-a716-446655440002",
    "dueDate": "2024-12-31",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### GET /api/projects/:projectId/tasks

List tasks in a project with filtering.

**Authentication required** - Tenant member

**Query Parameters:**
- `status` - Filter by status (todo, in_progress, completed)
- `priority` - Filter by priority (low, medium, high)
- `assignedTo` - Filter by assigned user ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440004",
      "title": "Task Title",
      "description": "Task description",
      "priority": "high",
      "status": "todo",
      "projectId": "550e8400-e29b-41d4-a716-446655440003",
      "assignedTo": "550e8400-e29b-41d4-a716-446655440002",
      "dueDate": "2024-12-31",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "total": 5
  }
}
```

---

### PUT /api/tasks/:taskId

Update task information.

**Authentication required** - Task creator or tenant admin

**Path Parameters:**
- `taskId` - UUID of the task

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "priority": "medium",
  "status": "in_progress",
  "assignedTo": "550e8400-e29b-41d4-a716-446655440002",
  "dueDate": "2024-12-25"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Task updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440004",
    "title": "Updated Title",
    "priority": "medium",
    "status": "in_progress"
  }
}
```

---

### PATCH /api/tasks/:taskId/status

Update only the task status (quick status change).

**Authentication required** - Tenant member

**Path Parameters:**
- `taskId` - UUID of the task

**Request Body:**
```json
{
  "status": "completed"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Task status updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440004",
    "status": "completed",
    "updatedAt": "2024-01-15T10:35:00Z"
  }
}
```

---

### DELETE /api/tasks/:taskId

Delete a task.

**Authentication required** - Task creator or tenant admin

**Path Parameters:**
- `taskId` - UUID of the task

**Response:**
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

---

## Audit Logging

All important operations are logged in the `audit_logs` table for compliance and tracking purposes. The following actions are logged:

- User registration
- User login
- User logout
- User creation
- User deletion
- User role changes
- Project creation
- Project updates
- Project deletion
- Task creation
- Task updates
- Task deletion
- Tenant updates

Each audit log entry contains:
- User ID who performed the action
- Tenant ID affected
- Action type
- Entity type and ID
- Detailed change information
- IP address of the requester
- Timestamp

---

## Rate Limiting

Currently no rate limiting is implemented. For production deployment, consider:
- Implementing API rate limiting (e.g., 100 requests/minute per user)
- Using Redis for rate limit tracking
- Implementing distributed rate limiting for multi-server deployments

---

## Best Practices

1. **Always include Authorization header** for authenticated endpoints
2. **Validate input** on the client side before sending requests
3. **Handle error responses** appropriately in your application
4. **Regenerate tokens** before they expire (24-hour expiry)
5. **Never expose JWT tokens** in logs or error messages
6. **Use HTTPS in production** to protect token transmission
7. **Monitor audit logs** for suspicious activities

---

## Example Usage with cURL

### Register a new tenant
```bash
curl -X POST http://localhost:5000/api/auth/register-tenant \
  -H "Content-Type: application/json" \
  -d '{
    "tenantName": "My Company",
    "subdomain": "mycompany",
    "email": "admin@mycompany.com",
    "password": "SecurePass123",
    "fullName": "Admin User"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mycompany.com",
    "password": "SecurePass123",
    "subdomain": "mycompany"
  }'
```

### Get current user (using token from login response)
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create a project
```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Website Redesign",
    "description": "Complete redesign of the company website"
  }'
```

---

**API Version**: 1.0.0
**Last Updated**: 2024-01-15
