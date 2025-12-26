# System Architecture & Technical Specification

## 1. System Architecture Overview

### 1.1 High-Level Architecture Diagram Description

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│                   (Web Browser / Desktop)                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                      HTTPS / HTTP
                             │
        ┌────────────────────┴────────────────────┐
        │                                         │
┌───────▼──────────────┐          ┌──────────────▼────────────┐
│   FRONTEND (React)   │          │   STATIC ASSETS & API     │
│   - 6 Pages          │          │   Requests with JWT       │
│   - Protected Routes │          │                           │
│   - Components       │          │   CORS Enabled            │
│   - State Management │          │                           │
└──────────────────────┘          └──────────────┬────────────┘
                                                 │
                                      ┌──────────▼─────────┐
                                      │  BACKEND API       │
                                      │  (Node.js/Express) │
                                      │                    │
                                      │ ┌────────────────┐ │
                                      │ │ Auth Routes    │ │
                                      │ ├────────────────┤ │
                                      │ │ Tenant Routes  │ │
                                      │ ├────────────────┤ │
                                      │ │ User Routes    │ │
                                      │ ├────────────────┤ │
                                      │ │ Project Routes │ │
                                      │ ├────────────────┤ │
                                      │ │ Task Routes    │ │
                                      │ └────────────────┘ │
                                      │                    │
                                      │ ┌────────────────┐ │
                                      │ │ Middleware:    │ │
                                      │ │ - JWT Auth     │ │
                                      │ │ - Tenant Iso.  │ │
                                      │ │ - Error Handle │ │
                                      │ │ - Validation   │ │
                                      │ └────────────────┘ │
                                      │                    │
                                      │ ┌────────────────┐ │
                                      │ │ Services:      │ │
                                      │ │ - Audit Log    │ │
                                      │ │ - Auth Service │ │
                                      │ │ - DB Pool      │ │
                                      │ └────────────────┘ │
                                      └────────┬───────────┘
                                               │
                                  ┌────────────▼─────────────┐
                                  │   DATABASE LAYER         │
                                  │   (PostgreSQL)           │
                                  │                          │
                                  │ ┌──────────────────────┐ │
                                  │ │ Core Tables:         │ │
                                  │ │ - tenants            │ │
                                  │ │ - users              │ │
                                  │ │ - projects           │ │
                                  │ │ - tasks              │ │
                                  │ │ - audit_logs         │ │
                                  │ └──────────────────────┘ │
                                  │                          │
                                  │ ┌──────────────────────┐ │
                                  │ │ Indexes:             │ │
                                  │ │ - tenant_id          │ │
                                  │ │ - email (per tenant) │ │
                                  │ │ - foreign keys       │ │
                                  │ └──────────────────────┘ │
                                  └──────────────────────────┘
```

### 1.2 Authentication Flow

```
User Login
    │
    ▼
POST /api/auth/login
    │
    ├─ Validate email, password, tenant subdomain
    │
    ├─ Verify tenant exists & is active
    │
    ├─ Query user by email & tenant_id
    │
    ├─ Compare password hash with bcrypt
    │
    ├─ Generate JWT token {userId, tenantId, role}
    │
    ▼
Return JWT Token
    │
    ▼
Store in localStorage
    │
    ▼
Subsequent Requests
    │
    ├─ Include Authorization: Bearer {token}
    │
    ├─ JWT Middleware validates & decodes
    │
    ├─ Extract userId, tenantId, role
    │
    ├─ Middleware filters queries by tenantId
    │
    ▼
Process Request with Tenant Isolation
```

### 1.3 Data Isolation Strategy

```
Every Database Request:
    │
    ├─ JWT Middleware extracts tenantId
    │
    ├─ Authorization Middleware checks role
    │
    ├─ Route Handler:
    │   ├─ Verify resource belongs to tenant
    │   ├─ Add tenant_id filter to SQL query
    │   ├─ Execute parameterized query
    │   ├─ Verify returned data has matching tenant_id
    │   └─ Return only tenant-owned data
    │
    ▼
Log to audit_logs table with:
    ├─ tenant_id
    ├─ user_id
    ├─ action
    ├─ entity_type
    ├─ entity_id
    └─ timestamp
```

---

## 2. Database Schema Design

### 2.1 Entity Relationship Diagram (ERD)

```
┌─────────────────────────────────┐
│         TENANTS                 │
├─────────────────────────────────┤
│ id (PK, UUID)                   │
│ name (VARCHAR)                  │
│ subdomain (VARCHAR, UNIQUE)     │
│ status (ENUM)                   │
│ subscription_plan (ENUM)        │
│ max_users (INTEGER)             │
│ max_projects (INTEGER)          │
│ created_at (TIMESTAMP)          │
│ updated_at (TIMESTAMP)          │
└──────────────┬──────────────────┘
               │ (1:N)
               │ Foreign Key
               │
┌──────────────▼──────────────────────────┐
│         USERS                           │
├─────────────────────────────────────────┤
│ id (PK, UUID)                           │
│ tenant_id (FK) ──────────────┬──┐      │
│ email (VARCHAR)              │  │      │
│ password_hash (VARCHAR)      │  │ NULL │
│ full_name (VARCHAR)          │  │ (SA) │
│ role (ENUM)                  │  │      │
│ is_active (BOOLEAN)          │  │      │
│ created_at (TIMESTAMP)       │  │      │
│ updated_at (TIMESTAMP)       │  │      │
│ UNIQUE(tenant_id, email)     │  │      │
│ INDEX(tenant_id)             │  │      │
└──────────────┬────────────────────────┘
               │              │
          (1:N)│              │ Super Admin
               │              │ (NULL tenant_id)
               │              │
        ┌──────┴────────┐     │
        │               │     └─ No cascade
        │               │
┌───────▼────────────────────────┐
│      PROJECTS                  │
├────────────────────────────────┤
│ id (PK, UUID)                  │
│ tenant_id (FK)                 │
│ name (VARCHAR)                 │
│ description (TEXT)             │
│ status (ENUM)                  │
│ created_by (FK) ───────┐       │
│ created_at (TIMESTAMP) │       │
│ updated_at (TIMESTAMP) │       │
│ INDEX(tenant_id)       │       │
│ FOREIGN KEY (user)     │       │
│ CASCADE DELETE         │       │
└──────────────┬─────────────────┘
               │                │ (1:N)
               │                │
          (1:N)│                │
               │                │
        ┌──────┴────────────────┴──────┐
        │                              │
┌───────▼──────────────────────────────────────┐
│          TASKS                               │
├────────────────────────────────────────────┤
│ id (PK, UUID)                              │
│ project_id (FK)                            │
│ tenant_id (FK)                             │
│ title (VARCHAR)                            │
│ description (TEXT)                         │
│ status (ENUM)                              │
│ priority (ENUM)                            │
│ assigned_to (FK, NULLABLE)                 │
│ due_date (DATE, NULLABLE)                  │
│ created_at (TIMESTAMP)                     │
│ updated_at (TIMESTAMP)                     │
│ INDEX(tenant_id)                           │
│ INDEX(project_id, tenant_id)               │
│ FOREIGN KEY cascade delete                 │
└────────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│      AUDIT_LOGS                          │
├──────────────────────────────────────────┤
│ id (PK, UUID)                            │
│ tenant_id (FK)                           │
│ user_id (FK, NULLABLE)                   │
│ action (VARCHAR)                         │
│ entity_type (VARCHAR)                    │
│ entity_id (VARCHAR)                      │
│ ip_address (VARCHAR)                     │
│ created_at (TIMESTAMP)                   │
│ INDEX(tenant_id)                         │
│ INDEX(created_at)                        │
│ INDEX(user_id)                           │
│ IMMUTABLE (no updates/deletes)           │
└──────────────────────────────────────────┘
```

### 2.2 Table Details

**TENANTS**
- Stores organization information
- One tenant can have many users, projects, tasks
- Subscription plan determines resource limits

**USERS**
- Stores user accounts with tenant association
- Super admin users have NULL tenant_id
- Email is unique per tenant (not globally)
- Foreign key cascade delete with tenants

**PROJECTS**
- Stores projects within tenants
- created_by links to users (CASCADE delete)
- tenant_id ensures data isolation

**TASKS**
- Stores tasks within projects
- Links to both project_id and tenant_id
- assigned_to is optional (can be NULL)
- CASCADE delete from projects

**AUDIT_LOGS**
- Immutable log of all important actions
- Includes tenant_id for filtering
- Enables compliance and security monitoring

---

## 3. API Architecture

### 3.1 All 19 API Endpoints

#### Authentication Module (4 endpoints)
1. **POST /api/auth/register-tenant** - Register new organization
2. **POST /api/auth/login** - User login with JWT generation
3. **GET /api/auth/me** - Get current user profile
4. **POST /api/auth/logout** - Logout (JWT invalidation)

#### Tenant Management Module (3 endpoints)
5. **GET /api/tenants/:tenantId** - Get tenant details
6. **PUT /api/tenants/:tenantId** - Update tenant settings
7. **GET /api/tenants** - List all tenants (super_admin only)

#### User Management Module (4 endpoints)
8. **POST /api/tenants/:tenantId/users** - Add user to tenant
9. **GET /api/tenants/:tenantId/users** - List tenant users
10. **PUT /api/users/:userId** - Update user profile
11. **DELETE /api/users/:userId** - Delete user

#### Project Management Module (4 endpoints)
12. **POST /api/projects** - Create project
13. **GET /api/projects** - List projects
14. **PUT /api/projects/:projectId** - Update project
15. **DELETE /api/projects/:projectId** - Delete project

#### Task Management Module (4 endpoints)
16. **POST /api/projects/:projectId/tasks** - Create task
17. **GET /api/projects/:projectId/tasks** - List project tasks
18. **PUT /api/tasks/:taskId** - Update task (all fields)
19. **PATCH /api/tasks/:taskId/status** - Update task status

### 3.2 Response Format

All endpoints follow consistent response format:

**Success Response (200/201):**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* Resource data */ }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "data": null
}
```

**Pagination Response:**
```json
{
  "success": true,
  "data": {
    "items": [ /* Array of items */ ],
    "total": 100,
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "limit": 10
    }
  }
}
```

### 3.3 HTTP Status Codes

- **200 OK** - Successful GET/PUT request
- **201 Created** - Successful POST request creating resource
- **400 Bad Request** - Invalid input/validation error
- **401 Unauthorized** - Missing or invalid JWT token
- **403 Forbidden** - User lacks permission for resource
- **404 Not Found** - Resource doesn't exist
- **409 Conflict** - Duplicate resource (email exists)
- **500 Internal Server Error** - Server error

### 3.4 Authentication Requirements

| Endpoint | Auth Required | Roles |
|----------|---------------|-------|
| POST /auth/register-tenant | No | Public |
| POST /auth/login | No | Public |
| GET /auth/me | Yes | All authenticated |
| POST /auth/logout | Yes | All authenticated |
| GET /tenants/:id | Yes | Tenant members + super_admin |
| PUT /tenants/:id | Yes | tenant_admin + super_admin |
| GET /tenants | Yes | super_admin only |
| POST /tenants/:id/users | Yes | tenant_admin only |
| GET /tenants/:id/users | Yes | Tenant members |
| PUT /users/:id | Yes | Self or tenant_admin |
| DELETE /users/:id | Yes | tenant_admin only |
| POST /projects | Yes | Authenticated users |
| GET /projects | Yes | Authenticated users |
| PUT /projects/:id | Yes | Creator or tenant_admin |
| DELETE /projects/:id | Yes | Creator or tenant_admin |
| POST /projects/:id/tasks | Yes | Authenticated users |
| GET /projects/:id/tasks | Yes | Authenticated users |
| PUT /tasks/:id | Yes | Authenticated users |
| PATCH /tasks/:id/status | Yes | Authenticated users |

---

## 4. Project Structure

### 4.1 Backend Directory Structure

```
backend/
├── src/
│   ├── controllers/          # Business logic for each module
│   │   ├── authController.js
│   │   ├── tenantController.js
│   │   ├── userController.js
│   │   ├── projectController.js
│   │   └── taskController.js
│   │
│   ├── routes/              # API route definitions
│   │   ├── authRoutes.js
│   │   ├── tenantRoutes.js
│   │   ├── userRoutes.js
│   │   ├── projectRoutes.js
│   │   └── taskRoutes.js
│   │
│   ├── middleware/          # Request processing
│   │   ├── authMiddleware.js       # JWT validation
│   │   ├── authorizationMiddleware.js  # Role checks
│   │   ├── tenantMiddleware.js     # Tenant isolation
│   │   ├── errorMiddleware.js      # Error handling
│   │   └── validationMiddleware.js # Input validation
│   │
│   ├── utils/               # Utility functions
│   │   ├── auditLogger.js   # Log actions to audit_logs
│   │   ├── passwords.js     # Bcrypt hashing
│   │   ├── validators.js    # Input validation rules
│   │   ├── database.js      # DB connection & pool
│   │   └── jwt.js           # Token generation
│   │
│   ├── config/              # Configuration
│   │   ├── database.js      # DB configuration
│   │   ├── jwt.js           # JWT settings
│   │   └── constants.js     # App constants
│   │
│   └── app.js               # Express app setup
│
├── migrations/              # Database migrations
│   ├── 001_create_tenants.sql
│   ├── 002_create_users.sql
│   ├── 003_create_projects.sql
│   ├── 004_create_tasks.sql
│   ├── 005_create_audit_logs.sql
│   └── runMigrations.js     # Migration runner
│
├── seeds/                   # Seed data
│   ├── seed_data.sql
│   └── runSeeds.js
│
├── docker-entrypoint.sh     # Container startup script
├── Dockerfile
├── package.json
├── .env.example
└── server.js                # Entry point
```

### 4.2 Frontend Directory Structure

```
frontend/
├── src/
│   ├── pages/              # Page components
│   │   ├── RegisterPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── ProjectsPage.jsx
│   │   ├── ProjectDetailsPage.jsx
│   │   └── UsersPage.jsx
│   │
│   ├── components/         # Reusable components
│   │   ├── NavigationBar.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── ProjectModal.jsx
│   │   ├── UserModal.jsx
│   │   ├── TaskList.jsx
│   │   ├── Dashboard/
│   │   │   ├── StatisticsCard.jsx
│   │   │   └── RecentProjects.jsx
│   │   └── ...
│   │
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.js      # Authentication logic
│   │   ├── useApi.js       # API calls
│   │   └── useTenant.js    # Tenant context
│   │
│   ├── utils/              # Utilities
│   │   ├── api.js          # API client
│   │   ├── storage.js      # localStorage helpers
│   │   └── formatters.js   # Date/text formatting
│   │
│   ├── App.jsx             # Root component
│   └── index.jsx           # Entry point
│
├── Dockerfile
├── package.json
├── .env.example
└── public/
    └── index.html
```

---

## 5. Development Setup Guide

### 5.1 Prerequisites

- Node.js 18.x or higher
- PostgreSQL 14.x or higher
- Docker & Docker Compose (for containerized setup)
- npm or yarn package manager

### 5.2 Environment Variables

**Backend (.env file):**
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=saas_db
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRES_IN=24h
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Frontend (.env file):**
```
REACT_APP_API_URL=http://localhost:5000/api
```

### 5.3 Installation Steps

**Backend:**
1. `cd backend`
2. `npm install`
3. `npm run migrate` (run migrations)
4. `npm run seed` (load seed data)
5. `npm start` (start server on port 5000)

**Frontend:**
1. `cd frontend`
2. `npm install`
3. `npm start` (start dev server on port 3000)

**With Docker:**
1. `docker-compose up -d` (start all services)
2. Wait for health checks to pass (~30 seconds)
3. Access frontend at http://localhost:3000

### 5.4 Running Tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# API endpoint tests (with running backend)
npm run test:api
```

---

## 6. Security Architecture

### 6.1 Authentication Flow

1. User logs in with email, password, tenant subdomain
2. Backend verifies credentials
3. Backend generates JWT containing {userId, tenantId, role}
4. JWT signed with JWT_SECRET
5. Frontend stores JWT in localStorage
6. Frontend sends JWT in Authorization header for all requests
7. Backend middleware validates and decodes JWT
8. Request processed with tenant_id from JWT

### 6.2 Authorization Hierarchy

```
Super Admin
├─ Access all tenants
├─ Manage all tenants
├─ View all users across system
└─ Configure system settings

Tenant Admin
├─ Access own tenant only
├─ Manage own tenant users
├─ Create/edit/delete projects
├─ Create/edit/delete tasks
└─ View audit logs for own tenant

Regular User
├─ Access own tenant only
├─ View projects
├─ View/create/edit/delete own tasks
├─ View/update own profile
└─ View team members
```

---

**Version:** 1.0  
**Last Updated:** December 2025
