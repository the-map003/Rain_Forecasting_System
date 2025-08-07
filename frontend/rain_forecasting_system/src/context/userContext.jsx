import React, { createContext, useState, useEffect } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Keep your existing name

  // Add this useEffect to check localStorage on app initialization
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (storedUser && token) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear invalid data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setIsLoading(false); // Always set loading to false after initialization
      }
    };

    initializeAuth();
  }, []);
  
  const updateUser = (userData) => {
    setUser(userData);
    setIsLoading(false);
    
    // Also update localStorage
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    }
  };
  
  const clearUser = () => {
    setUser(null);
    setIsLoading(false);
    
    // Clear localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };
  
  return (
    <UserContext.Provider value={{ user, updateUser, clearUser, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};