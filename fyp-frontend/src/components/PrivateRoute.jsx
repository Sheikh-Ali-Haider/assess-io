import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * PrivateRoute Component
 * 
 * Guards route access based on:
 * 1. Authentication status
 * 2. User role (optional)
 * 
 * Props:
 * - children: Component to render if authorized
 * - allowedRoles: Array of roles allowed (e.g., ['admin', 'student'])
 *   If not provided, any authenticated user can access
 */
export const PrivateRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user role is allowed (if roles are specified)
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Authenticated and authorized - render the component
  return children;
};
