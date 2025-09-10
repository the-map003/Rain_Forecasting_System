import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import Login from './pages/Auth/Login';
import SignUp from './pages/Auth/SignUp';
import Home from './pages/Dashboard/Home';
import User_Dashboard from './pages/User_Dashboard/User_Dashboard';
import Change_Password from './pages/Users/Change_Password';
import Add_User from './pages/Users/Add_User';
import Manage_User from './pages/Users/Manage_User';
import User_Report from './pages/Users/User_Report';

import { UserProvider } from './context/userContext';
import { Toaster } from 'react-hot-toast';
import ChangePasswordModal from './components/ChangePasswordModal';
import AdminRoute from './components/AdminRoute';
import StaffRoute from './components/StaffRoute';
import ProtectedRoute from './components/ProtectedRoute';

const Root = () => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in and needs to change password
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      // If user hasn't changed their password yet, show the modal
      if (parsedUser && parsedUser.passwordChanged === false) {
        setShowPasswordModal(true);
      }
    }
  }, []);

  const handlePasswordChangeSuccess = () => {
    // Update the user in localStorage
    if (user) {
      const updatedUser = { ...user, passwordChanged: true };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
    setShowPasswordModal(false);
  };

  // Check if token exists in localStorage
  const isAuthenticated = !!localStorage.getItem("token");
  
  // Get user role from localStorage
  const userRole = user?.role || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).role : null);

  // redirect to appropriate dashboard based on role if authenticated, otherwise redirect to login
  return (
    <>
      {isAuthenticated ? (
        userRole === 'admin' ? (
          <Navigate to="/dashboard/admin" />
        ) : userRole === 'staff' ? (
          <Navigate to="/dashboard/user" />
        ) : (
          <Navigate to="/login" />
        )
      ) : (
        <Navigate to="/login" />
      )}
      
      {/* Password Change Modal */}
      <ChangePasswordModal 
        isOpen={showPasswordModal} 
        onClose={() => setShowPasswordModal(false)} 
        onSuccess={handlePasswordChangeSuccess} 
      />
    </>
  );
};

const App = () => {
  return (
    <UserProvider>
      <div>
        <Router>
          <Routes>
            <Route path="/" element={<Root />}/>
            <Route path="/login" exact element={<Login />}/>
            <Route path="/signUp" exact element={<SignUp />}/>
            <Route path="/dashboard/admin" exact element={
              <AdminRoute>
                <Home />
              </AdminRoute>
            }/>
            <Route path="/dashboard/user" exact element={
              <StaffRoute>
                <User_Dashboard />
              </StaffRoute>
            }/>
            <Route path="/dashboard/admin/users/add-user" exact element={
              <AdminRoute>
                <Add_User />
              </AdminRoute>
            }/>
            <Route path="/dashboard/admin/users/manage-user" exact element={
              <AdminRoute>
                <Manage_User />
              </AdminRoute>
            }/>
            <Route path="/dashboard/admin/users/user-report" exact element={
              <AdminRoute>
                <User_Report />
              </AdminRoute>
            }/>
            <Route path="/settings/change-password" exact element={
              <ProtectedRoute>
                <Change_Password />
              </ProtectedRoute>
            }/>
          </Routes>
        </Router>
      </div>
      <Toaster 
        toastOptions={{
          className: '',
          style: {
            fontSize: '14px',
          }
        }}
      />
    </UserProvider>
  );
};

export default App;