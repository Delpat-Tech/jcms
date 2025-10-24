// components/common/BrandingProvider.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';

const BrandingContext = createContext();

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};

const BrandingProvider = ({ children, tenant = null }) => {
  const [branding, setBranding] = useState(null);
  const [isApplied, setIsApplied] = useState(false);

  useEffect(() => {
    if (tenant?.branding) {
      setBranding(tenant.branding);
      applyBranding(tenant.branding);
      setIsApplied(true);
    } else {
      // Reset to default branding
      resetBranding();
      setIsApplied(false);
    }

    // Cleanup function to reset branding on unmount
    return () => {
      if (isApplied) {
        resetBranding();
      }
    };
  }, [tenant]);

  const applyBranding = (brandingData) => {
    const { colors, typography, theme } = brandingData;
    const root = document.documentElement;
    
    // Store original values for cleanup
    const originalValues = {};
    
    // Apply colors
    if (colors) {
      if (colors.primary) {
        originalValues['--tenant-primary'] = root.style.getPropertyValue('--tenant-primary');
        root.style.setProperty('--tenant-primary', colors.primary);
      }
      if (colors.secondary) {
        originalValues['--tenant-secondary'] = root.style.getPropertyValue('--tenant-secondary');
        root.style.setProperty('--tenant-secondary', colors.secondary);
      }
      if (colors.accent) {
        originalValues['--tenant-accent'] = root.style.getPropertyValue('--tenant-accent');
        root.style.setProperty('--tenant-accent', colors.accent);
      }
      if (colors.background) {
        originalValues['--tenant-background'] = root.style.getPropertyValue('--tenant-background');
        root.style.setProperty('--tenant-background', colors.background);
      }
      if (colors.surface) {
        originalValues['--tenant-surface'] = root.style.getPropertyValue('--tenant-surface');
        root.style.setProperty('--tenant-surface', colors.surface);
      }
      if (colors.text?.primary) {
        originalValues['--tenant-text-primary'] = root.style.getPropertyValue('--tenant-text-primary');
        root.style.setProperty('--tenant-text-primary', colors.text.primary);
      }
      if (colors.text?.secondary) {
        originalValues['--tenant-text-secondary'] = root.style.getPropertyValue('--tenant-text-secondary');
        root.style.setProperty('--tenant-text-secondary', colors.text.secondary);
      }
    }
    
    // Apply typography
    if (typography) {
      if (typography.fontFamily) {
        originalValues['--tenant-font-family'] = root.style.getPropertyValue('--tenant-font-family');
        root.style.setProperty('--tenant-font-family', typography.fontFamily);
      }
      if (typography.fontSize?.small) {
        originalValues['--tenant-font-small'] = root.style.getPropertyValue('--tenant-font-small');
        root.style.setProperty('--tenant-font-small', typography.fontSize.small);
      }
      if (typography.fontSize?.medium) {
        originalValues['--tenant-font-medium'] = root.style.getPropertyValue('--tenant-font-medium');
        root.style.setProperty('--tenant-font-medium', typography.fontSize.medium);
      }
      if (typography.fontSize?.large) {
        originalValues['--tenant-font-large'] = root.style.getPropertyValue('--tenant-font-large');
        root.style.setProperty('--tenant-font-large', typography.fontSize.large);
      }
    }
    
    // Apply theme
    if (theme) {
      if (theme.borderRadius) {
        originalValues['--tenant-border-radius'] = root.style.getPropertyValue('--tenant-border-radius');
        root.style.setProperty('--tenant-border-radius', theme.borderRadius);
      }
      if (theme.shadowIntensity) {
        const shadowMap = {
          'none': 'none',
          'light': '0 1px 3px rgba(0, 0, 0, 0.1)',
          'medium': '0 4px 6px rgba(0, 0, 0, 0.1)',
          'strong': '0 10px 15px rgba(0, 0, 0, 0.1)'
        };
        originalValues['--tenant-shadow'] = root.style.getPropertyValue('--tenant-shadow');
        root.style.setProperty('--tenant-shadow', shadowMap[theme.shadowIntensity] || shadowMap.medium);
      }
    }

    // Update favicon if available
    if (brandingData.favicon?.url) {
      updateFavicon(brandingData.favicon.url);
    }
    
    // Store original values for cleanup
    root._originalBrandingValues = originalValues;
  };

  const resetBranding = () => {
    const root = document.documentElement;
    const originalValues = root._originalBrandingValues || {};
    
    // Reset to original values or remove custom properties
    Object.keys(originalValues).forEach(property => {
      if (originalValues[property]) {
        root.style.setProperty(property, originalValues[property]);
      } else {
        root.style.removeProperty(property);
      }
    });
    
    // Reset favicon to default
    updateFavicon('/favicon.ico');
    
    // Clean up stored values
    delete root._originalBrandingValues;
  };

  const updateFavicon = (faviconUrl) => {
    let favicon = document.querySelector('link[rel="icon"]');
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = faviconUrl;
  };

  const getBrandingValue = (path, defaultValue = null) => {
    if (!branding) return defaultValue;
    
    const keys = path.split('.');
    let value = branding;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return defaultValue;
      }
    }
    
    return value || defaultValue;
  };

  const getBrandingCSS = () => {
    if (!branding) return {};
    
    const styles = {};
    const { colors, typography, theme } = branding;
    
    // Build CSS object from branding
    if (colors?.primary) styles['--tenant-primary'] = colors.primary;
    if (colors?.secondary) styles['--tenant-secondary'] = colors.secondary;
    if (colors?.accent) styles['--tenant-accent'] = colors.accent;
    if (colors?.background) styles['--tenant-background'] = colors.background;
    if (colors?.surface) styles['--tenant-surface'] = colors.surface;
    if (colors?.text?.primary) styles['--tenant-text-primary'] = colors.text.primary;
    if (colors?.text?.secondary) styles['--tenant-text-secondary'] = colors.text.secondary;
    
    if (typography?.fontFamily) styles['--tenant-font-family'] = typography.fontFamily;
    if (typography?.fontSize?.small) styles['--tenant-font-small'] = typography.fontSize.small;
    if (typography?.fontSize?.medium) styles['--tenant-font-medium'] = typography.fontSize.medium;
    if (typography?.fontSize?.large) styles['--tenant-font-large'] = typography.fontSize.large;
    
    if (theme?.borderRadius) styles['--tenant-border-radius'] = theme.borderRadius;
    if (theme?.shadowIntensity) {
      const shadowMap = {
        'none': 'none',
        'light': '0 1px 3px rgba(0, 0, 0, 0.1)',
        'medium': '0 4px 6px rgba(0, 0, 0, 0.1)',
        'strong': '0 10px 15px rgba(0, 0, 0, 0.1)'
      };
      styles['--tenant-shadow'] = shadowMap[theme.shadowIntensity] || shadowMap.medium;
    }
    
    return styles;
  };

  const contextValue = {
    branding,
    isApplied,
    getBrandingValue,
    getBrandingCSS,
    applyBranding,
    resetBranding
  };

  return (
    <BrandingContext.Provider value={contextValue}>
      {children}
    </BrandingContext.Provider>
  );
};

export default BrandingProvider;
