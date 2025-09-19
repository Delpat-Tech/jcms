import React, { useState, useEffect } from 'react';
import SuperAdminLayout from '../layout.tsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import FormField from '../../components/ui/FormField.jsx';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { settingsApi } from '../../api';

export default function SettingsPage() {
  const { refreshSettings, isDarkMode, setDarkMode } = useTheme();
  const [settings, setSettings] = useState({
    siteTitle: '',
    siteTagline: '',
    siteDescription: '',
    defaultLanguage: 'en',
    timezone: 'UTC',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h',
    logo: '',
    favicon: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#6B7280',
    multiSiteEnabled: true,
    subdomainSupport: true,
    darkModeEnabled: false,
    darkModePrimaryColor: '#1F2937',
    darkModeSecondaryColor: '#374151'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await settingsApi.getSuperadmin();
      const data = await response.json();
      if (data.success) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const response = await settingsApi.updateSuperadmin(settings);
      const data = await response.json();
      if (data.success) {
        setMessage('Settings saved successfully!');
        refreshSettings(); // Refresh theme settings
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Error saving settings: ' + data.message);
      }
    } catch (error) {
      setMessage('Error saving settings: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <SuperAdminLayout title="System Settings">
        <div className="p-8 text-center">Loading settings...</div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout title="System Settings">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">System Settings</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Quick theme</span>
            <button
              type="button"
              onClick={() => setDarkMode(false)}
              className={`px-3 py-1.5 text-sm rounded-md border ${!isDarkMode ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Light
            </button>
            <button
              type="button"
              onClick={() => setDarkMode(true)}
              className={`px-3 py-1.5 text-sm rounded-md border ${isDarkMode ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Dark
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Settings */}
          <div className="bg-white p-6 rounded-lg shadow" style={{ backgroundColor: 'var(--surface-color)', color: 'var(--text-color)' }}>
            <h2 className="text-lg font-semibold mb-4">General Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Site Title" htmlFor="siteTitle">
                <Input
                  id="siteTitle"
                  value={settings.siteTitle}
                  onChange={(e) => handleChange('siteTitle', e.target.value)}
                  placeholder="Enter site title"
                />
              </FormField>
              <FormField label="Site Tagline" htmlFor="siteTagline">
                <Input
                  id="siteTagline"
                  value={settings.siteTagline}
                  onChange={(e) => handleChange('siteTagline', e.target.value)}
                  placeholder="Enter site tagline"
                />
              </FormField>
            </div>
            <FormField label="Site Description" htmlFor="siteDescription">
              <textarea
                id="siteDescription"
                value={settings.siteDescription}
                onChange={(e) => handleChange('siteDescription', e.target.value)}
                placeholder="Enter site description"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </FormField>
          </div>

          {/* Localization Settings */}
          <div className="bg-white p-6 rounded-lg shadow" style={{ backgroundColor: 'var(--surface-color)', color: 'var(--text-color)' }}>
            <h2 className="text-lg font-semibold mb-4">Localization</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Default Language" htmlFor="defaultLanguage">
                <select
                  id="defaultLanguage"
                  value={settings.defaultLanguage}
                  onChange={(e) => handleChange('defaultLanguage', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                </select>
              </FormField>
              <FormField label="Timezone" htmlFor="timezone">
                <select
                  id="timezone"
                  value={settings.timezone}
                  onChange={(e) => handleChange('timezone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                </select>
              </FormField>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <FormField label="Date Format" htmlFor="dateFormat">
                <select
                  id="dateFormat"
                  value={settings.dateFormat}
                  onChange={(e) => handleChange('dateFormat', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="DD-MM-YYYY">DD-MM-YYYY</option>
                </select>
              </FormField>
              <FormField label="Time Format" htmlFor="timeFormat">
                <select
                  id="timeFormat"
                  value={settings.timeFormat}
                  onChange={(e) => handleChange('timeFormat', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="24h">24 Hour</option>
                  <option value="12h">12 Hour</option>
                </select>
              </FormField>
            </div>
          </div>

          {/* Branding Settings */}
          <div className="bg-white p-6 rounded-lg shadow" style={{ backgroundColor: 'var(--surface-color)', color: 'var(--text-color)' }}>
            <h2 className="text-lg font-semibold mb-4">Branding</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Logo URL" htmlFor="logo">
                <Input
                  id="logo"
                  value={settings.logo}
                  onChange={(e) => handleChange('logo', e.target.value)}
                  placeholder="Enter logo URL"
                />
              </FormField>
              <FormField label="Favicon URL" htmlFor="favicon">
                <Input
                  id="favicon"
                  value={settings.favicon}
                  onChange={(e) => handleChange('favicon', e.target.value)}
                  placeholder="Enter favicon URL"
                />
              </FormField>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <FormField label="Primary Color" htmlFor="primaryColor">
                <div className="flex gap-2">
                  <input
                    type="color"
                    id="primaryColor"
                    value={settings.primaryColor}
                    onChange={(e) => handleChange('primaryColor', e.target.value)}
                    className="w-12 h-10 border border-gray-300 rounded"
                  />
                  <Input
                    value={settings.primaryColor}
                    onChange={(e) => handleChange('primaryColor', e.target.value)}
                    placeholder="#3B82F6"
                  />
                </div>
              </FormField>
              <FormField label="Secondary Color" htmlFor="secondaryColor">
                <div className="flex gap-2">
                  <input
                    type="color"
                    id="secondaryColor"
                    value={settings.secondaryColor}
                    onChange={(e) => handleChange('secondaryColor', e.target.value)}
                    className="w-12 h-10 border border-gray-300 rounded"
                  />
                  <Input
                    value={settings.secondaryColor}
                    onChange={(e) => handleChange('secondaryColor', e.target.value)}
                    placeholder="#6B7280"
                  />
                </div>
              </FormField>
            </div>
          </div>

          {/* Dark Mode Settings */}
          <div className="bg-white p-6 rounded-lg shadow" style={{ backgroundColor: 'var(--surface-color)', color: 'var(--text-color)' }}>
            <h2 className="text-lg font-semibold mb-4">Dark Mode</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="darkModeEnabled"
                  checked={settings.darkModeEnabled}
                  onChange={(e) => handleChange('darkModeEnabled', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="darkModeEnabled" className="ml-2 text-sm font-medium text-gray-700">
                  Enable Dark Mode Support
                </label>
              </div>
              {settings.darkModeEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pl-6">
                  <FormField label="Dark Mode Primary Color" htmlFor="darkModePrimaryColor">
                    <div className="flex gap-2">
                      <input
                        type="color"
                        id="darkModePrimaryColor"
                        value={settings.darkModePrimaryColor}
                        onChange={(e) => handleChange('darkModePrimaryColor', e.target.value)}
                        className="w-12 h-10 border border-gray-300 rounded"
                      />
                      <Input
                        value={settings.darkModePrimaryColor}
                        onChange={(e) => handleChange('darkModePrimaryColor', e.target.value)}
                        placeholder="#1F2937"
                      />
                    </div>
                  </FormField>
                  <FormField label="Dark Mode Secondary Color" htmlFor="darkModeSecondaryColor">
                    <div className="flex gap-2">
                      <input
                        type="color"
                        id="darkModeSecondaryColor"
                        value={settings.darkModeSecondaryColor}
                        onChange={(e) => handleChange('darkModeSecondaryColor', e.target.value)}
                        className="w-12 h-10 border border-gray-300 rounded"
                      />
                      <Input
                        value={settings.darkModeSecondaryColor}
                        onChange={(e) => handleChange('darkModeSecondaryColor', e.target.value)}
                        placeholder="#374151"
                      />
                    </div>
                  </FormField>
                </div>
              )}
            </div>
          </div>

          {/* Multi-site Settings */}
          <div className="bg-white p-6 rounded-lg shadow" style={{ backgroundColor: 'var(--surface-color)', color: 'var(--text-color)' }}>
            <h2 className="text-lg font-semibold mb-4">Multi-site Support</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="multiSiteEnabled"
                  checked={settings.multiSiteEnabled}
                  onChange={(e) => handleChange('multiSiteEnabled', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="multiSiteEnabled" className="ml-2 text-sm font-medium text-gray-700">
                  Enable Multi-site Support
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="subdomainSupport"
                  checked={settings.subdomainSupport}
                  onChange={(e) => handleChange('subdomainSupport', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="subdomainSupport" className="ml-2 text-sm font-medium text-gray-700">
                  Enable Subdomain Support
                </label>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>

          {/* Success/Error Message */}
          {message && (
            <div className={`p-4 rounded-md ${
              message.includes('successfully') 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message}
            </div>
          )}
        </form>
      </div>
    </SuperAdminLayout>
  );
}
