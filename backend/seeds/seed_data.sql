-- Seed Data for Multi-Tenant SaaS Platform
-- This file contains demo data for testing

-- First, insert super admin user (with NULL tenant_id)
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active)
VALUES (
  'a0000000-0000-0000-0000-000000000001'::UUID,
  NULL,
  'superadmin@system.com',
  '$2a$10$KzOufNzOTQQIpM/d3YW.4.VXUSX5JQA2l06bBHBpSTWfN1NiXbhU2', -- bcrypt hash of "Admin@123"
  'Super Administrator',
  'super_admin',
  TRUE
)
ON CONFLICT DO NOTHING;

-- Insert demo tenant
INSERT INTO tenants (id, name, subdomain, status, subscription_plan, max_users, max_projects)
VALUES (
  '10000000-0000-0000-0000-000000000001'::UUID,
  'Demo Company',
  'demo',
  'active',
  'pro',
  25,
  15
)
ON CONFLICT (subdomain) DO NOTHING;

-- Insert tenant admin user for demo tenant
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active)
VALUES (
  '10000000-1111-0000-0000-000000000001'::UUID,
  '10000000-0000-0000-0000-000000000001'::UUID,
  'admin@demo.com',
  '$2a$10$tX7vqc4h/M8TOPb.Ix5d4OfgG4pzcbsqxs.mHpQjG5LF0wfujQ81K', -- bcrypt hash of "Demo@123"
  'Demo Admin',
  'tenant_admin',
  TRUE
)
ON CONFLICT (tenant_id, email) DO NOTHING;

-- Insert regular users for demo tenant
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active)
VALUES
(
  '10000000-2222-0000-0000-000000000001'::UUID,
  '10000000-0000-0000-0000-000000000001'::UUID,
  'user1@demo.com',
  '$2a$10$pPptqwyJOcfrpSy5tzRpJOpVQNNtKxBhEHwnR4//.CyLt5aLC.GcC', -- bcrypt hash of "User@123"
  'John Developer',
  'user',
  TRUE
),
(
  '10000000-3333-0000-0000-000000000001'::UUID,
  '10000000-0000-0000-0000-000000000001'::UUID,
  'user2@demo.com',
  '$2a$10$pPptqwyJOcfrpSy5tzRpJOpVQNNtKxBhEHwnR4//.CyLt5aLC.GcC', -- bcrypt hash of "User@123"
  'Jane Designer',
  'user',
  TRUE
)
ON CONFLICT (tenant_id, email) DO NOTHING;

-- Insert sample projects for demo tenant
INSERT INTO projects (id, tenant_id, name, description, status, created_by)
VALUES
(
  '20000000-0000-0000-0000-000000000001'::UUID,
  '10000000-0000-0000-0000-000000000001'::UUID,
  'Website Redesign',
  'Complete redesign of company website with modern UI/UX',
  'active',
  '10000000-1111-0000-0000-000000000001'::UUID
),
(
  '20000000-0000-0000-0000-000000000002'::UUID,
  '10000000-0000-0000-0000-000000000001'::UUID,
  'Mobile App Development',
  'Native mobile app for iOS and Android platforms',
  'active',
  '10000000-1111-0000-0000-000000000001'::UUID
)
ON CONFLICT DO NOTHING;

-- Insert sample tasks for first project
INSERT INTO tasks (id, project_id, tenant_id, title, description, status, priority, assigned_to, due_date)
VALUES
(
  '30000000-0000-0000-0000-000000000001'::UUID,
  '20000000-0000-0000-0000-000000000001'::UUID,
  '10000000-0000-0000-0000-000000000001'::UUID,
  'Design homepage mockup',
  'Create high-fidelity mockup for homepage',
  'completed',
  'high',
  '10000000-2222-0000-0000-000000000001'::UUID,
  '2024-06-15'
),
(
  '30000000-0000-0000-0000-000000000002'::UUID,
  '20000000-0000-0000-0000-000000000001'::UUID,
  '10000000-0000-0000-0000-000000000001'::UUID,
  'Implement responsive CSS',
  'Make design responsive for all screen sizes',
  'in_progress',
  'high',
  '10000000-3333-0000-0000-000000000001'::UUID,
  '2024-06-20'
),
(
  '30000000-0000-0000-0000-000000000003'::UUID,
  '20000000-0000-0000-0000-000000000001'::UUID,
  '10000000-0000-0000-0000-000000000001'::UUID,
  'Set up backend API routes',
  'Create REST endpoints for website data',
  'todo',
  'medium',
  NULL,
  '2024-06-25'
)
ON CONFLICT DO NOTHING;

-- Insert sample tasks for second project
INSERT INTO tasks (id, project_id, tenant_id, title, description, status, priority, assigned_to, due_date)
VALUES
(
  '30000000-0000-0000-0000-000000000004'::UUID,
  '20000000-0000-0000-0000-000000000002'::UUID,
  '10000000-0000-0000-0000-000000000001'::UUID,
  'Setup iOS development environment',
  'Configure Xcode and dependencies for iOS development',
  'completed',
  'high',
  '10000000-2222-0000-0000-000000000001'::UUID,
  '2024-06-10'
),
(
  '30000000-0000-0000-0000-000000000005'::UUID,
  '20000000-0000-0000-0000-000000000002'::UUID,
  '10000000-0000-0000-0000-000000000001'::UUID,
  'Create Android app UI',
  'Design UI layouts for Android using Material Design',
  'in_progress',
  'high',
  '10000000-3333-0000-0000-000000000001'::UUID,
  '2024-06-22'
)
ON CONFLICT DO NOTHING;
