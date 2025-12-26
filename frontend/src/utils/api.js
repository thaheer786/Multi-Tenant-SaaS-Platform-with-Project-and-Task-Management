import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle responses
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  // Map frontend fields to backend expected payload
  registerTenant: ({ tenantName, subdomain, email, password, fullName }) =>
    apiClient.post('/auth/register-tenant', {
      tenantName,
      subdomain,
      adminEmail: email,
      adminPassword: password,
      adminFullName: fullName,
    }),
  // Accept either subdomain or tenantSubdomain, map to backend key
  login: ({ email, password, subdomain, tenantSubdomain }) =>
    apiClient.post('/auth/login', {
      email,
      password,
      tenantSubdomain: tenantSubdomain || subdomain,
    }),
  getProfile: () => apiClient.get('/auth/me'),
  logout: () => apiClient.post('/auth/logout'),
};

export const tenantAPI = {
  getTenant: (tenantId) => apiClient.get(`/tenants/${tenantId}`),
  updateTenant: (tenantId, data) => apiClient.put(`/tenants/${tenantId}`, data),
  listTenants: (page = 1) => apiClient.get('/tenants', { params: { page } }),
};

export const userAPI = {
  createUser: (tenantId, data) => apiClient.post(`/tenants/${tenantId}/users`, data),
  listUsers: (tenantId, page = 1, search = '', role = '') =>
    apiClient.get(`/tenants/${tenantId}/users`, { params: { page, search, role } }),
  updateUser: (userId, data) => apiClient.put(`/users/${userId}`, data),
  deleteUser: (userId) => apiClient.delete(`/users/${userId}`),
};

export const projectAPI = {
  createProject: (data) => apiClient.post('/projects', data),
  listProjects: (page = 1, status = '', search = '') =>
    apiClient.get('/projects', { params: { page, status, search } }),
  updateProject: (projectId, data) => apiClient.put(`/projects/${projectId}`, data),
  deleteProject: (projectId) => apiClient.delete(`/projects/${projectId}`),
};

export const taskAPI = {
  // Tasks are nested under projects
  createTask: (projectId, data) => apiClient.post(`/projects/${projectId}/tasks`, data),
  listTasks: (projectId, status = '', assignedTo = '', priority = '') =>
    apiClient.get(`/projects/${projectId}/tasks`, { params: { status, assignedTo, priority } }),
  updateTask: (taskId, data) => apiClient.put(`/tasks/${taskId}`, data),
  updateTaskStatus: (taskId, data) => apiClient.patch(`/tasks/${taskId}/status`, data),
  deleteTask: (taskId) => apiClient.delete(`/tasks/${taskId}`),
};

export default apiClient;
