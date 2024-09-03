// src/contexts/ThemeContext.js
import React, { createContext, useState, useContext } from 'react';

// Define themes
const lightTheme = {
  backgroundColor: '#ffffff',
  textColor: '#000000',
  buttonBackgroundColor: '#007bff',
  buttonTextColor: '#ffffff',
  cardBackgroundColor: '#f9f9f9',
  reactionButtonColor: '#e0e0e0',
  headerBackgroundColor: '#f4f4f4',
};

const darkTheme = {
  backgroundColor: '#000000',
  textColor: '#ffffff',
  buttonBackgroundColor: '#1e90ff',
  buttonTextColor: '#ffffff',
  cardBackgroundColor: '#333333',
  reactionButtonColor: '#555555',
  headerBackgroundColor: '#333333',
};

// Create a context
const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(lightTheme); // Default to light theme

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === lightTheme ? darkTheme : lightTheme));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the ThemeContext
export const useTheme = () => useContext(ThemeContext);
