import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import '../styles/Projects.css';
import { projectAPI } from '../utils/api';

const Projects = () => {
  const { user, tenant } = useAuth();
  const { data: projectsData, execute: fetchProjects } = useApi(projectAPI.listProjects);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadProjects();
  }, [statusFilter, searchQuery]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      await fetchProjects(1, statusFilter, searchQuery);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProject.name.trim()) {
      alert('Project name is required');
      return;
    }

    try {
      await projectAPI.createProject({
        name: newProject.name,
        description: newProject.description,
        tenantId: tenant.id,
      });
      setNewProject({ name: '', description: '' });
      setShowCreateModal(false);
      await loadProjects();
    } catch (err) {
      console.error('Failed to create project:', err);
      alert('Failed to create project');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;

    try {
      await projectAPI.deleteProject(projectId);
      await loadProjects();
    } catch (err) {
      console.error('Failed to delete project:', err);
      alert('Failed to delete project');
    }
  };

  if (loading) {
    return <div className="projects-container"><div className="loading">Loading...</div></div>;
  }

  const projectList = Array.isArray(projectsData?.projects) ? projectsData.projects : [];

  return (
    <div className="projects-container">
      <div className="projects-header">
        <h1>Projects</h1>
        {(user.role === 'tenant_admin' || user.role === 'super_admin') && (
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            + Create Project
          </button>
        )}
      </div>

      <div className="projects-filters">
        <input
          type="text"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="on_hold">On Hold</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {projectList.length === 0 ? (
        <div className="empty-state">
          <p>No projects found. Create your first project to get started!</p>
        </div>
      ) : (
        <div className="projects-grid">
          {projectList.map((project) => (
            <div key={project.id} className="project-card">
              <Link to={`/projects/${project.id}`} className="project-link">
                <h3>{project.name}</h3>
                <p>{project.description || 'No description'}</p>
              </Link>
              <div className="project-info">
                <span className={`status-badge ${project.status}`}>{project.status}</span>
                <span className="task-count">{project.taskCount || 0} tasks</span>
              </div>
              {(user.role === 'tenant_admin' || user.role === 'super_admin') && (
                <button
                  className="btn-delete"
                  onClick={() => handleDeleteProject(project.id)}
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Project</h2>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label htmlFor="projectName">Project Name</label>
                <input
                  type="text"
                  id="projectName"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="Enter project name"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="projectDescription">Description</label>
                <textarea
                  id="projectDescription"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Enter project description (optional)"
                  rows="4"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
