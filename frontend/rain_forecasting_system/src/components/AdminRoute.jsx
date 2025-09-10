import React, { useContext, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { UserContext } from '../context/userContext';

const AdminRoute = ({ children }) => {
  const navigate = useNavigate();
  const { user, isLoading } = useContext(UserContext);
  
  // Get token and user from localStorage for immediate check
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  
  useEffect(() => {
    // If no token or user data, redirect to login
    if (!token || !storedUser) {
      navigate('/login');
    }
  }, [token, storedUser, navigate]);
  
  // Show loading state while checking auth
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>;
  }
  
  // Check if user exists and has valid token
  if (!token || !storedUser) {
    return <Navigate to="/login" replace />;
  }
  
  // Parse stored user
  let parsedUser;
  try {
    parsedUser = JSON.parse(storedUser);
  } catch (error) {
    // If user data is corrupted, clear and redirect
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }
  
  // Check if user is admin
  if (parsedUser && parsedUser.role === 'admin') {
    return children;
  }
  
  // If user exists but not admin, redirect to appropriate dashboard
  if (parsedUser && parsedUser.role === 'staff') {
    return <Navigate to="/dashboard/user" replace />;
  }
  
  // Default redirect to login
  return <Navigate to="/login" replace />;
};

export default AdminRoute;