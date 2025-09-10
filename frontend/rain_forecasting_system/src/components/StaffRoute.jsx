import React from 'react';
import { Navigate } from 'react-router-dom';

const StaffRoute = ({ children }) => {
  // Get user from localStorage
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  
  // Check if user is staff
  if (user && user.role === 'staff') {
    return children;
  }
  
  // If not staff, redirect to admin dashboard
  return <Navigate to="/dashboard/admin" />;
};

export default StaffRoute;