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
    const useDark = isDarkMode && settings.darkModeEnabled;

    // Toggle a 'dark' class for frameworks/utilities that use it
    root.classList.toggle('dark', useDark);

    if (useDark) {
      root.style.setProperty('--primary-color', settings.darkModePrimaryColor);
      root.style.setProperty('--secondary-color', settings.darkModeSecondaryColor);
      root.style.setProperty('--bg-color', '#0B1220');
      root.style.setProperty('--surface-color', settings.darkModePrimaryColor || '#111827');
      root.style.setProperty('--card-bg', settings.darkModePrimaryColor || '#111827');
      root.style.setProperty('--border-color', '#1F2937');
      root.style.setProperty('--muted-bg', '#0F172A');
      root.style.setProperty('--muted-bg-2', '#111827');
      root.style.setProperty('--text-color', '#F9FAFB');
      root.style.setProperty('--text-secondary', '#D1D5DB');
      document.body.style.backgroundColor = '#111827';
      document.body.style.color = '#F9FAFB';
      injectDarkOverrides();
    } else {
      root.style.setProperty('--primary-color', settings.primaryColor);
      root.style.setProperty('--secondary-color', settings.secondaryColor);
      root.style.setProperty('--bg-color', '#F9FAFB');
      root.style.setProperty('--surface-color', '#FFFFFF');
      root.style.setProperty('--card-bg', '#FFFFFF');
      root.style.setProperty('--border-color', '#E5E7EB');
      root.style.setProperty('--muted-bg', '#F3F4F6');
      root.style.setProperty('--muted-bg-2', '#F9FAFB');
      root.style.setProperty('--text-color', '#111827');
      root.style.setProperty('--text-secondary', '#6B7280');
      document.body.style.backgroundColor = '#F9FAFB';
      document.body.style.color = '#111827';
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
      .dark .bg-white { background-color: var(--card-bg) !important; }
      .dark .bg-gray-50 { background-color: var(--muted-bg-2) !important; }
      .dark .bg-gray-100 { background-color: var(--muted-bg) !important; }
      .dark .text-gray-900 { color: var(--text-color) !important; }
      .dark .text-gray-800 { color: var(--text-color) !important; }
      .dark .text-gray-700 { color: var(--text-secondary) !important; }
      .dark .text-gray-600 { color: var(--text-secondary) !important; }
      .dark .text-gray-500 { color: var(--text-secondary) !important; }
      .dark .border-gray-200 { border-color: var(--border-color) !important; }
      .dark .border-gray-300 { border-color: var(--border-color) !important; }
      .dark .shadow, .dark .shadow-sm, .dark .shadow-md { box-shadow: 0 1px 3px 0 rgba(0,0,0,0.5), 0 1px 2px -1px rgba(0,0,0,0.4) !important; }
      .dark .ring-1, .dark .ring-2 { --tw-ring-color: var(--border-color) !important; }
      .dark input, .dark select, .dark textarea { background-color: var(--muted-bg) !important; color: var(--text-color) !important; border-color: var(--border-color) !important; }
      .dark .hover\:bg-gray-50:hover { background-color: var(--muted-bg) !important; }
    `;
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