import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children }) => {
  // Get user from localStorage
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  
  // Check if user is admin
  if (user && user.role === 'admin') {
    return children;
  }
  
  // If not admin, redirect to user dashboard
  return <Navigate to="/dashboard/user" />;
};

export default AdminRoute;