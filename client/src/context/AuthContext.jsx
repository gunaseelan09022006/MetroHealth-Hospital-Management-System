import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setToken } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    async function loadUser() {
      try {
        const savedToken = localStorage.getItem('hms_token');
        if (savedToken) {
          const res = await api.auth.me();
          setUser(res.user);
        } else {
          // Auto-login with admin demo for initial seamless presentation
          const res = await api.auth.switchRole('admin');
          setToken(res.token);
          setUser(res.user);
        }
      } catch (err) {
        console.warn('Auth session recovery failed, switching to default demo user:', err.message);
        try {
          const res = await api.auth.switchRole('admin');
          setToken(res.token);
          setUser(res.user);
        } catch (inner) {
          console.error('Demo auth failed:', inner);
        }
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = async (username, password) => {
    try {
      const res = await api.auth.login(username, password);
      setToken(res.token);
      setUser(res.user);
      addToast(`Welcome back, ${res.user.name}!`, 'success');
      return res.user;
    } catch (err) {
      addToast(err.message, 'error');
      throw err;
    }
  };

  const switchRole = async (role) => {
    try {
      const res = await api.auth.switchRole(role);
      setToken(res.token);
      setUser(res.user);
      addToast(`Switched active view to ${res.user.role.toUpperCase()} (${res.user.name})`, 'info');
      return res.user;
    } catch (err) {
      addToast(err.message, 'error');
      throw err;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    addToast('Logged out successfully', 'info');
  };

  // RBAC permission check
  const hasPermission = (module, action = 'view') => {
    if (!user) return false;
    if (user.role === 'admin') return true;

    if (user.role === 'doctor') {
      if (module === 'billing' && action !== 'view') return false;
      return ['dashboard', 'patients', 'appointments', 'doctors', 'schedules', 'prescriptions'].includes(module);
    }

    if (user.role === 'receptionist') {
      if (module === 'prescriptions' && action !== 'view') return false;
      return ['dashboard', 'patients', 'appointments', 'doctors', 'schedules', 'billing', 'prescriptions'].includes(module);
    }

    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        switchRole,
        hasPermission,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

