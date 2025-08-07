import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // Check if token exists in localStorage
  const isAuthenticated = !!localStorage.getItem('token');
  
  if (isAuthenticated) {
    return children;
  }
  
  // If not authenticated, redirect to login
  return <Navigate to="/login" />;
};

export default ProtectedRoute;