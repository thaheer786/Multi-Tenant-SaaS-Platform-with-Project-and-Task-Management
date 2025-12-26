# Technical Specification

## 1. Project Structure

### 1.1 Complete Backend Structure

```
backend/
├── src/
│   ├── controllers/
│   │   ├── authController.js           # Auth business logic
│   │   ├── tenantController.js         # Tenant management
│   │   ├── userController.js           # User management
│   │   ├── projectController.js        # Project management
│   │   └── taskController.js           # Task management
│   │
│   ├── routes/
│   │   ├── index.js                    # Main routes aggregator
│   │   ├── authRoutes.js               # /api/auth/*
│   │   ├── tenantRoutes.js             # /api/tenants/*
│   │   ├── userRoutes.js               # /api/users/*
│   │   ├── projectRoutes.js            # /api/projects/*
│   │   └── taskRoutes.js               # /api/tasks/*
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js           # JWT validation
│   │   ├── authorizationMiddleware.js  # Role-based access
│   │   ├── tenantMiddleware.js         # Tenant isolation
│   │   ├── errorMiddleware.js          # Error handling
│   │   └── validationMiddleware.js     # Input validation
│   │
│   ├── utils/
│   │   ├── auditLogger.js              # Audit logging utility
│   │   ├── passwords.js                # Password hashing utilities
│   │   ├── validators.js               # Validation rules
│   │   ├── database.js                 # Database utilities
│   │   ├── jwt.js                      # JWT utilities
│   │   └── constants.js                # App constants
│   │
│   ├── config/
│   │   ├── database.js                 # DB connection config
│   │   ├── jwt.js                      # JWT config
│   │   └── constants.js                # Global constants
│   │
│   ├── app.js                          # Express app setup
│   └── logger.js                       # Logging setup
│
├── migrations/
│   ├── runMigrations.js                # Migration executor
│   ├── 001_create_tenants.sql
│   ├── 002_create_users.sql
│   ├── 003_create_projects.sql
│   ├── 004_create_tasks.sql
│   └── 005_create_audit_logs.sql
│
├── seeds/
│   ├── runSeeds.js                     # Seed executor
│   └── seed_data.sql                   # Seed SQL
│
├── docker-entrypoint.sh                # Docker startup script
├── Dockerfile
├── package.json
├── .env.example
├── .env                                # Environment variables
├── server.js                           # Application entry point
└── README.md
```

### 1.2 Complete Frontend Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── RegisterPage.jsx            # /register
│   │   ├── LoginPage.jsx               # /login
│   │   ├── DashboardPage.jsx           # /dashboard
│   │   ├── ProjectsPage.jsx            # /projects
│   │   ├── ProjectDetailsPage.jsx      # /projects/:id
│   │   ├── UsersPage.jsx               # /users
│   │   └── NotFoundPage.jsx            # 404 page
│   │
│   ├── components/
│   │   ├── NavigationBar.jsx           # Main navigation
│   │   ├── ProtectedRoute.jsx          # Route guard
│   │   ├── ProjectModal.jsx            # Create/edit project
│   │   ├── UserModal.jsx               # Create/edit user
│   │   ├── TaskModal.jsx               # Create/edit task
│   │   ├── TaskList.jsx                # Task display
│   │   ├── TaskCard.jsx                # Individual task
│   │   ├── ProjectCard.jsx             # Individual project
│   │   ├── Dashboard/
│   │   │   ├── StatisticsCard.jsx      # Stats cards
│   │   │   ├── RecentProjects.jsx      # Recent projects list
│   │   │   └── MyTasks.jsx             # User's tasks
│   │   └── Common/
│   │       ├── Button.jsx              # Reusable button
│   │       ├── Modal.jsx               # Modal wrapper
│   │       ├── Form.jsx                # Form wrapper
│   │       ├── Input.jsx               # Input field
│   │       ├── Select.jsx              # Dropdown
│   │       ├── Badge.jsx               # Status badge
│   │       └── LoadingSpinner.jsx      # Loading indicator
│   │
│   ├── hooks/
│   │   ├── useAuth.js                  # Auth state & methods
│   │   ├── useApi.js                   # API calls
│   │   ├── useTenant.js                # Tenant context
│   │   ├── useLocalStorage.js          # Local storage
│   │   └── useForm.js                  # Form state
│   │
│   ├── context/
│   │   ├── AuthContext.jsx             # Auth context
│   │   └── TenantContext.jsx           # Tenant context
│   │
│   ├── utils/
│   │   ├── api.js                      # API client (axios)
│   │   ├── storage.js                  # localStorage helpers
│   │   ├── validators.js               # Form validators
│   │   ├── formatters.js               # Date/text formatters
│   │   └── constants.js                # Frontend constants
│   │
│   ├── styles/
│   │   ├── index.css                   # Global styles
│   │   └── variables.css               # CSS variables
│   │
│   ├── App.jsx                         # Root component
│   ├── App.css
│   └── index.jsx                       # React entry point
│
├── public/
│   └── index.html                      # HTML template
│
├── Dockerfile
├── package.json
├── .env.example
├── .env
└── README.md
```

---

## 2. Key File Purposes

### Backend Key Files

**controllers/authController.js**
- `registerTenant()` - Create new tenant + admin user in transaction
- `login()` - Authenticate user and generate JWT
- `getCurrentUser()` - Return user profile with tenant info
- `logout()` - Invalidate session (optional)

**middleware/authMiddleware.js**
- `authenticateToken()` - Validate JWT and extract user info
- `extractTokenFromHeader()` - Parse Authorization header
- `verifyTokenSignature()` - Verify JWT hasn't been tampered

**middleware/authorizationMiddleware.js**
- `requireRole()` - Check user has required role(s)
- `requireTenantAccess()` - Check user belongs to tenant
- `requireResourceOwnership()` - Check user owns resource

**utils/auditLogger.js**
- `logAction()` - Insert action into audit_logs table
- Auto-includes: tenant_id, user_id, timestamp, IP address

**utils/validators.js**
- `validateEmail()` - Email format validation
- `validatePassword()` - Min 8 chars, no spaces
- `validateUUID()` - Valid UUID format
- `validateEnum()` - Check if value in enum set

### Frontend Key Files

**hooks/useAuth.js**
- State: user, token, isAuthenticated, isLoading
- Methods: register, login, logout, getCurrentUser
- Auto-redirect to login on unauthorized

**hooks/useApi.js**
- Wrapper around axios
- Auto-includes Authorization header with JWT
- Handles common errors and token expiry
- Response interceptor for error handling

**components/ProtectedRoute.jsx**
- Validates JWT token exists
- Checks token expiry
- Redirects to login if unauthorized
- Shows loading state while validating

**context/AuthContext.jsx**
- Global auth state
- Accessible from any component
- Persists JWT in localStorage

---

## 3. Development Setup

### 3.1 Prerequisites

**System Requirements:**
- Node.js: 18.16.0 or higher
- PostgreSQL: 14.0 or higher
- npm: 8.0 or higher
- Docker: 20.10 or higher (for containerized setup)
- Docker Compose: 1.29 or higher

**Verification:**
```bash
node --version    # Should output v18.x.x or higher
npm --version     # Should output 8.x.x or higher
psql --version    # Should output PostgreSQL 14.x
docker --version  # Docker version 20.10+
```

### 3.2 Local Development Setup

**Step 1: Clone and Setup Backend**
```bash
cd backend
npm install
```

**Step 2: Create .env file**
```bash
cp .env.example .env
# Edit .env with local database credentials
```

**Step 3: Setup Database**
```bash
# Start PostgreSQL (ensure it's running)
npm run migrate       # Run migrations
npm run seed         # Load seed data
```

**Step 4: Start Backend**
```bash
npm start            # Server runs on http://localhost:5000
```

**Step 5: Setup Frontend**
```bash
cd frontend
npm install
npm start            # Dev server runs on http://localhost:3000
```

**Step 6: Test Application**
- Navigate to http://localhost:3000
- Login with `admin@demo.com` / `Demo@123`
- Verify all pages load correctly

### 3.3 Docker Setup

**One-Command Startup:**
```bash
docker-compose up -d
```

**Verify Services:**
```bash
docker-compose ps
# Should show 3 services: database (Up), backend (Up), frontend (Up)
```

**Test Application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Database: localhost:5432 (psql connection)

**View Logs:**
```bash
docker-compose logs -f backend    # Backend logs
docker-compose logs -f frontend   # Frontend logs
docker-compose logs -f database   # Database logs
```

**Stop Services:**
```bash
docker-compose down
```

---

## 4. Key Configuration

### 4.1 Database Configuration

**Connection Pool:**
```javascript
// config/database.js
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,              // Max connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});
```

### 4.2 JWT Configuration

**Token Generation:**
```javascript
// Payload
{ userId, tenantId, role }

// Signature
HS256 with JWT_SECRET

// Expiry
24 hours (86400 seconds)
```

### 4.3 Password Hashing

**Bcrypt Configuration:**
```javascript
// Salt rounds: 10 (balance between security & performance)
// Hashing time: ~100ms
const hash = await bcrypt.hash(password, 10);
```

---

## 5. Running Migrations & Seeds

### 5.1 Manual Migration

**Run migrations manually:**
```bash
cd backend
npm run migrate
```

**Manually run specific migration:**
```bash
psql -h localhost -U postgres -d saas_db -f migrations/001_create_tenants.sql
```

### 5.2 Verify Seeds

**Check seed data:**
```bash
# Connect to database
psql -h localhost -U postgres -d saas_db

# Query seed data
SELECT COUNT(*) FROM tenants;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM projects;
```

### 5.3 Automatic Setup with Docker

```bash
# Migration and seeds run automatically on startup
docker-compose up -d

# Wait ~10 seconds for initialization
docker-compose exec backend curl http://localhost:5000/api/health
```

---

## 6. Testing

### 6.1 Backend Tests

**Run all tests:**
```bash
cd backend
npm test
```

**Test specific module:**
```bash
npm test -- authController.test.js
```

**Run with coverage:**
```bash
npm test -- --coverage
```

### 6.2 Frontend Tests

**Run all tests:**
```bash
cd frontend
npm test -- --watchAll=false
```

**Test specific component:**
```bash
npm test -- ProtectedRoute.test.jsx --watchAll=false
```

### 6.3 API Testing

**Using curl:**
```bash
# Test login endpoint
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@demo.com",
    "password": "Demo@123",
    "tenantSubdomain": "demo"
  }'
```

**Using Postman:**
1. Import `postman_collection.json` (if provided)
2. Set variables: base_url, token, tenant_id
3. Run requests in sequence

---

## 7. Debugging

### 7.1 Backend Debugging

**Enable debug logs:**
```bash
# .env
DEBUG=app:*
```

**Connect with debugger:**
```bash
node --inspect server.js
# Open chrome://inspect in Chrome DevTools
```

### 7.2 Frontend Debugging

**React DevTools:**
- Install React Developer Tools Chrome Extension
- Inspect components in browser DevTools

**Redux DevTools (if using Redux):**
- Install Redux DevTools Extension
- Debug state changes

### 7.3 Database Debugging

**Connect to database:**
```bash
psql -h localhost -U postgres -d saas_db
```

**Useful queries:**
```sql
-- Check migrations
SELECT * FROM tenant_migrations;

-- Check seed data
SELECT * FROM tenants;
SELECT * FROM users;

-- Check audit logs
SELECT * FROM audit_logs ORDER BY created_at DESC;
```

---

## 8. Performance Optimization

### 8.1 Database Optimization

**Indexes are critical:**
- Create indexes on tenant_id columns
- Use compound indexes for common queries
- Run EXPLAIN ANALYZE to optimize queries

**Example:**
```sql
-- Check query plan
EXPLAIN ANALYZE SELECT * FROM tasks WHERE project_id = $1 AND tenant_id = $2;
```

### 8.2 API Optimization

**Best practices:**
- Use pagination for large result sets
- Select only needed columns
- Use database joins instead of multiple queries
- Implement caching for frequently accessed data

### 8.3 Frontend Optimization

**Performance best practices:**
- Code splitting for pages
- Lazy loading of components
- Memoization of expensive components
- Minimize network requests

---

**Version:** 1.0  
**Last Updated:** December 2025
