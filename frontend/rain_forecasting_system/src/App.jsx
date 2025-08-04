import React from 'react'

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import Login from './pages/Auth/Login';
import SignUp from './pages/Auth/SignUp';
import Home from './pages/Dashboard/Home';
import { UserProvider } from './context/userContext';// Changed to import as a named export
import { Toaster } from 'react-hot-toast';

const App = () => {
  return (
    <UserProvider>
    <div>
    <Router>
        <Routes>
            <Route path="/" element={<Root />}/>
            <Route path="/login" exact element={<Login />}/>
            <Route path="/signUp" exact element={<SignUp />}/>
            <Route path="/dashboard/admin" exact element={<Home />}/>
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

export default App

const Root = () => {
  //Check if token exists in localStorage
  const isAuthenticated = !!localStorage.getItem("token");

  // redirect to dashboard if authenticated, otherwise redirect to login
  return isAuthenticated ? (
    <Navigate to ="/dashboard/admin" />
  ) : (
    <Navigate to ="/login" />
  );
};