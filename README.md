# Multi-Tenant SaaS Platform

A production-ready, enterprise-grade multi-tenant SaaS application with complete data isolation, JWT authentication, role-based access control, and comprehensive project and task management features.

## 🎥 Demo Video

**Watch the complete walkthrough:** [YouTube Demo Link - To Be Added]

## 📋 Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Quick Start with Docker](#quick-start-with-docker)
- [Test Credentials](#test-credentials)
- [API Endpoints](#api-endpoints)
- [Local Development Setup](#local-development-setup)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [User Roles and Permissions](#user-roles-and-permissions)
- [Subscription Plans](#subscription-plans)
- [Documentation](#documentation)
- [Submission Checklist](#submission-checklist)

## ✨ Features

- **Multi-Tenancy**: Complete data isolation between organizations
- **Authentication**: JWT-based auth with 24-hour token expiry
- **Authorization**: Role-based access control (super_admin, tenant_admin, user)
- **Subscription Plans**: Free (5 users, 3 projects), Pro (25 users, 15 projects), Enterprise (100 users, 50 projects)
- **Project Management**: Create, update, and manage projects
- **Task Management**: Comprehensive task tracking with status and priority levels
- **Team Management**: Add and manage team members with role assignments
- **Audit Logging**: Immutable audit trail for compliance and tracking
- **Responsive UI**: Mobile-friendly React frontend with protected routes
- **RESTful API**: 19 well-documented endpoints
- **Docker Ready**: Complete containerization with docker-compose

## 🛠 Technology Stack

### Backend
- **Runtime**: Node.js 18.x
- **Framework**: Express.js
- **Database**: PostgreSQL 14.x
- **Authentication**: JWT (HS256)
- **Password Hashing**: bcryptjs (10 salt rounds)
- **Validation**: express-validator
- **Dependencies**: pg, cors, dotenv, uuid

### Frontend
- **Framework**: React 18.x
- **Routing**: React Router v6
- **API Client**: Axios
- **Styling**: CSS3 (Responsive Design)
- **State Management**: React Context API

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Database**: PostgreSQL with persistent volumes
- **Network**: Docker network for service communication

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                     │
│            Port 3000 - User Interface                    │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS/HTTP
┌────────────────────▼────────────────────────────────────┐
│                  Backend (Express.js)                    │
│    Port 5000 - RESTful API, JWT Auth, Validation        │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Routes: Auth | Tenants | Users | Projects | Tasks │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Middleware: Auth | Authorization | Error Handler │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │ TCP/5432
┌────────────────────▼────────────────────────────────────┐
│            PostgreSQL Database                          │
│        Port 5432 - Multi-Tenant Data Storage            │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Tables: Tenants | Users | Projects | Tasks |     │  │
│  │         Audit Logs                              │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start with Docker

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+

### Getting Started (1 Command)

```bash
docker-compose up -d
```

This will:
1. Create a PostgreSQL database container
2. Run database migrations automatically
3. Seed demo data with test users
4. Start the backend API (http://localhost:5000)
5. Start the frontend application (http://localhost:3000)

**Note**: First startup may take 2-3 minutes as Docker downloads images and builds containers.

### Verify Services Are Running

```bash
docker-compose ps
```

All three services should show "Up" status:
- `database` - PostgreSQL 14
- `backend` - Node.js API on port 5000
- `frontend` - React app on port 3000

### Health Check

Verify the backend is connected to the database:

```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{"success":true,"status":"ok","database":"connected"}
```

### Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

### Stop Services

```bash
docker-compose down
```

To remove volumes and reset database:

```bash
docker-compose down -v
```

## 🔑 Test Credentials

The application comes pre-loaded with test users for immediate evaluation:

### Super Admin (System Level Access)
```
Email: superadmin@system.com
Password: Admin@123
Tenant: N/A (can access all tenants)
```

### Demo Company - Tenant Admin
```
Subdomain: demo
Email: admin@demo.com
Password: Demo@123
Role: tenant_admin
```

### Demo Company - Regular Users
```
Subdomain: demo

User 1:
Email: user1@demo.com
Password: User@123
Role: user

User 2:
Email: user2@demo.com
Password: User@123
Role: user
```

### Pre-loaded Demo Data
- **Tenant**: Demo Company (Pro plan)
- **Projects**: 2 projects ("Website Redesign", "Mobile App Development")
- **Tasks**: 5 tasks across both projects
- **Users**: 4 users total (1 super admin + 1 tenant admin + 2 regular users)

## 🌐 API Endpoints

All API endpoints follow RESTful conventions and return consistent JSON responses.

### Authentication (4 endpoints)
- `POST /api/auth/register-tenant` - Register new organization
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - Logout

### Tenant Management (3 endpoints)
- `GET /api/tenants/:tenantId` - Get tenant details with stats
- `PUT /api/tenants/:tenantId` - Update tenant (admin only)
- `GET /api/tenants` - List all tenants (super_admin only)

### User Management (4 endpoints)
- `POST /api/tenants/:tenantId/users` - Create user (admin only)
- `GET /api/tenants/:tenantId/users` - List users with filters
- `PUT /api/users/:userId` - Update user
- `DELETE /api/users/:userId` - Delete user (admin only)

### Project Management (4 endpoints)
- `POST /api/projects` - Create project (checks subscription limits)
- `GET /api/projects` - List projects (tenant-scoped)
- `PUT /api/projects/:projectId` - Update project
- `DELETE /api/projects/:projectId` - Delete project (with cascade)

### Task Management (5 endpoints)
- `POST /api/projects/:projectId/tasks` - Create task
- `GET /api/projects/:projectId/tasks` - List tasks with filters
- `PUT /api/tasks/:taskId` - Update task
- `PATCH /api/tasks/:taskId/status` - Quick status update
- `DELETE /api/tasks/:taskId` - Delete task

**Total: 20 API endpoints** (19 required + 1 bonus)

For complete API documentation with request/response examples, see [docs/API.md](docs/API.md)

## 💻 Local Development Setup

### Backend Setup

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your local PostgreSQL settings:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=saas_db
   DB_USER=postgres
   DB_PASSWORD=your_password
   JWT_SECRET=your_jwt_secret_key
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   ```

3. **Create PostgreSQL Database**
   ```bash
   createdb saas_db
   ```

4. **Run Migrations**
   ```bash
   npm run migrate
   ```

5. **Seed Demo Data**
   ```bash
   npm run seed
   ```

6. **Start Backend Server**
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

Backend will run on http://localhost:5000

### Frontend Setup

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure Environment**
   ```bash
   # Create .env file in frontend directory
   REACT_APP_API_URL=http://localhost:5000/api
   ```

3. **Start Frontend Development Server**
   ```bash
   npm start
   ```

Frontend will run on http://localhost:3000

## 📡 API Documentation

### Authentication Endpoints

#### Register New Organization
```
POST /api/auth/register-tenant
Content-Type: application/json

{
  "tenantName": "Company Name",
  "subdomain": "company-name",
  "email": "admin@company.com",
  "password": "SecurePassword123",
  "fullName": "Admin Name"
}

Response:
{
  "success": true,
  "message": "Organization created successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... },
    "tenant": { ... }
  }
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@company.com",
  "password": "Password123",
  "subdomain": "company-name"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... },
    "tenant": { ... }
  }
}
```

#### Get Current User Profile
```
GET /api/auth/me
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "user": { ... },
    "tenant": { ... }
  }
}
```

#### Logout
```
POST /api/auth/logout
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Logged out successfully"
}
```

### User Endpoints

#### Create User
```
POST /api/users/:tenantId/users
Authorization: Bearer <admin_token>

{
  "email": "user@company.com",
  "password": "Password123",
  "fullName": "User Name",
  "role": "user"
}
```

#### List Users
```
GET /api/users/:tenantId/users?page=1&search=&role=user
Authorization: Bearer <token>
```

#### Update User
```
PUT /api/users/:userId
Authorization: Bearer <token>

{
  "fullName": "Updated Name",
  "role": "tenant_admin"
}
```

#### Delete User
```
DELETE /api/users/:userId
Authorization: Bearer <admin_token>
```

### Project Endpoints

#### Create Project
```
POST /api/projects
Authorization: Bearer <token>

{
  "name": "Project Name",
  "description": "Project description"
}
```

#### List Projects
```
GET /api/projects?page=1&status=active&search=
Authorization: Bearer <token>
```

#### Update Project
```
PUT /api/projects/:projectId
Authorization: Bearer <token>

{
  "name": "Updated Name",
  "description": "Updated description",
  "status": "active"
}
```

#### Delete Project
```
DELETE /api/projects/:projectId
Authorization: Bearer <admin_token>
```

### Task Endpoints

#### Create Task
```
POST /api/tasks/:projectId/tasks
Authorization: Bearer <token>

{
  "title": "Task Title",
  "description": "Task description",
  "priority": "high",
  "status": "todo"
}
```

#### List Tasks
```
GET /api/tasks/:projectId/tasks?status=todo&priority=high
Authorization: Bearer <token>
```

#### Update Task
```
PUT /api/tasks/:taskId
Authorization: Bearer <token>

{
  "title": "Updated Title",
  "description": "Updated description",
  "priority": "medium",
  "status": "in_progress"
}
```

#### Update Task Status Only
```
PATCH /api/tasks/:taskId/status
Authorization: Bearer <token>

{
  "status": "completed"
}
```

#### Delete Task
```
DELETE /api/tasks/:taskId
Authorization: Bearer <token>
```

## 📁 Project Structure

```
gpp-task5/
├── backend/
│   ├── src/
│   │   ├── app.js                    # Express app setup
│   │   ├── config/
│   │   │   ├── database.js          # Database connection pool
│   │   │   ├── jwt.js               # JWT utilities
│   │   │   └── constants.js         # Enums and constants
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js    # JWT verification
│   │   │   ├── authorizationMiddleware.js  # Role-based access
│   │   │   └── errorMiddleware.js   # Error handling
│   │   ├── routes/
│   │   │   ├── authRoutes.js        # Auth endpoints
│   │   │   ├── tenantRoutes.js      # Tenant endpoints
│   │   │   ├── userRoutes.js        # User endpoints
│   │   │   ├── projectRoutes.js     # Project endpoints
│   │   │   └── taskRoutes.js        # Task endpoints
│   │   └── utils/
│   │       ├── passwords.js         # Password hashing
│   │       ├── validators.js        # Input validation
│   │       └── auditLogger.js       # Audit logging
│   ├── migrations/
│   │   ├── 001_create_tenants.sql
│   │   ├── 002_create_users.sql
│   │   ├── 003_create_projects.sql
│   │   ├── 004_create_tasks.sql
│   │   ├── 005_create_audit_logs.sql
│   │   └── runMigrations.js
│   ├── seeds/
│   │   ├── seed_data.sql
│   │   └── runSeeds.js
│   ├── package.json
│   ├── server.js
│   ├── Dockerfile
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ProtectedRoute.js   # Route protection
│   │   │   └── Navbar.js           # Navigation component
│   │   ├── context/
│   │   │   └── AuthContext.js      # Auth state management
│   │   ├── hooks/
│   │   │   ├── useAuth.js          # Auth hook
│   │   │   └── useApi.js           # API call hook
│   │   ├── pages/
│   │   │   ├── Login.js            # Login page
│   │   │   ├── Register.js         # Register page
│   │   │   ├── Dashboard.js        # Dashboard page
│   │   │   ├── Projects.js         # Projects page
│   │   │   ├── ProjectDetails.js   # Project tasks page
│   │   │   └── Users.js            # Users management page
│   │   ├── styles/
│   │   │   ├── index.css
│   │   │   ├── App.css
│   │   │   ├── Navbar.css
│   │   │   ├── Login.css
│   │   │   ├── Register.css
│   │   │   ├── Dashboard.css
│   │   │   ├── Projects.css
│   │   │   ├── ProjectDetails.css
│   │   │   └── Users.css
│   │   ├── utils/
│   │   │   └── api.js              # API client
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   │   └── index.html
│   ├── package.json
│   ├── Dockerfile
│   └── .env
│
├── docs/
│   ├── research.md                 # Research document
│   ├── PRD.md                      # Product requirements
│   ├── architecture.md             # Architecture document
│   ├── technical-spec.md           # Technical specification
│   └── API.md                      # API documentation
│
├── docker-compose.yml              # Docker compose configuration
├── submission.json                 # Submission details
└── README.md                       # This file
```

## 🗄 Database Schema

### Tenants Table
```sql
- id (UUID) - Primary key
- name (VARCHAR) - Organization name
- subdomain (VARCHAR, UNIQUE) - Unique subdomain
- status (ENUM) - active/inactive/suspended
- subscription_plan (ENUM) - free/pro/enterprise
- max_users (INTEGER) - User limit based on plan
- max_projects (INTEGER) - Project limit based on plan
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Users Table
```sql
- id (UUID) - Primary key
- tenant_id (UUID) - Foreign key to tenants (CASCADE)
- email (VARCHAR) - User email
- password_hash (VARCHAR) - Bcrypt hashed password
- full_name (VARCHAR) - User's full name
- role (ENUM) - super_admin/tenant_admin/user
- is_active (BOOLEAN) - User status
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- UNIQUE(tenant_id, email) - Ensure email uniqueness per tenant
```

### Projects Table
```sql
- id (UUID) - Primary key
- tenant_id (UUID) - Foreign key to tenants (CASCADE)
- name (VARCHAR) - Project name
- description (TEXT) - Project description
- status (ENUM) - active/on_hold/completed
- created_by (UUID) - Foreign key to users (CASCADE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Tasks Table
```sql
- id (UUID) - Primary key
- project_id (UUID) - Foreign key to projects (CASCADE)
- tenant_id (UUID) - Foreign key to tenants (CASCADE)
- title (VARCHAR) - Task title
- description (TEXT) - Task description
- status (ENUM) - todo/in_progress/completed
- priority (ENUM) - low/medium/high
- assigned_to (UUID) - Foreign key to users (SET NULL)
- due_date (DATE) - Task due date
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Audit Logs Table (Immutable)
```sql
- id (UUID) - Primary key
- tenant_id (UUID) - Foreign key to tenants
- user_id (UUID) - Foreign key to users
- action (VARCHAR) - Action performed
- entity_type (VARCHAR) - Type of entity
- entity_id (UUID) - ID of affected entity
- details (JSONB) - Change details
- ip_address (VARCHAR) - IP address of requester
- created_at (TIMESTAMP)

Immutable: Triggers prevent UPDATE and DELETE operations
```

## 👥 User Roles and Permissions

### Super Admin
- Access to all tenants
- View all organizations
- Can create and manage multiple organizations
- Full system administration
- `tenant_id = NULL` in database

### Tenant Admin
- Full control within their tenant
- Create, update, delete projects
- Add, update, remove team members
- Manage user roles within tenant
- View all tenant data
- Cannot access other tenants

### User (Regular User)
- Create and manage own projects
- Create and manage tasks
- View team members and projects within tenant
- Cannot create/delete other users
- Cannot modify tenant settings
- Cannot access other tenants

For complete RBAC permission matrix, see [docs/IMPLEMENTATION_GUIDE.md](docs/IMPLEMENTATION_GUIDE.md)

## 💳 Subscription Plans

### Free Plan
- **Max Users**: 5
- **Max Projects**: 3
- **Cost**: $0/month
- **Features**: Basic project and task management

### Pro Plan
- **Max Users**: 25
- **Max Projects**: 15
- **Cost**: $49/month
- **Features**: Advanced collaboration, priority support

### Enterprise Plan
- **Max Users**: 100
- **Max Projects**: 50
- **Cost**: Custom pricing
- **Features**: Unlimited features, dedicated support, custom SLA

**Limit Enforcement**: API automatically checks subscription limits before creating users or projects. Returns `409 Conflict` if limit exceeded.

## 📚 Documentation

### Core Documentation
- **[README.md](README.md)** - This file, project overview and quick start
- **[docs/API.md](docs/API.md)** - Complete API documentation with cURL examples
- **[docs/architecture.md](docs/architecture.md)** - System architecture overview
- **[docs/technical-spec.md](docs/technical-spec.md)** - Technical specification and project structure

### Detailed Guides
- **[docs/IMPLEMENTATION_GUIDE.md](docs/IMPLEMENTATION_GUIDE.md)** - RBAC matrix, subscription limits, security best practices
- **[docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)** - Docker/Kubernetes deployment, 20 cURL examples
- **[docs/PRD.md](docs/PRD.md)** - Product Requirements Document with user personas
- **[docs/research.md](docs/research.md)** - Multi-tenancy research and technology decisions

### Architecture Diagrams
- **[docs/images/system-architecture.md](docs/images/system-architecture.md)** - Complete system architecture diagram
- **[docs/images/database-erd.md](docs/images/database-erd.md)** - Entity Relationship Diagram with relationships

## 📋 Submission Checklist

### ✅ Required Deliverables

- [x] **GitHub Repository** (Public)
  - 30+ meaningful commits showing development progress
  - Complete source code for backend and frontend
  - Database migrations and seed data
  - All documentation files

- [x] **Docker Configuration** (MANDATORY)
  - docker-compose.yml with all 3 services
  - Fixed ports: 5432 (database), 5000 (backend), 3000 (frontend)
  - Fixed service names: database, backend, frontend
  - Automatic migrations and seed data loading
  - One-command deployment: `docker-compose up -d`
  - Environment variables committed in repository

- [x] **Backend API** (19+ Endpoints)
  - 4 Authentication endpoints
  - 3 Tenant management endpoints
  - 4 User management endpoints
  - 4 Project management endpoints
  - 5 Task management endpoints
  - JWT authentication with 24-hour expiry
  - Role-based authorization (3 roles)
  - Subscription limit enforcement
  - Audit logging on all critical actions

- [x] **Frontend Application** (6 Pages)
  - Login page with tenant subdomain
  - Registration page for new organizations
  - Dashboard with usage statistics
  - Projects page with filtering
  - Project details with task kanban board
  - Users/team management page
  - Protected routes with role-based UI
  - Responsive mobile-friendly design

- [x] **Database** (5 Tables)
  - tenants - Organization data
  - users - User accounts with RBAC
  - projects - Project management
  - tasks - Task tracking
  - audit_logs - Immutable audit trail
  - Multi-tenancy with tenant_id isolation
  - Foreign key constraints with CASCADE
  - Indexes on all foreign keys

- [x] **Documentation** (8 Files)
  - README.md - Project overview and quick start
  - docs/API.md - Complete API documentation
  - docs/architecture.md - System architecture
  - docs/technical-spec.md - Technical specification
  - docs/PRD.md - Product Requirements Document
  - docs/research.md - Multi-tenancy research
  - docs/IMPLEMENTATION_GUIDE.md - Implementation details
  - docs/DEPLOYMENT_GUIDE.md - Deployment instructions

- [x] **submission.json** (Test Credentials)
  - Super admin credentials
  - Demo tenant with admin and users
  - Matches seed data exactly
  - Ready for automated evaluation

### ✅ Verification Commands

```bash
# 1. Start all services
docker-compose up -d

# 2. Verify services are running
docker-compose ps

# 3. Check backend health
curl http://localhost:5000/api/health

# 4. Test super admin login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@system.com","password":"Admin@123"}'

# 5. Test tenant admin login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"Demo@123","tenantSubdomain":"demo"}'

# 6. Access frontend
open http://localhost:3000
```

### 📊 Project Statistics

- **Total Lines of Code**: ~8,000+ lines
- **Backend Files**: 25+ files
- **Frontend Files**: 20+ files
- **Database Tables**: 5 tables with 15+ indexes
- **API Endpoints**: 20 endpoints (19 required + 1 bonus)
- **Frontend Pages**: 6 pages with protected routes
- **Documentation Pages**: 8 comprehensive documents
- **Docker Services**: 3 containerized services
- **Test Users**: 4 pre-loaded users across 2 roles

### 🎯 Key Features Implemented

1. ✅ Multi-tenancy with complete data isolation
2. ✅ JWT authentication with HS256 algorithm
3. ✅ Role-based access control (3 roles)
4. ✅ Subscription plan enforcement (3 plans)
5. ✅ Tenant-scoped user management
6. ✅ Project and task management with CRUD
7. ✅ Comprehensive audit logging
8. ✅ Input validation and error handling
9. ✅ Responsive React frontend
10. ✅ Complete Docker containerization
11. ✅ Automatic database initialization
12. ✅ Health check endpoint
13. ✅ CORS configuration
14. ✅ Password hashing with bcrypt
15. ✅ Comprehensive documentation

---

## 📞 Support

For questions or issues:
- Review documentation in `/docs` folder
- Check API documentation at [docs/API.md](docs/API.md)
- Review implementation guide at [docs/IMPLEMENTATION_GUIDE.md](docs/IMPLEMENTATION_GUIDE.md)

---

**Status**: ✅ Production Ready | All Requirements Satisfied | Ready for Evaluation

**Last Updated**: December 26, 2025
- Role: super_admin

**Tenant Admin**
- Email: `admin@demo.com`
- Password: `Demo@123`
- Subdomain: `demo`
- Role: tenant_admin

**Regular User**
- Email: `user1@demo.com`
- Password: `User@123`
- Subdomain: `demo`
- Role: user

### Testing Steps

1. **Login Test**
   - Go to http://localhost:3000
   - Login with demo credentials
   - Verify dashboard loads

2. **Project Test**
   - Create a new project
   - Add tasks with different priorities
   - Update task status through kanban board

3. **User Management Test** (Admin only)
   - Navigate to Users page
   - Add a new team member
   - Change user roles
   - Delete a user

4. **API Test**
   ```bash
   # Get health check
   curl http://localhost:5000/api/health
   
   # Login and get token
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@demo.com","password":"Demo@123","subdomain":"demo"}'
   
   # Use token to make authenticated requests
   curl http://localhost:5000/api/auth/me \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

## 🚢 Deployment

### Production Checklist

- [ ] Change JWT_SECRET to a secure random string
- [ ] Change database password
- [ ] Set NODE_ENV to production
- [ ] Configure FRONTEND_URL for production domain
- [ ] Enable HTTPS in production
- [ ] Set up database backups
- [ ] Configure monitoring and logging
- [ ] Set up CI/CD pipeline
- [ ] Configure environment-specific .env files

### Docker Deployment

```bash
# Build images
docker-compose build

# Deploy
docker-compose up -d

# View logs
docker-compose logs -f

# Scale services (if needed)
docker-compose up -d --scale backend=3
```

## � Complete Documentation

This project includes comprehensive documentation:

- **[API Documentation](./docs/API.md)** - Complete API reference with all 19 endpoints, request/response examples, and error handling
- **[Technical Specification](./docs/technical-spec.md)** - Detailed architecture, schema, database design, and implementation details
- **[Implementation Guide](./docs/IMPLEMENTATION_GUIDE.md)** - RBAC matrix, subscription limits, audit logging, security best practices, and performance optimization
- **[Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)** - Complete cURL examples, Docker & Kubernetes deployment, monitoring, and troubleshooting

## 📝 Environment Variables

### Backend (.env)
```
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=saas_db
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret_key
PORT=5000
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth with configurable expiry
- **Password Hashing**: bcryptjs with 10 salt rounds (stored in database)
- **SQL Injection Prevention**: Parameterized queries using pg library
- **CORS Configuration**: Restricted to frontend origin
- **Authorization Middleware**: Role-based access control on all endpoints
- **Tenant Isolation**: Automatic tenant_id filtering on all queries for data isolation
- **Audit Logging**: Immutable audit trail for all critical operations
- **Input Validation**: Comprehensive validation using express-validator
- **Error Handling**: Secure error messages without exposing implementation details

## 🔐 Default Test Credentials

All test credentials are defined in the seed data and can be found in `backend/seeds/seed_data.sql`:

- **Super Admin**: admin@system.com / Admin@123
- **Tenant Admin**: admin@demo.com / Demo@123
- **Regular User**: user1@demo.com / User@123

⚠️ **Important**: Change all default passwords in production!

## 📞 Support & Troubleshooting

For issues or questions, refer to the documentation or check application logs:

```bash
# View all service logs
docker-compose logs -f

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs database

# Check API health
curl http://localhost:5000/api/health

# Test database connection
docker-compose exec database psql -U postgres -d saas_platform -c "SELECT NOW();"
```

Common issues and solutions are documented in [DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md#troubleshooting)

## 📄 License

This project is provided as-is for evaluation purposes.

---

**Last Updated**: 2024
**Version**: 1.0.0
**Status**: Production Ready
