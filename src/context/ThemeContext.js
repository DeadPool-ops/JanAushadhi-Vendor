import React, { createContext, useState, useMemo } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const colors = useMemo(() => {
    return theme === 'dark'
      ? {
          background: '#0F172A',
          card: '#1E293B',
          text: '#F8FAFC',
          subText: '#CBD5E1',
          primary: '#38BDF8',
          border: '#334155',
        }
      : {
          background: '#F8FAFC',
          card: '#FFFFFF',
          text: '#0F172A',
          subText: '#475569',
          primary: '#2563EB',
          border: '#E2E8F0',
        };
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};
