import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import '../styles/ProjectDetails.css';
import { taskAPI } from '../utils/api';

const ProjectDetails = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: tasksData, execute: fetchTasks } = useApi(taskAPI.listTasks);
  const [loading, setLoading] = useState(true);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
  });
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  useEffect(() => {
    loadTasks();
  }, [statusFilter, priorityFilter]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      await fetchTasks(projectId, statusFilter, '', priorityFilter);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) {
      alert('Task title is required');
      return;
    }

    try {
      await taskAPI.createTask(projectId, {
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        status: newTask.status,
      });
      setNewTask({ title: '', description: '', priority: 'medium', status: 'todo' });
      setShowCreateTask(false);
      await loadTasks();
    } catch (err) {
      console.error('Failed to create task:', err);
      alert('Failed to create task');
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      await taskAPI.updateTaskStatus(taskId, { status: newStatus });
      await loadTasks();
    } catch (err) {
      console.error('Failed to update task:', err);
      alert('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      await taskAPI.deleteTask(taskId);
      await loadTasks();
    } catch (err) {
      console.error('Failed to delete task:', err);
      alert('Failed to delete task');
    }
  };

  if (loading) {
    return <div className="project-details-container"><div className="loading">Loading...</div></div>;
  }

  const taskList = Array.isArray(tasksData?.tasks) ? tasksData.tasks : [];
  const todoTasks = taskList.filter((t) => t.status === 'todo');
  const inProgressTasks = taskList.filter((t) => t.status === 'in_progress');
  const completedTasks = taskList.filter((t) => t.status === 'completed');

  return (
    <div className="project-details-container">
      <div className="project-header">
        <button className="btn-back" onClick={() => navigate('/projects')}>
          ← Back to Projects
        </button>
        <h1>Project Tasks</h1>
        <button className="btn-primary" onClick={() => setShowCreateTask(true)}>
          + Add Task
        </button>
      </div>

      <div className="task-filters">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Status</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      {taskList.length === 0 ? (
        <div className="empty-state">
          <p>No tasks found. Create your first task to get started!</p>
        </div>
      ) : (
        <div className="task-board">
          <div className="task-column">
            <h3 className="column-title">
              To Do ({todoTasks.length})
            </h3>
            <div className="tasks-list">
              {todoTasks.map((task) => (
                <div key={task.id} className="task-card">
                  <h4>{task.title}</h4>
                  <p>{task.description}</p>
                  <div className="task-meta">
                    <span className={`priority-badge ${task.priority}`}>
                      {task.priority.toUpperCase()}
                    </span>
                    {task.dueDate && <span className="due-date">{task.dueDate}</span>}
                  </div>
                  <div className="task-actions">
                    <button
                      className="btn-small"
                      onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                    >
                      Start
                    </button>
                    <button
                      className="btn-delete-small"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="task-column">
            <h3 className="column-title">
              In Progress ({inProgressTasks.length})
            </h3>
            <div className="tasks-list">
              {inProgressTasks.map((task) => (
                <div key={task.id} className="task-card in-progress">
                  <h4>{task.title}</h4>
                  <p>{task.description}</p>
                  <div className="task-meta">
                    <span className={`priority-badge ${task.priority}`}>
                      {task.priority.toUpperCase()}
                    </span>
                    {task.dueDate && <span className="due-date">{task.dueDate}</span>}
                  </div>
                  <div className="task-actions">
                    <button
                      className="btn-small"
                      onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                    >
                      Complete
                    </button>
                    <button
                      className="btn-delete-small"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="task-column">
            <h3 className="column-title">
              Completed ({completedTasks.length})
            </h3>
            <div className="tasks-list">
              {completedTasks.map((task) => (
                <div key={task.id} className="task-card completed">
                  <h4>{task.title}</h4>
                  <p>{task.description}</p>
                  <div className="task-meta">
                    <span className={`priority-badge ${task.priority}`}>
                      {task.priority.toUpperCase()}
                    </span>
                    {task.dueDate && <span className="due-date">{task.dueDate}</span>}
                  </div>
                  <button
                    className="btn-delete-small"
                    onClick={() => handleDeleteTask(task.id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showCreateTask && (
        <div className="modal-overlay" onClick={() => setShowCreateTask(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Task</h2>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label htmlFor="taskTitle">Task Title</label>
                <input
                  type="text"
                  id="taskTitle"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Enter task title"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="taskDescription">Description</label>
                <textarea
                  id="taskDescription"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Enter task description (optional)"
                  rows="3"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="taskPriority">Priority</label>
                  <select
                    id="taskPriority"
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="taskStatus">Status</label>
                  <select
                    id="taskStatus"
                    value={newTask.status}
                    onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateTask(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
