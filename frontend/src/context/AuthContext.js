import { createContext, useEffect, useState } from 'react';
import { authAPI } from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth from stored token
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const { data } = await authAPI.getProfile();
          if (data.success) {
            setUser(data.data.user);
            setTenant(data.data.tenant);
          }
        } catch (err) {
          localStorage.removeItem('authToken');
          setError(err.message);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password, subdomain) => {
    try {
      setError(null);
      const { data } = await authAPI.login({ email, password, subdomain });
      if (data.success) {
        localStorage.setItem('authToken', data.data.token);
        setUser(data.data.user);
        // Load tenant from /auth/me since login response returns minimal tenant info
        try {
          const profile = await authAPI.getProfile();
          if (profile.data.success) {
            setTenant(profile.data.data.tenant);
          }
        } catch {}
        return data.data;
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      setError(message);
      throw err;
    }
  };

  const registerTenant = async (tenantName, subdomain, email, password, fullName) => {
    try {
      setError(null);
      const { data } = await authAPI.registerTenant({
        tenantName,
        subdomain,
        email,
        password,
        fullName,
      });
      if (data.success) {
        localStorage.setItem('authToken', data.data.token);
        setUser(data.data.user);
        setTenant(data.data.tenant);
        return data.data;
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      setError(message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('authToken');
      setUser(null);
      setTenant(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, tenant, loading, error, login, registerTenant, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
