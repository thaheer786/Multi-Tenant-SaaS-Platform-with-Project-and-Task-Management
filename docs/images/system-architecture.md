# System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │            React Frontend (Port 3000)                       │    │
│  │  ┌──────────────────────────────────────────────────────┐  │    │
│  │  │  Pages: Login, Register, Dashboard, Projects,        │  │    │
│  │  │         ProjectDetails, Users                        │  │    │
│  │  │                                                       │  │    │
│  │  │  Protected Routes + Role-Based UI                    │  │    │
│  │  │  JWT Token Management + Auto Logout                  │  │    │
│  │  └──────────────────────────────────────────────────────┘  │    │
│  │                                                              │    │
│  │  Context: AuthContext (User State)                          │    │
│  │  API Client: Axios with Interceptors                        │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                │                                     │
└────────────────────────────────┼─────────────────────────────────────┘
                                 │ HTTP/REST
                                 │ Authorization: Bearer <JWT>
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       APPLICATION LAYER                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │         Express.js Backend (Port 5000)                      │    │
│  │                                                              │    │
│  │  ┌────────────────────────────────────────────────┐        │    │
│  │  │         Middleware Stack                        │        │    │
│  │  │  • CORS (frontend:3000)                        │        │    │
│  │  │  • Body Parser (JSON)                          │        │    │
│  │  │  • Auth Middleware (JWT Validation)            │        │    │
│  │  │  • Authorization Middleware (RBAC)             │        │    │
│  │  │  • Error Middleware (Global Error Handler)     │        │    │
│  │  └────────────────────────────────────────────────┘        │    │
│  │                                                              │    │
│  │  ┌────────────────────────────────────────────────┐        │    │
│  │  │         API Routes (19 Endpoints)              │        │    │
│  │  │                                                 │        │    │
│  │  │  /api/auth                                     │        │    │
│  │  │    • POST /register-tenant                     │        │    │
│  │  │    • POST /login                               │        │    │
│  │  │    • GET /me                                   │        │    │
│  │  │    • POST /logout                              │        │    │
│  │  │                                                 │        │    │
│  │  │  /api/tenants                                  │        │    │
│  │  │    • GET /:tenantId (with stats)               │        │    │
│  │  │    • PUT /:tenantId                            │        │    │
│  │  │    • GET / (super_admin only)                  │        │    │
│  │  │                                                 │        │    │
│  │  │  /api/tenants/:tenantId/users                  │        │    │
│  │  │    • POST / (create user)                      │        │    │
│  │  │    • GET / (list users)                        │        │    │
│  │  │                                                 │        │    │
│  │  │  /api/users                                    │        │    │
│  │  │    • PUT /:userId                              │        │    │
│  │  │    • DELETE /:userId                           │        │    │
│  │  │                                                 │        │    │
│  │  │  /api/projects                                 │        │    │
│  │  │    • POST / (with limit check)                 │        │    │
│  │  │    • GET / (tenant-filtered)                   │        │    │
│  │  │    • PUT /:projectId                           │        │    │
│  │  │    • DELETE /:projectId                        │        │    │
│  │  │                                                 │        │    │
│  │  │  /api/projects/:projectId/tasks                │        │    │
│  │  │    • POST / (create task)                      │        │    │
│  │  │    • GET / (list tasks)                        │        │    │
│  │  │                                                 │        │    │
│  │  │  /api/tasks                                    │        │    │
│  │  │    • PUT /:taskId                              │        │    │
│  │  │    • PATCH /:taskId/status                     │        │    │
│  │  │    • DELETE /:taskId                           │        │    │
│  │  └────────────────────────────────────────────────┘        │    │
│  │                                                              │    │
│  │  ┌────────────────────────────────────────────────┐        │    │
│  │  │         Business Logic Layer                    │        │    │
│  │  │  • Subscription Limit Enforcement              │        │    │
│  │  │  • Tenant Data Isolation (tenant_id filter)    │        │    │
│  │  │  • RBAC Authorization Checks                   │        │    │
│  │  │  • Audit Logging                               │        │    │
│  │  │  • Input Validation (express-validator)        │        │    │
│  │  │  • Password Hashing (bcryptjs)                 │        │    │
│  │  │  • JWT Token Generation/Validation             │        │    │
│  │  └────────────────────────────────────────────────┘        │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                │                                     │
└────────────────────────────────┼─────────────────────────────────────┘
                                 │ SQL Queries
                                 │ WITH tenant_id filtering
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │       PostgreSQL 14 Database (Port 5432)                    │    │
│  │                                                              │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │    │
│  │  │   tenants    │  │    users     │  │   projects   │     │    │
│  │  │──────────────│  │──────────────│  │──────────────│     │    │
│  │  │ id (PK)      │  │ id (PK)      │  │ id (PK)      │     │    │
│  │  │ name         │◄─┤ tenant_id FK │◄─┤ tenant_id FK │     │    │
│  │  │ subdomain*   │  │ email        │  │ name         │     │    │
│  │  │ status       │  │ password_hash│  │ description  │     │    │
│  │  │ subscription │  │ role         │  │ status       │     │    │
│  │  │ max_users    │  │ is_active    │  │ created_by   │     │    │
│  │  │ max_projects │  │ created_at   │  │ created_at   │     │    │
│  │  │ created_at   │  │ updated_at   │  │ updated_at   │     │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘     │    │
│  │                                           │                 │    │
│  │  ┌──────────────┐  ┌──────────────┐     │                 │    │
│  │  │    tasks     │  │ audit_logs   │     │                 │    │
│  │  │──────────────│  │──────────────│     │                 │    │
│  │  │ id (PK)      │  │ id (PK)      │     │                 │    │
│  │  │ project_id FK├──┤ tenant_id FK │     │                 │    │
│  │  │ tenant_id FK │  │ user_id FK   │     │                 │    │
│  │  │ title        │  │ action       │     │                 │    │
│  │  │ description  │  │ entity_type  │     │                 │    │
│  │  │ status       │  │ entity_id    │     │                 │    │
│  │  │ priority     │  │ changes      │     │                 │    │
│  │  │ assigned_to  │  │ ip_address   │     │                 │    │
│  │  │ due_date     │  │ user_agent   │     │                 │    │
│  │  │ created_at   │  │ created_at   │     │                 │    │
│  │  │ updated_at   │  └──────────────┘     │                 │    │
│  │  └──────────────┘                       │                 │    │
│  │                                                              │    │
│  │  Multi-Tenancy: Shared Schema with tenant_id isolation      │    │
│  │  Constraints: UNIQUE(tenant_id, email), CASCADE DELETE      │    │
│  │  Indexes: tenant_id, subdomain, email, project_id           │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    CONTAINERIZATION LAYER                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Docker Compose Orchestration                                       │
│                                                                       │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐         │
│  │  Container:  │    │  Container:  │    │  Container:  │         │
│  │  database    │    │  backend     │    │  frontend    │         │
│  │──────────────│    │──────────────│    │──────────────│         │
│  │ postgres:14  │◄───│ node:18      │◄───│ node:18      │         │
│  │ Port: 5432   │    │ Port: 5000   │    │ Port: 3000   │         │
│  │              │    │              │    │              │         │
│  │ Volume:      │    │ Auto migrate │    │ Static serve │         │
│  │ postgres_data│    │ Auto seed    │    │ React build  │         │
│  └──────────────┘    └──────────────┘    └──────────────┘         │
│                                                                       │
│  Environment Variables:                                              │
│  • DB_HOST=database, DB_PORT=5432, DB_NAME=saas_db                  │
│  • JWT_SECRET, FRONTEND_URL=http://frontend:3000                    │
│  • REACT_APP_API_URL=http://backend:5000/api                        │
│                                                                       │
│  One-command deployment: docker-compose up -d                        │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                   SECURITY & COMPLIANCE LAYER                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Authentication:                                                     │
│    • JWT with HS256 algorithm (24-hour expiry)                      │
│    • bcrypt password hashing (10 salt rounds)                       │
│    • Token stored in localStorage with auto-logout                  │
│                                                                       │
│  Authorization:                                                      │
│    • Role-Based Access Control (RBAC)                               │
│    • Roles: super_admin, tenant_admin, user                         │
│    • Middleware-enforced permissions on all routes                  │
│                                                                       │
│  Multi-Tenancy Security:                                             │
│    • tenant_id filtering on all queries                             │
│    • Super admin exception: tenant_id = NULL                        │
│    • Unique email per tenant constraint                             │
│    • No cross-tenant data access                                    │
│                                                                       │
│  Subscription Enforcement:                                           │
│    • Real-time limit checks (maxUsers, maxProjects)                 │
│    • 409 Conflict response on limit exceeded                        │
│    • Plans: Free (5/3), Pro (25/15), Enterprise (100/50)            │
│                                                                       │
│  Audit Logging:                                                      │
│    • All critical actions logged immutably                          │
│    • Includes: user_id, action, entity, changes, timestamp          │
│    • Cannot be modified or deleted                                  │
│                                                                       │
│  Input Validation:                                                   │
│    • express-validator on all inputs                                │
│    • SQL injection prevention via parameterized queries             │
│    • XSS prevention via sanitization                                │
│                                                                       │
│  CORS Policy:                                                        │
│    • Restricted to frontend service origin                          │
│    • Credentials enabled for JWT cookies                            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                       DATA FLOW EXAMPLE                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  User Login Flow:                                                    │
│  1. User enters: subdomain + email + password                       │
│  2. Frontend → POST /api/auth/login                                 │
│  3. Backend validates subdomain (lookup tenant by subdomain)        │
│  4. Backend verifies email exists for that tenant                   │
│  5. Backend compares password hash (bcrypt)                         │
│  6. Backend generates JWT: {userId, tenantId, role}                 │
│  7. Frontend stores token in localStorage                           │
│  8. Frontend redirects to /dashboard                                │
│                                                                       │
│  Protected API Request Flow:                                         │
│  1. Frontend sends: Authorization: Bearer <JWT>                     │
│  2. authMiddleware extracts and verifies JWT                        │
│  3. Decoded payload attached to req.user                            │
│  4. authorizationMiddleware checks role permissions                 │
│  5. Route handler filters query: WHERE tenant_id = req.user.tenantId│
│  6. Audit log created for action                                    │
│  7. Response sent to frontend                                       │
│                                                                       │
│  Subscription Limit Check Flow:                                      │
│  1. User attempts to create project                                 │
│  2. Backend queries: SELECT COUNT(*) WHERE tenant_id = ?            │
│  3. Backend queries: SELECT max_projects FROM tenants WHERE id = ?  │
│  4. If count >= max_projects → 409 Conflict                         │
│  5. Else → INSERT project and return 201 Created                    │
└─────────────────────────────────────────────────────────────────────┘
```

## Architecture Highlights

### 1. **Three-Tier Architecture**
- **Presentation Tier:** React SPA with responsive UI
- **Application Tier:** Express.js REST API with business logic
- **Data Tier:** PostgreSQL with normalized schema

### 2. **Multi-Tenancy Model**
- **Type:** Shared Database + Shared Schema
- **Isolation:** Row-level isolation via tenant_id column
- **Super Admin:** Special case with tenant_id = NULL

### 3. **Authentication Flow**
- JWT-based stateless authentication
- Token includes userId, tenantId, role
- 24-hour token expiry with auto-refresh

### 4. **Authorization Model**
- Role-Based Access Control (RBAC)
- Middleware enforces permissions at endpoint level
- Tenant data isolation in all queries

### 5. **Subscription Management**
- Three tiers: Free, Pro, Enterprise
- Real-time enforcement of user and project limits
- Graceful degradation with clear error messages

### 6. **Containerization**
- Docker Compose with 3 services
- Automatic database initialization
- Health checks and service dependencies
- Single-command deployment

### 7. **Security Layers**
- Password hashing with bcrypt
- JWT token validation on all protected routes
- Parameterized SQL queries
- CORS configuration
- Audit logging for compliance
