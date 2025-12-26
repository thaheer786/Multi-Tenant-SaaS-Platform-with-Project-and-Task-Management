import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import '../styles/Users.css';
import { userAPI } from '../utils/api';

const Users = () => {
  const { user: currentUser, tenant } = useAuth();
  const { data: usersData, execute: fetchUsers } = useApi(userAPI.listUsers);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'user',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    loadUsers();
  }, [searchQuery, roleFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      await fetchUsers(tenant.id, 1, searchQuery, roleFilter);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();

    if (!newUser.email.trim() || !newUser.password.trim() || !newUser.fullName.trim()) {
      alert('All fields are required');
      return;
    }

    try {
      await userAPI.createUser(tenant.id, newUser);
      setNewUser({ email: '', password: '', fullName: '', role: 'user' });
      setShowCreateModal(false);
      await loadUsers();
    } catch (err) {
      console.error('Failed to create user:', err);
      alert(err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await userAPI.deleteUser(userId);
      await loadUsers();
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert('Failed to delete user');
    }
  };

  if (loading) {
    return <div className="users-container"><div className="loading">Loading...</div></div>;
  }

  const userList = Array.isArray(usersData?.users) ? usersData.users : [];
  const canManageUsers = currentUser.role === 'tenant_admin' || currentUser.role === 'super_admin';

  return (
    <div className="users-container">
      <div className="users-header">
        <h1>Team Members</h1>
        {canManageUsers && (
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            + Add User
          </button>
        )}
      </div>

      <div className="users-filters">
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Roles</option>
          <option value="tenant_admin">Tenant Admin</option>
          <option value="user">User</option>
        </select>
      </div>

      {userList.length === 0 ? (
        <div className="empty-state">
          <p>No users found.</p>
        </div>
      ) : (
        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                {canManageUsers && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {userList.map((user) => (
                <tr key={user.id}>
                  <td>{user.fullName}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge ${user.role}`}>
                      {user.role === 'tenant_admin' ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  {canManageUsers && (
                    <td className="actions-cell">
                      {user.id !== currentUser.id && (
                        <button
                          className="btn-delete"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          Remove
                        </button>
                      )}
                      {user.id === currentUser.id && <span className="self-user">(You)</span>}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreateModal && canManageUsers && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add Team Member</h2>
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label htmlFor="userEmail">Email</label>
                <input
                  type="email"
                  id="userEmail"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="user@company.com"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="userFullName">Full Name</label>
                <input
                  type="text"
                  id="userFullName"
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="userPassword">Password</label>
                <input
                  type="password"
                  id="userPassword"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="At least 8 characters"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="userRole">Role</label>
                <select
                  id="userRole"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="user">User</option>
                  <option value="tenant_admin">Tenant Admin</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
