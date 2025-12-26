import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/Register.css';

const Register = () => {
  const navigate = useNavigate();
  const { registerTenant, error } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tenantName: '',
    subdomain: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
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
    const subdomainRegex = /^[a-z0-9-]+$/;

    if (!formData.tenantName.trim()) errors.tenantName = 'Organization name is required';
    if (!formData.subdomain.trim()) errors.subdomain = 'Subdomain is required';
    if (!subdomainRegex.test(formData.subdomain)) {
      errors.subdomain = 'Subdomain can only contain lowercase letters, numbers, and hyphens';
    }
    if (!emailRegex.test(formData.email)) errors.email = 'Valid email is required';
    if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.fullName.trim()) errors.fullName = 'Full name is required';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);
      await registerTenant(
        formData.tenantName,
        formData.subdomain,
        formData.email,
        formData.password,
        formData.fullName
      );
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Create Your Organization</h1>
        <p className="auth-subtitle">Set up your SaaS workspace</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="tenantName">Organization Name</label>
            <input
              type="text"
              id="tenantName"
              name="tenantName"
              value={formData.tenantName}
              onChange={handleChange}
              placeholder="Your Company Inc."
              disabled={loading}
            />
            {validationErrors.tenantName && (
              <span className="error-text">{validationErrors.tenantName}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="subdomain">Subdomain</label>
            <input
              type="text"
              id="subdomain"
              name="subdomain"
              value={formData.subdomain}
              onChange={handleChange}
              placeholder="company-name"
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
              placeholder="admin@company.com"
              disabled={loading}
            />
            {validationErrors.email && (
              <span className="error-text">{validationErrors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="John Doe"
              disabled={loading}
            />
            {validationErrors.fullName && (
              <span className="error-text">{validationErrors.fullName}</span>
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
              placeholder="At least 8 characters"
              disabled={loading}
            />
            {validationErrors.password && (
              <span className="error-text">{validationErrors.password}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm password"
              disabled={loading}
            />
            {validationErrors.confirmPassword && (
              <span className="error-text">{validationErrors.confirmPassword}</span>
            )}
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Creating Organization...' : 'Create Organization'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <a href="/login">Sign in here</a>
        </p>
      </div>
    </div>
  );
};

export default Register;
