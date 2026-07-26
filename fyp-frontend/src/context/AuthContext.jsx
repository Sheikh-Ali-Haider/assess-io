import React, { createContext, useState, useContext, useEffect } from 'react';
import { loginUser } from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedAuth = localStorage.getItem('isAuthenticated');
    if (savedUser && savedAuth === 'true') {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
  }, []);

  // Login — sends email and password, backend returns JWT token + user info
  const login = async (email, password) => {
    try {
      const userData = await loginUser(email, password);

      // Save the token in localStorage — apiFetch will automatically use it.
      localStorage.setItem('token', userData.token);

      const userToSave = {
        id:             userData.id,
        name:           userData.name,
        email:          userData.email,
        role:           userData.role,
        department:     userData.department,
        specialization: userData.specialization,
        matricNumber:   userData.matric_number,
      };

      setUser(userToSave);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(userToSave));
      localStorage.setItem('isAuthenticated', 'true');

      return { success: true, message: 'Login successful', user: userToSave };

    } catch (err) {
      const message = typeof err === 'string'
        ? err
        : err?.message || 'Invalid email or password.';

      return { success: false, message };
    }
  };

 // On logout, also remove the token.
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
