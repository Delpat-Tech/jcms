import React, { createContext, useContext, useState, useEffect } from 'react';
import { settingsApi } from '../api';

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
    darkModeEnabled: true
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
      
      const response = await settingsApi.get();
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

    root.classList.toggle('dark', isDarkMode);

    if (isDarkMode) {
      root.style.setProperty('--primary-color', settings.darkModePrimaryColor);
      root.style.setProperty('--secondary-color', settings.darkModeSecondaryColor);
      root.style.setProperty('--bg-color', '#000000');
      root.style.setProperty('--surface-color', '#1C1C1E');
      root.style.setProperty('--card-bg', '#2C2C2E');
      root.style.setProperty('--border-color', '#38383A');
      root.style.setProperty('--muted-bg', '#1C1C1E');
      root.style.setProperty('--muted-bg-2', '#2C2C2E');
      root.style.setProperty('--text-color', '#FFFFFF');
      root.style.setProperty('--text-secondary', '#EBEBF5');
      root.style.setProperty('--text-tertiary', '#EBEBF599');
      document.body.style.backgroundColor = '#000000';
      document.body.style.color = '#FFFFFF';
      document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
      injectDarkOverrides();
    } else {
      root.style.setProperty('--primary-color', settings.primaryColor);
      root.style.setProperty('--secondary-color', settings.secondaryColor);
      root.style.setProperty('--bg-color', '#F2F2F7');
      root.style.setProperty('--surface-color', '#FFFFFF');
      root.style.setProperty('--card-bg', '#FFFFFF');
      root.style.setProperty('--border-color', '#E5E5EA');
      root.style.setProperty('--muted-bg', '#F2F2F7');
      root.style.setProperty('--muted-bg-2', '#FFFFFF');
      root.style.setProperty('--text-color', '#000000');
      root.style.setProperty('--text-secondary', '#3C3C43');
      root.style.setProperty('--text-tertiary', '#3C3C4399');
      document.body.style.backgroundColor = '#F2F2F7';
      document.body.style.color = '#000000';
      document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
      removeDarkOverrides();
    }
  };

  // Ensure common Tailwind utility colors map to theme vars in dark mode
  const injectDarkOverrides = () => {
    const styleId = 'dark-theme-overrides';
    let styleTag = document.getElementById(styleId);
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }
    styleTag.textContent = `
      * { transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease; }
      .dark .bg-white { background-color: var(--card-bg) !important; }
      .dark .bg-gray-50 { background-color: var(--bg-color) !important; }
      .dark .bg-gray-100 { background-color: var(--surface-color) !important; }
      .dark .bg-gray-200 { background-color: var(--muted-bg-2) !important; }
      .dark .text-gray-900 { color: var(--text-color) !important; }
      .dark .text-gray-800 { color: var(--text-color) !important; }
      .dark .text-gray-700 { color: var(--text-secondary) !important; }
      .dark .text-gray-600 { color: var(--text-secondary) !important; }
      .dark .text-gray-500 { color: var(--text-tertiary) !important; }
      .dark .text-gray-400 { color: var(--text-tertiary) !important; }
      .dark .border-gray-200 { border-color: var(--border-color) !important; }
      .dark .border-gray-300 { border-color: var(--border-color) !important; }
      .dark .border { border-color: var(--border-color) !important; }
      .dark .shadow, .dark .shadow-sm { box-shadow: 0 1px 2px 0 rgba(255,255,255,0.05) !important; }
      .dark .shadow-md { box-shadow: 0 4px 6px -1px rgba(255,255,255,0.05), 0 2px 4px -2px rgba(255,255,255,0.03) !important; }
      .dark .shadow-lg { box-shadow: 0 10px 15px -3px rgba(255,255,255,0.05), 0 4px 6px -4px rgba(255,255,255,0.03) !important; }
      .dark .ring-1, .dark .ring-2 { --tw-ring-color: var(--border-color) !important; }
      .dark input, .dark select, .dark textarea { 
        background-color: var(--surface-color) !important; 
        color: var(--text-color) !important; 
        border-color: var(--border-color) !important; 
      }
      .dark input::placeholder, .dark textarea::placeholder { color: var(--text-tertiary) !important; }
      .dark .hover\:bg-gray-50:hover { background-color: var(--surface-color) !important; }
      .dark .hover\:bg-gray-100:hover { background-color: var(--muted-bg-2) !important; }
      .dark ::-webkit-scrollbar { width: 12px; height: 12px; }
      .dark ::-webkit-scrollbar-track { background: var(--bg-color); }
      .dark ::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 6px; }
      .dark ::-webkit-scrollbar-thumb:hover { background: #48484A; }
      .dark * { scrollbar-width: thin; scrollbar-color: var(--border-color) var(--bg-color); }
    `;
  };

  const removeDarkOverrides = () => {
    const styleTag = document.getElementById('dark-theme-overrides');
    if (styleTag) {
      styleTag.textContent = '';
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const setDarkMode = (value) => {
    setIsDarkMode(Boolean(value));
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
