import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [settings, setSettings] = useState({
    primaryColor: '#3B82F6',
    secondaryColor: '#6B7280',
    darkModePrimaryColor: '#1F2937',
    darkModeSecondaryColor: '#374151',
    darkModeEnabled: false
  });

  useEffect(() => {
    fetchSettings();
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme !== null) {
      setIsDarkMode(JSON.parse(savedTheme));
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
    }
  }, []);

  useEffect(() => {
    applyTheme();
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode, settings]);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch('http://localhost:5000/api/settings', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await response.json();
      if (data.success) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching theme settings:', error);
    }
  };

  const applyTheme = () => {
    const root = document.documentElement;
    const useDark = isDarkMode && settings.darkModeEnabled;

    // Toggle a 'dark' class for frameworks/utilities that use it
    root.classList.toggle('dark', useDark);

    if (useDark) {
      root.style.setProperty('--primary-color', settings.darkModePrimaryColor);
      root.style.setProperty('--secondary-color', settings.darkModeSecondaryColor);
      root.style.setProperty('--bg-color', '#111827');
      root.style.setProperty('--surface-color', settings.darkModePrimaryColor);
      root.style.setProperty('--text-color', '#F9FAFB');
      root.style.setProperty('--text-secondary', '#D1D5DB');
      document.body.style.backgroundColor = '#111827';
      document.body.style.color = '#F9FAFB';
    } else {
      root.style.setProperty('--primary-color', settings.primaryColor);
      root.style.setProperty('--secondary-color', settings.secondaryColor);
      root.style.setProperty('--bg-color', '#F9FAFB');
      root.style.setProperty('--surface-color', '#FFFFFF');
      root.style.setProperty('--text-color', '#111827');
      root.style.setProperty('--text-secondary', '#6B7280');
      document.body.style.backgroundColor = '#F9FAFB';
      document.body.style.color = '#111827';
    }
  };

  const toggleTheme = () => {
    if (settings.darkModeEnabled) {
      setIsDarkMode(!isDarkMode);
    }
  };

  const setDarkMode = (value) => {
    if (settings.darkModeEnabled) {
      setIsDarkMode(Boolean(value));
    }
  };

  const value = {
    isDarkMode,
    settings,
    toggleTheme,
    setDarkMode,
    refreshSettings: fetchSettings
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};