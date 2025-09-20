// components/TenantBranding.jsx
import React, { useState, useEffect } from 'react';
import { tenantBrandingApi, tenantApi } from '../api';
import './TenantBranding.css';
import TrioLoader from './ui/TrioLoader';

const TenantBranding = ({ tenantId, onBrandingChange }) => {
  const [branding, setBranding] = useState({
    colors: {
      primary: '#3b82f6',
      secondary: '#64748b',
      accent: '#10b981',
      background: '#ffffff',
      surface: '#f8fafc',
      text: {
        primary: '#1e293b',
        secondary: '#64748b'
      }
    },
    typography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: {
        small: '14px',
        medium: '16px',
        large: '18px'
      }
    },
    theme: {
      mode: 'light',
      borderRadius: '8px',
      shadowIntensity: 'medium'
    },
    customCSS: '',
    companyInfo: {
      tagline: '',
      website: '',
      supportEmail: '',
      phone: ''
    },
    logo: null,
    favicon: null
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('colors');

  useEffect(() => {
    if (tenantId) {
      fetchBranding();
    }
  }, [tenantId]);

  const fetchBranding = async () => {
    try {
      const response = await tenantBrandingApi.get(tenantId);
      const data = await response.json();
      setBranding(data.tenant.branding);
      if (onBrandingChange) {
        onBrandingChange(data.tenant.branding);
      }
    } catch (error) {
      console.error('Error fetching branding:', error);
    }
  };

  const updateBranding = async (updates) => {
    try {
      setLoading(true);
      const response = await tenantBrandingApi.update(tenantId, updates);
      const data = await response.json();
      setBranding(data.tenant.branding);
      setMessage('Branding updated successfully!');
      
      if (onBrandingChange) {
        onBrandingChange(data.tenant.branding);
      }
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error updating branding: ' + error.message);
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const uploadLogo = async (file) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('logo', file);
      const response = await tenantApi.uploadLogo(tenantId, formData);
      const data = await response.json();
      setBranding(prev => ({
        ...prev,
        logo: data.logo
      }));
      setMessage('Logo uploaded successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error uploading logo: ' + error.message);
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleColorChange = (colorKey, value) => {
    const newColors = { ...branding.colors };
    if (colorKey.includes('.')) {
      const [parent, child] = colorKey.split('.');
      newColors[parent] = { ...newColors[parent], [child]: value };
    } else {
      newColors[colorKey] = value;
    }
    
    setBranding(prev => ({ ...prev, colors: newColors }));
    updateBranding({ colors: newColors });
  };

  const handleTypographyChange = (key, value) => {
    const newTypography = { ...branding.typography };
    if (key.includes('.')) {
      const [parent, child] = key.split('.');
      newTypography[parent] = { ...newTypography[parent], [child]: value };
    } else {
      newTypography[key] = value;
    }
    
    setBranding(prev => ({ ...prev, typography: newTypography }));
    updateBranding({ typography: newTypography });
  };

  const handleThemeChange = (key, value) => {
    const newTheme = { ...branding.theme, [key]: value };
    setBranding(prev => ({ ...prev, theme: newTheme }));
    updateBranding({ theme: newTheme });
  };

  const resetBranding = async () => {
    if (window.confirm('Are you sure you want to reset all branding to defaults? This cannot be undone.')) {
      try {
        setLoading(true);
        const response = await tenantBrandingApi.reset(tenantId);
        const data = await response.json();
        setBranding(data.tenant.branding);
        setMessage('Branding reset to defaults successfully!');
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        setMessage('Error resetting branding: ' + error.message);
        setTimeout(() => setMessage(''), 3000);
      } finally {
        setLoading(false);
      }
    }
  };

  const ColorPicker = ({ label, value, onChange, className = '' }) => (
    <div className={`color-picker ${className}`}>
      <label>{label}</label>
      <div className="color-input-wrapper">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="color-input"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="color-text-input"
          placeholder="#000000"
        />
      </div>
    </div>
  );

  const Preview = () => (
    <div className="branding-preview" style={{
      '--primary': branding.colors.primary,
      '--secondary': branding.colors.secondary,
      '--accent': branding.colors.accent,
      '--background': branding.colors.background,
      '--surface': branding.colors.surface,
      '--text-primary': branding.colors.text.primary,
      '--text-secondary': branding.colors.text.secondary,
      '--font-family': branding.typography.fontFamily,
      '--border-radius': branding.theme.borderRadius
    }}>
      <div className="preview-header">
        {branding.logo?.url && (
          <img src={branding.logo.url} alt="Logo" className="preview-logo" />
        )}
        <h3 style={{ color: 'var(--primary)' }}>Company Dashboard</h3>
      </div>
      <div className="preview-content">
        <div className="preview-card">
          <h4>Welcome Back!</h4>
          <p>This is how your branding will look in the application.</p>
          <button className="preview-button" style={{ 
            backgroundColor: 'var(--primary)',
            borderRadius: 'var(--border-radius)'
          }}>
            Primary Button
          </button>
          <button className="preview-button secondary" style={{
            backgroundColor: 'var(--accent)',
            borderRadius: 'var(--border-radius)'
          }}>
            Accent Button
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="tenant-branding">
      {message && (
        <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="branding-header">
        <h2>Tenant Branding</h2>
        <div className="branding-actions">
          <button onClick={resetBranding} className="btn btn-danger" disabled={loading}>
            Reset to Defaults
          </button>
        </div>
      </div>

      <div className="branding-tabs">
        <button 
          className={`tab ${activeTab === 'colors' ? 'active' : ''}`}
          onClick={() => setActiveTab('colors')}
        >
          Colors
        </button>
        <button 
          className={`tab ${activeTab === 'typography' ? 'active' : ''}`}
          onClick={() => setActiveTab('typography')}
        >
          Typography
        </button>
        <button 
          className={`tab ${activeTab === 'theme' ? 'active' : ''}`}
          onClick={() => setActiveTab('theme')}
        >
          Theme
        </button>
        <button 
          className={`tab ${activeTab === 'assets' ? 'active' : ''}`}
          onClick={() => setActiveTab('assets')}
        >
          Assets
        </button>
        <button 
          className={`tab ${activeTab === 'preview' ? 'active' : ''}`}
          onClick={() => setActiveTab('preview')}
        >
          Preview
        </button>
      </div>

      <div className="branding-content">
        {activeTab === 'colors' && (
          <div className="colors-tab">
            <h3>Color Palette</h3>
            <div className="color-grid">
              <ColorPicker
                label="Primary Color"
                value={branding.colors.primary}
                onChange={(value) => handleColorChange('primary', value)}
              />
              <ColorPicker
                label="Secondary Color"
                value={branding.colors.secondary}
                onChange={(value) => handleColorChange('secondary', value)}
              />
              <ColorPicker
                label="Accent Color"
                value={branding.colors.accent}
                onChange={(value) => handleColorChange('accent', value)}
              />
              <ColorPicker
                label="Background"
                value={branding.colors.background}
                onChange={(value) => handleColorChange('background', value)}
              />
              <ColorPicker
                label="Surface"
                value={branding.colors.surface}
                onChange={(value) => handleColorChange('surface', value)}
              />
              <ColorPicker
                label="Primary Text"
                value={branding.colors.text.primary}
                onChange={(value) => handleColorChange('text.primary', value)}
              />
              <ColorPicker
                label="Secondary Text"
                value={branding.colors.text.secondary}
                onChange={(value) => handleColorChange('text.secondary', value)}
              />
            </div>
          </div>
        )}

        {activeTab === 'typography' && (
          <div className="typography-tab">
            <h3>Typography</h3>
            <div className="typography-controls">
              <div className="form-group">
                <label>Font Family</label>
                <select 
                  value={branding.typography.fontFamily}
                  onChange={(e) => handleTypographyChange('fontFamily', e.target.value)}
                >
                  <option value="Inter, system-ui, sans-serif">Inter</option>
                  <option value="Roboto, sans-serif">Roboto</option>
                  <option value="Open Sans, sans-serif">Open Sans</option>
                  <option value="Lato, sans-serif">Lato</option>
                  <option value="Montserrat, sans-serif">Montserrat</option>
                  <option value="Poppins, sans-serif">Poppins</option>
                </select>
              </div>
              <div className="font-size-controls">
                <div className="form-group">
                  <label>Small Text</label>
                  <input
                    type="text"
                    value={branding.typography.fontSize.small}
                    onChange={(e) => handleTypographyChange('fontSize.small', e.target.value)}
                    placeholder="14px"
                  />
                </div>
                <div className="form-group">
                  <label>Medium Text</label>
                  <input
                    type="text"
                    value={branding.typography.fontSize.medium}
                    onChange={(e) => handleTypographyChange('fontSize.medium', e.target.value)}
                    placeholder="16px"
                  />
                </div>
                <div className="form-group">
                  <label>Large Text</label>
                  <input
                    type="text"
                    value={branding.typography.fontSize.large}
                    onChange={(e) => handleTypographyChange('fontSize.large', e.target.value)}
                    placeholder="18px"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'theme' && (
          <div className="theme-tab">
            <h3>Theme Settings</h3>
            <div className="theme-controls">
              <div className="form-group">
                <label>Theme Mode</label>
                <select 
                  value={branding.theme.mode}
                  onChange={(e) => handleThemeChange('mode', e.target.value)}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
              <div className="form-group">
                <label>Border Radius</label>
                <input
                  type="text"
                  value={branding.theme.borderRadius}
                  onChange={(e) => handleThemeChange('borderRadius', e.target.value)}
                  placeholder="8px"
                />
              </div>
              <div className="form-group">
                <label>Shadow Intensity</label>
                <select 
                  value={branding.theme.shadowIntensity}
                  onChange={(e) => handleThemeChange('shadowIntensity', e.target.value)}
                >
                  <option value="none">None</option>
                  <option value="light">Light</option>
                  <option value="medium">Medium</option>
                  <option value="strong">Strong</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'assets' && (
          <div className="assets-tab">
            <h3>Branding Assets</h3>
            <div className="asset-uploads">
              <div className="asset-upload">
                <label>Company Logo</label>
                {branding.logo?.url && (
                  <div className="current-asset">
                    <img src={branding.logo.url} alt="Current logo" className="asset-preview" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files[0]) {
                      uploadLogo(e.target.files[0]);
                    }
                  }}
                  className="file-input"
                />
                <small>Recommended: PNG or SVG format, max 5MB</small>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preview' && <Preview />}
      </div>

      {loading && (
        <div className="loading-overlay">
          <TrioLoader size="40" color="#3b82f6" />
        </div>
      )}
    </div>
  );
};

export default TenantBranding;