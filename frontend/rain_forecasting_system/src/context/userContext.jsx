import React, { createContext, useState } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  
  const updateUser = (userData) => {
    setUser(userData);
    setIsLoading(false); // Set loading to false once user is set
  };
  
  const clearUser = () => {
    setUser(null);
    setIsLoading(false); // Set loading to false when user is cleared
  };
  
  return (
    <UserContext.Provider value={{ user, updateUser, clearUser, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};