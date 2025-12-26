# Database Entity Relationship Diagram (ERD)

```
┌──────────────────────────────────────────────────────────────────┐
│                    MULTI-TENANT SAAS DATABASE                     │
│                         PostgreSQL 14                             │
└──────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                            TENANTS                                  │
│─────────────────────────────────────────────────────────────────────│
│  id                 UUID PRIMARY KEY                                │
│  name               VARCHAR(255) NOT NULL                           │
│  subdomain          VARCHAR(255) UNIQUE NOT NULL ◄── Login ID      │
│  status             VARCHAR(50) DEFAULT 'active'                    │
│  subscription_plan  VARCHAR(50) DEFAULT 'free'                      │
│  max_users          INTEGER NOT NULL                                │
│  max_projects       INTEGER NOT NULL                                │
│  created_at         TIMESTAMP DEFAULT NOW()                         │
│  updated_at         TIMESTAMP DEFAULT NOW()                         │
│                                                                      │
│  INDEXES:                                                            │
│    • idx_tenants_subdomain ON (subdomain)                          │
│    • idx_tenants_status ON (status)                                │
└─────────────────────────────────────────────────────────────────────┘
         │
         │ ONE-TO-MANY
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                              USERS                                  │
│─────────────────────────────────────────────────────────────────────│
│  id                UUID PRIMARY KEY                                 │
│  tenant_id         UUID NULL ◄────────────────────┐                │
│                    REFERENCES tenants(id)         │ CASCADE         │
│                    ON DELETE CASCADE              │                 │
│  email             VARCHAR(255) NOT NULL          │                 │
│  password_hash     VARCHAR(255) NOT NULL          │                 │
│  full_name         VARCHAR(255) NOT NULL          │                 │
│  role              VARCHAR(50) NOT NULL           │                 │
│                    ('super_admin', 'tenant_admin', 'user')          │
│  is_active         BOOLEAN DEFAULT TRUE           │                 │
│  created_at        TIMESTAMP DEFAULT NOW()        │                 │
│  updated_at        TIMESTAMP DEFAULT NOW()        │                 │
│                                                    │                 │
│  CONSTRAINTS:                                      │                 │
│    • UNIQUE (tenant_id, email) ◄── No duplicate emails per tenant  │
│    • tenant_id = NULL only for super_admin        │                 │
│                                                    │                 │
│  INDEXES:                                          │                 │
│    • idx_users_tenant_id ON (tenant_id)          │                 │
│    • idx_users_email ON (email)                  │                 │
│    • idx_users_tenant_email ON (tenant_id, email)│                 │
│    • idx_users_role ON (role)                    │                 │
└─────────────────────────────────────────────────────────────────────┘
         │                                           │
         │ ONE-TO-MANY                              │ ONE-TO-MANY
         │ (created_by)                             │
         ▼                                           ▼
┌─────────────────────────────────────────────┐  ┌────────────────────┐
│            PROJECTS                         │  │   AUDIT_LOGS       │
│─────────────────────────────────────────────│  │────────────────────│
│  id              UUID PRIMARY KEY           │  │ id     UUID PK     │
│  tenant_id       UUID NOT NULL              │  │ tenant_id UUID NULL│
│                  REFERENCES tenants(id)     │  │   REFERENCES       │
│                  ON DELETE CASCADE          │  │   tenants(id)      │
│  name            VARCHAR(255) NOT NULL      │  │   ON DELETE CASCADE│
│  description     TEXT                       │  │ user_id UUID NULL  │
│  status          VARCHAR(50) DEFAULT 'active'  │   REFERENCES       │
│  created_by      UUID NOT NULL              │  │   users(id)        │
│                  REFERENCES users(id)       │  │   ON DELETE SET    │
│  created_at      TIMESTAMP DEFAULT NOW()    │  │   NULL             │
│  updated_at      TIMESTAMP DEFAULT NOW()    │  │ action VARCHAR(50) │
│                                              │  │ entity_type        │
│  INDEXES:                                    │  │   VARCHAR(50)      │
│    • idx_projects_tenant_id (tenant_id)     │  │ entity_id UUID     │
│    • idx_projects_created_by (created_by)   │  │ changes JSONB      │
│    • idx_projects_status (status)           │  │ ip_address VARCHAR │
└─────────────────────────────────────────────┘  │ user_agent TEXT    │
         │                                        │ created_at         │
         │ ONE-TO-MANY                            │   TIMESTAMP        │
         ▼                                        │                    │
┌─────────────────────────────────────────────┐  │ INDEXES:           │
│              TASKS                          │  │ • idx_audit_logs_  │
│─────────────────────────────────────────────│  │   tenant_id        │
│  id              UUID PRIMARY KEY           │  │ • idx_audit_logs_  │
│  project_id      UUID NOT NULL              │  │   user_id          │
│                  REFERENCES projects(id)    │  │ • idx_audit_logs_  │
│                  ON DELETE CASCADE          │  │   created_at       │
│  tenant_id       UUID NOT NULL              │  │ • idx_audit_logs_  │
│                  REFERENCES tenants(id)     │  │   entity_type      │
│                  ON DELETE CASCADE          │  └────────────────────┘
│  title           VARCHAR(255) NOT NULL      │
│  description     TEXT                       │
│  status          VARCHAR(50) DEFAULT 'todo' │
│                  ('todo', 'in_progress',    │
│                   'completed')              │
│  priority        VARCHAR(50) DEFAULT 'medium'
│                  ('low', 'medium', 'high')  │
│  assigned_to     UUID NULL                  │
│                  REFERENCES users(id)       │
│                  ON DELETE SET NULL         │
│  due_date        DATE                       │
│  created_at      TIMESTAMP DEFAULT NOW()    │
│  updated_at      TIMESTAMP DEFAULT NOW()    │
│                                              │
│  INDEXES:                                    │
│    • idx_tasks_project_id (project_id)      │
│    • idx_tasks_tenant_id (tenant_id)        │
│    • idx_tasks_assigned_to (assigned_to)    │
│    • idx_tasks_status (status)              │
│    • idx_tasks_priority (priority)          │
│    • idx_tasks_due_date (due_date)          │
└─────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                      RELATIONSHIP SUMMARY                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  TENANTS (1) ──── (N) USERS                                         │
│    • One tenant has many users                                      │
│    • CASCADE DELETE: Delete tenant → Delete all users              │
│    • UNIQUE (tenant_id, email): No duplicate emails per tenant     │
│                                                                      │
│  TENANTS (1) ──── (N) PROJECTS                                      │
│    • One tenant has many projects                                   │
│    • CASCADE DELETE: Delete tenant → Delete all projects           │
│    • Subscription limits enforced at application layer             │
│                                                                      │
│  USERS (1) ──── (N) PROJECTS (created_by)                           │
│    • One user creates many projects                                 │
│    • ON DELETE RESTRICT: Cannot delete user with projects          │
│                                                                      │
│  PROJECTS (1) ──── (N) TASKS                                        │
│    • One project has many tasks                                     │
│    • CASCADE DELETE: Delete project → Delete all tasks             │
│    • Denormalized tenant_id for efficient filtering                │
│                                                                      │
│  USERS (1) ──── (N) TASKS (assigned_to)                             │
│    • One user can be assigned to many tasks                         │
│    • ON DELETE SET NULL: Delete user → Unassign tasks              │
│                                                                      │
│  TENANTS (1) ──── (N) AUDIT_LOGS                                    │
│    • One tenant generates many audit logs                           │
│    • CASCADE DELETE: Delete tenant → Delete audit logs             │
│                                                                      │
│  USERS (1) ──── (N) AUDIT_LOGS                                      │
│    • One user generates many audit logs                             │
│    • ON DELETE SET NULL: Delete user → Keep logs                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                    MULTI-TENANCY ISOLATION                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Strategy: Row-Level Isolation via tenant_id                        │
│                                                                      │
│  Implementation:                                                     │
│    1. Every data table has tenant_id column                         │
│    2. All queries filtered by: WHERE tenant_id = ?                  │
│    3. Foreign key constraints ensure referential integrity          │
│    4. Indexes on tenant_id for query performance                    │
│                                                                      │
│  Super Admin Exception:                                              │
│    • Super admin users have tenant_id = NULL                        │
│    • Can access data across all tenants                             │
│    • UNIQUE (tenant_id, email) allows NULL tenant_id               │
│                                                                      │
│  Data Isolation Guarantees:                                          │
│    ✓ Users cannot see other tenants' data                           │
│    ✓ Queries automatically filtered by tenant_id                    │
│    ✓ CASCADE DELETE maintains referential integrity                 │
│    ✓ Unique constraints prevent email collisions                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                    SUBSCRIPTION LIMITS                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Stored in TENANTS table:                                            │
│    • max_users: Maximum users per tenant                            │
│    • max_projects: Maximum projects per tenant                      │
│                                                                      │
│  Enforced at Application Layer:                                      │
│                                                                      │
│  Plan: Free                                                          │
│    • max_users: 5                                                   │
│    • max_projects: 3                                                │
│                                                                      │
│  Plan: Pro                                                           │
│    • max_users: 25                                                  │
│    • max_projects: 15                                               │
│                                                                      │
│  Plan: Enterprise                                                    │
│    • max_users: 100                                                 │
│    • max_projects: 50                                               │
│                                                                      │
│  Enforcement Logic:                                                  │
│    1. Before creating user: COUNT(users WHERE tenant_id = ?)       │
│    2. Compare with max_users from tenants table                     │
│    3. If count >= max_users → Return 409 Conflict                  │
│    4. Same logic for projects                                       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                      AUDIT LOGGING                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Purpose: Immutable audit trail for compliance                      │
│                                                                      │
│  Logged Actions:                                                     │
│    • USER_REGISTERED, USER_LOGIN, USER_LOGOUT                       │
│    • USER_CREATED, USER_UPDATED, USER_DELETED                       │
│    • PROJECT_CREATED, PROJECT_UPDATED, PROJECT_DELETED              │
│    • TASK_CREATED, TASK_UPDATED, TASK_DELETED                       │
│    • TENANT_UPDATED                                                 │
│                                                                      │
│  Log Contents:                                                       │
│    • tenant_id: Which tenant performed action                       │
│    • user_id: Which user performed action                           │
│    • action: What action was performed                              │
│    • entity_type: What type of entity was affected                  │
│    • entity_id: Which specific entity was affected                  │
│    • changes: JSONB with before/after values                        │
│    • ip_address: Client IP address                                  │
│    • user_agent: Client browser/app                                 │
│    • created_at: Timestamp (immutable)                              │
│                                                                      │
│  Characteristics:                                                    │
│    • INSERT-only (no UPDATE or DELETE)                              │
│    • Indexed by tenant_id, user_id, created_at                      │
│    • Used for security audits and compliance reports                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                      INDEX STRATEGY                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Primary Indexes (Performance):                                      │
│    • tenant_id on all tables → Fast tenant filtering               │
│    • email on users → Fast login lookups                            │
│    • (tenant_id, email) on users → Enforce unique constraint       │
│    • subdomain on tenants → Fast tenant resolution                 │
│                                                                      │
│  Foreign Key Indexes:                                                │
│    • project_id on tasks → Fast project task lookups               │
│    • assigned_to on tasks → Fast user task lookups                 │
│    • created_by on projects → Fast user project lookups            │
│                                                                      │
│  Query Optimization Indexes:                                         │
│    • status on projects/tasks → Fast filtering                     │
│    • priority on tasks → Fast sorting                               │
│    • due_date on tasks → Fast date range queries                   │
│    • role on users → Fast role-based queries                       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                    QUERY PATTERNS                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Login Query:                                                        │
│    SELECT u.* FROM users u                                          │
│    JOIN tenants t ON u.tenant_id = t.id                             │
│    WHERE t.subdomain = ? AND u.email = ?                            │
│                                                                      │
│  List Projects (Tenant-Scoped):                                      │
│    SELECT * FROM projects                                           │
│    WHERE tenant_id = ?                                              │
│    ORDER BY created_at DESC                                         │
│                                                                      │
│  List Tasks (Project-Scoped):                                        │
│    SELECT t.*, u.full_name as assignee_name                         │
│    FROM tasks t                                                     │
│    LEFT JOIN users u ON t.assigned_to = u.id                        │
│    WHERE t.project_id = ? AND t.tenant_id = ?                       │
│                                                                      │
│  Check Subscription Limit:                                           │
│    SELECT COUNT(*) as count,                                        │
│           (SELECT max_users FROM tenants WHERE id = ?) as max       │
│    FROM users                                                       │
│    WHERE tenant_id = ?                                              │
│                                                                      │
│  Tenant Statistics:                                                  │
│    SELECT t.*,                                                      │
│           (SELECT COUNT(*) FROM users WHERE tenant_id = t.id),      │
│           (SELECT COUNT(*) FROM projects WHERE tenant_id = t.id)    │
│    FROM tenants t                                                   │
│    WHERE t.id = ?                                                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. **Multi-Tenancy Approach**
- **Shared Database + Shared Schema** for cost efficiency
- **Row-level isolation** with tenant_id column on every table
- **Super admin exception** with NULL tenant_id for system administrators

### 2. **Referential Integrity**
- **CASCADE DELETE** from tenants → Complete data cleanup
- **SET NULL** on user deletion for tasks → Preserve task history
- **RESTRICT** on critical relationships → Prevent data loss

### 3. **Email Uniqueness**
- **UNIQUE (tenant_id, email)** allows same email across tenants
- **NULL tenant_id** supported for super admin users
- **Prevents email collisions** within single tenant

### 4. **Denormalization**
- **tenant_id on tasks** (already in project) for efficient filtering
- **Avoids JOIN** on every task query
- **Small storage cost** for significant performance gain

### 5. **Audit Logging**
- **Separate table** for immutable audit trail
- **JSONB changes** column for flexible before/after tracking
- **Indexed by time** for efficient compliance queries

### 6. **Subscription Limits**
- **Stored in tenants table** for flexibility
- **Enforced at application layer** before INSERT
- **Per-tenant customization** possible

### 7. **Index Strategy**
- **Primary indexes** on tenant_id for multi-tenancy performance
- **Composite indexes** for frequent query patterns
- **Covering indexes** to avoid table lookups where possible
