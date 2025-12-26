# Complete API Examples & Deployment Guide

## Table of Contents

- [Complete cURL Examples](#complete-curl-examples)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Monitoring & Logging](#monitoring--logging)
- [Troubleshooting](#troubleshooting)

---

## Complete cURL Examples

All examples use the demo environment. Replace with your actual URLs and tokens for production.

### Authentication Endpoints

#### 1. Register a New Tenant

```bash
curl -X POST http://localhost:5000/api/auth/register-tenant \
  -H "Content-Type: application/json" \
  -d '{
    "tenantName": "Acme Corporation",
    "subdomain": "acme-corp",
    "email": "admin@acme.com",
    "password": "SecurePass@123",
    "fullName": "John Admin"
  }'
```

**Success Response (201)**:
```json
{
  "success": true,
  "message": "Organization created successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "admin@acme.com",
      "fullName": "John Admin",
      "role": "tenant_admin",
      "isActive": true,
      "tenantId": "550e8400-e29b-41d4-a716-446655440001"
    },
    "tenant": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Acme Corporation",
      "subdomain": "acme-corp",
      "subscriptionPlan": "free",
      "status": "active",
      "maxUsers": 5,
      "maxProjects": 3
    }
  }
}
```

#### 2. Login User

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@acme.com",
    "password": "SecurePass@123",
    "tenantSubdomain": "acme-corp"
  }'
```

**Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "admin@acme.com",
      "fullName": "John Admin",
      "role": "tenant_admin",
      "isActive": true,
      "tenantId": "550e8400-e29b-41d4-a716-446655440001"
    },
    "tenant": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Acme Corporation",
      "subscriptionPlan": "free",
      "status": "active"
    }
  }
}
```

#### 3. Get Current User Profile

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

#### 4. Logout

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```

### Tenant Management

#### 5. Get Tenant Details with Statistics

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
TENANT_ID="550e8400-e29b-41d4-a716-446655440001"

curl -X GET http://localhost:5000/api/tenants/$TENANT_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Acme Corporation",
    "subdomain": "acme-corp",
    "status": "active",
    "subscriptionPlan": "free",
    "maxUsers": 5,
    "maxProjects": 3,
    "stats": {
      "totalUsers": 3,
      "totalProjects": 2,
      "totalTasks": 5
    },
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### 6. Update Tenant (Tenant Admin)

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
TENANT_ID="550e8400-e29b-41d4-a716-446655440001"

curl -X PUT http://localhost:5000/api/tenants/$TENANT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corp (Updated)"
  }'
```

#### 7. List All Tenants (Super Admin Only)

```bash
SUPER_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET "http://localhost:5000/api/tenants?page=1&limit=20" \
  -H "Authorization: Bearer $SUPER_TOKEN"
```

### User Management

#### 8. Create User in Tenant

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
TENANT_ID="550e8400-e29b-41d4-a716-446655440001"

curl -X POST http://localhost:5000/api/tenants/$TENANT_ID/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@acme.com",
    "password": "UserPass@456",
    "fullName": "John Doe",
    "role": "user"
  }'
```

#### 9. List Tenant Users with Search

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
TENANT_ID="550e8400-e29b-41d4-a716-446655440001"

curl -X GET "http://localhost:5000/api/tenants/$TENANT_ID/users?page=1&search=john&role=user" \
  -H "Authorization: Bearer $TOKEN"
```

#### 10. Update User Profile

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
USER_ID="550e8400-e29b-41d4-a716-446655440000"

# Regular user can update own fullName
curl -X PUT http://localhost:5000/api/users/$USER_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe (Updated)"
  }'

# Admin can update role
curl -X PUT http://localhost:5000/api/users/$USER_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "tenant_admin"
  }'
```

#### 11. Delete User

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
USER_ID="550e8400-e29b-41d4-a716-446655440000"

curl -X DELETE http://localhost:5000/api/users/$USER_ID \
  -H "Authorization: Bearer $TOKEN"
```

### Project Management

#### 12. Create Project

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X POST http://localhost:5000/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Website Redesign",
    "description": "Complete redesign of company website with modern UI/UX",
    "status": "active"
  }'
```

#### 13. List Projects with Filters

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# List all projects
curl -X GET "http://localhost:5000/api/projects" \
  -H "Authorization: Bearer $TOKEN"

# List with filters
curl -X GET "http://localhost:5000/api/projects?page=1&status=active&search=website" \
  -H "Authorization: Bearer $TOKEN"
```

#### 14. Update Project

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
PROJECT_ID="550e8400-e29b-41d4-a716-446655440003"

curl -X PUT http://localhost:5000/api/projects/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Website Redesign (Phase 2)",
    "status": "active"
  }'
```

#### 15. Delete Project

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
PROJECT_ID="550e8400-e29b-41d4-a716-446655440003"

curl -X DELETE http://localhost:5000/api/projects/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN"
```

### Task Management

#### 16. Create Task in Project

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
PROJECT_ID="550e8400-e29b-41d4-a716-446655440003"
ASSIGNED_USER="550e8400-e29b-41d4-a716-446655440002"

curl -X POST http://localhost:5000/api/projects/$PROJECT_ID/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Design homepage mockup",
    "description": "Create high-fidelity mockup for homepage",
    "priority": "high",
    "status": "todo",
    "assignedTo": "'$ASSIGNED_USER'",
    "dueDate": "2024-12-31"
  }'
```

#### 17. List Project Tasks with Filters

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
PROJECT_ID="550e8400-e29b-41d4-a716-446655440003"

# List all tasks
curl -X GET http://localhost:5000/api/projects/$PROJECT_ID/tasks \
  -H "Authorization: Bearer $TOKEN"

# Filter by status and priority
curl -X GET "http://localhost:5000/api/projects/$PROJECT_ID/tasks?status=in_progress&priority=high" \
  -H "Authorization: Bearer $TOKEN"

# Filter by assignee
curl -X GET "http://localhost:5000/api/projects/$PROJECT_ID/tasks?assignedTo=550e8400-e29b-41d4-a716-446655440002" \
  -H "Authorization: Bearer $TOKEN"
```

#### 18. Update Task Details

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
TASK_ID="550e8400-e29b-41d4-a716-446655440004"

curl -X PUT http://localhost:5000/api/tasks/$TASK_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Design homepage mockup (Updated)",
    "description": "Create high-fidelity mockup with improved typography",
    "priority": "medium",
    "status": "in_progress"
  }'
```

#### 19. Quick Status Update

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
TASK_ID="550e8400-e29b-41d4-a716-446655440004"

curl -X PATCH http://localhost:5000/api/tasks/$TASK_ID/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed"
  }'
```

#### 20. Delete Task

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
TASK_ID="550e8400-e29b-41d4-a716-446655440004"

curl -X DELETE http://localhost:5000/api/tasks/$TASK_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

## Docker Deployment

### Quick Start (Development)

```bash
cd gpp-task5

# Build and start all services
docker compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000/api
# Database: localhost:5432
```

### Production Deployment

#### 1. Prepare Environment Variables

Create `.env` file in project root:

```env
# Database
DB_HOST=your-prod-db-host
DB_PORT=5432
DB_NAME=saas_platform_prod
DB_USER=app_user
DB_PASSWORD=<strong-password>

# Backend
NODE_ENV=production
JWT_SECRET=<32+ character random string>
FRONTEND_URL=https://yourdomain.com
API_PORT=5000

# Frontend
REACT_APP_API_URL=https://api.yourdomain.com/api

# Optional
LOG_LEVEL=info
```

#### 2. Build Images with Tags

```bash
# Build backend
docker build -t your-registry/gpp-backend:1.0.0 backend/

# Build frontend
docker build -t your-registry/gpp-frontend:1.0.0 frontend/

# Push to registry
docker push your-registry/gpp-backend:1.0.0
docker push your-registry/gpp-frontend:1.0.0
```

#### 3. Update docker-compose.yml for Production

```yaml
version: '3.8'

services:
  database:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: saas_platform_prod
      POSTGRES_USER: app_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    image: your-registry/gpp-backend:1.0.0
    environment:
      DB_HOST: database
      DB_NAME: saas_platform_prod
      DB_USER: app_user
      DB_PASSWORD: ${DB_PASSWORD}
      NODE_ENV: production
      JWT_SECRET: ${JWT_SECRET}
      FRONTEND_URL: https://yourdomain.com
    ports:
      - "5000:5000"
    depends_on:
      database:
        condition: service_healthy

  frontend:
    image: your-registry/gpp-frontend:1.0.0
    environment:
      REACT_APP_API_URL: https://api.yourdomain.com/api
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

## Kubernetes Deployment

### Prepare Kubernetes Manifests

#### 1. Namespace

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: saas-platform
```

#### 2. ConfigMap for Environment

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: saas-platform
data:
  NODE_ENV: production
  FRONTEND_URL: "https://yourdomain.com"
  REACT_APP_API_URL: "https://api.yourdomain.com/api"
```

#### 3. Secret for Sensitive Data

```bash
kubectl create secret generic app-secrets \
  --from-literal=db-password=<strong-password> \
  --from-literal=jwt-secret=<32+-char-secret> \
  -n saas-platform
```

#### 4. PostgreSQL StatefulSet

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: saas-platform
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:14-alpine
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_DB
          value: saas_platform
        - name: POSTGRES_USER
          value: app_user
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: db-password
        volumeMounts:
        - name: data
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 10Gi
```

#### 5. Backend Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: saas-platform
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: your-registry/gpp-backend:1.0.0
        ports:
        - containerPort: 5000
        env:
        - name: DB_HOST
          value: postgres
        - name: DB_NAME
          value: saas_platform
        - name: DB_USER
          value: app_user
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: db-password
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: jwt-secret
        envFrom:
        - configMapRef:
            name: app-config
        livenessProbe:
          httpGet:
            path: /api/health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 5
```

#### 6. Frontend Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: saas-platform
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: your-registry/gpp-frontend:1.0.0
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: app-config
```

### Deploy to Kubernetes

```bash
# Create namespace and secrets
kubectl create namespace saas-platform
kubectl create secret generic app-secrets \
  --from-literal=db-password=mypassword \
  --from-literal=jwt-secret=my32characterjwtsecretkey \
  -n saas-platform

# Apply manifests
kubectl apply -f k8s-namespace.yaml
kubectl apply -f k8s-configmap.yaml
kubectl apply -f k8s-postgres.yaml
kubectl apply -f k8s-backend.yaml
kubectl apply -f k8s-frontend.yaml

# Check status
kubectl get pods -n saas-platform
kubectl logs -n saas-platform deployment/backend
```

---

## Monitoring & Logging

### Application Health Checks

```bash
# Backend health
curl http://localhost:5000/api/health

# Frontend health (should return HTML)
curl http://localhost:3000
```

### View Logs

```bash
# Docker logs
docker compose logs backend
docker compose logs frontend
docker compose logs database

# Kubernetes logs
kubectl logs -n saas-platform deployment/backend -f
kubectl logs -n saas-platform deployment/frontend -f
```

### Database Monitoring

```bash
# Connect to database
docker exec -it gpp-task5-database psql -U postgres -d saas_platform

# Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# Check audit log entries
SELECT COUNT(*) FROM audit_logs;
SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 10;
```

---

## Troubleshooting

### Backend Won't Start

**Error**: `listen EADDRINUSE :::5000`

```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or use a different port
PORT=5001 npm start
```

### Database Connection Failed

**Error**: `connect ECONNREFUSED 127.0.0.1:5432`

```bash
# Check if database is running
docker ps | grep postgres

# Restart database
docker compose restart database

# Check logs
docker compose logs database
```

### Login Fails with "Invalid Credentials"

**Reason**: Incorrect password hash or seed data issue

```bash
# Reseed the database
docker compose exec -T database psql -U postgres -d saas_platform -f /docker-entrypoint-initdb.d/seeds/seed_data.sql

# Or manually update password
docker compose exec -T database psql -U postgres -d saas_platform -c "
UPDATE users SET password_hash = '\$2b\$10\$...' WHERE email = 'admin@demo.com';
"
```

### CORS Errors on Frontend

**Error**: `Access to XMLHttpRequest blocked by CORS policy`

**Solution**: Check FRONTEND_URL in backend `.env`:

```env
# Should match your frontend URL
FRONTEND_URL=http://localhost:3000  # for development
FRONTEND_URL=https://yourdomain.com # for production
```

### Frontend Shows 404 on Refresh

**Reason**: React Router routes not configured on server

**Solution**: Configure nginx to serve index.html for all routes:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

---

**Last Updated**: 2024-01-15
