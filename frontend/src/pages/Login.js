import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login, error } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    subdomain: '',
  });
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(formData.email)) errors.email = 'Valid email is required';
    if (!formData.password) errors.password = 'Password is required';
    if (!formData.subdomain.trim()) errors.subdomain = 'Subdomain is required';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);
      await login(formData.email, formData.password, formData.subdomain);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Welcome Back</h1>
        <p className="auth-subtitle">Sign in to your workspace</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="subdomain">Subdomain</label>
            <input
              type="text"
              id="subdomain"
              name="subdomain"
              value={formData.subdomain}
              onChange={handleChange}
              placeholder="your-company"
              disabled={loading}
            />
            {validationErrors.subdomain && (
              <span className="error-text">{validationErrors.subdomain}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="user@company.com"
              disabled={loading}
            />
            {validationErrors.email && (
              <span className="error-text">{validationErrors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              disabled={loading}
            />
            {validationErrors.password && (
              <span className="error-text">{validationErrors.password}</span>
            )}
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer">
          New to our platform? <a href="/register">Create an organization</a>
        </p>

        <div className="demo-credentials">
          <p className="demo-title">Demo Credentials:</p>
          <p>Email: admin@demo.com</p>
          <p>Subdomain: demo</p>
          <p>Password: Demo@123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
