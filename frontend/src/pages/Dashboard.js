import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import '../styles/Dashboard.css';
import { tenantAPI } from '../utils/api';

const Dashboard = () => {
  const { user, tenant } = useAuth();
  const { data: tenantStats, execute: fetchTenantStats } = useApi(tenantAPI.getTenant);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        if (tenant?.id) {
          await fetchTenantStats(tenant.id);
        }
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [tenant?.id, fetchTenantStats]);

  if (loading) {
    return <div className="dashboard-container"><div className="loading">Loading...</div></div>;
  }

  return (
    <div className="dashboard-container">
      <h1>Welcome, {user?.fullName}!</h1>
      <p className="subtitle">Organization: {tenant?.name}</p>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{tenantStats?.userCount || 0}</div>
          <div className="stat-label">Team Members</div>
          <div className="stat-limit">
            {tenantStats?.userCount || 0} / {tenantStats?.maxUsers || 0}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-number">{tenantStats?.projectCount || 0}</div>
          <div className="stat-label">Projects</div>
          <div className="stat-limit">
            {tenantStats?.projectCount || 0} / {tenantStats?.maxProjects || 0}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-number">{tenantStats?.taskCount || 0}</div>
          <div className="stat-label">Tasks</div>
          <div className="stat-detail">In all projects</div>
        </div>

        <div className="stat-card">
          <div className="stat-plan">{tenant?.subscriptionPlan?.toUpperCase()}</div>
          <div className="stat-label">Plan</div>
          <div className="stat-detail">Active plan</div>
        </div>
      </div>

      <div className="dashboard-info">
        <div className="info-section">
          <h2>Getting Started</h2>
          <ul>
            <li>
              <strong>Create a Project:</strong> Projects help organize your work and tasks
            </li>
            <li>
              <strong>Invite Team Members:</strong> Collaborate with your team by adding users
            </li>
            <li>
              <strong>Create Tasks:</strong> Break down projects into manageable tasks
            </li>
            <li>
              <strong>Track Progress:</strong> Monitor task status and project completion
            </li>
          </ul>
        </div>

        <div className="info-section">
          <h2>Your Subscription</h2>
          <p>
            You are on the <strong>{tenant?.subscriptionPlan?.toUpperCase()}</strong> plan.
          </p>
          <p>
            Current usage: <strong>{tenantStats?.userCount || 0}</strong> of{' '}
            <strong>{tenantStats?.maxUsers || 0}</strong> team members and{' '}
            <strong>{tenantStats?.projectCount || 0}</strong> of{' '}
            <strong>{tenantStats?.maxProjects || 0}</strong> projects.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
