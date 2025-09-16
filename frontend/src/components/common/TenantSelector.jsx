// components/common/TenantSelector.jsx
import React, { useState, useEffect, useRef } from 'react';
import './TenantSelector.css';

const TenantSelector = ({ 
  currentTenant = null, 
  onTenantChange = () => {}, 
  className = '',
  size = 'medium', // 'small', 'medium', 'large'
  showSubdomain = true,
  showLogo = true,
  placement = 'bottom-right' // 'bottom-left', 'bottom-right', 'top-left', 'top-right'
}) => {
  const [tenants, setTenants] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    fetchTenants();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  const handleEscapeKey = (event) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const fetchTenants = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('jcms_token');
      const response = await fetch('/api/tenant-switching/my/tenants', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTenants(data.tenants || []);
      } else {
        throw new Error('Failed to fetch tenants');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTenantSelect = async (tenant) => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('jcms_token');
      const response = await fetch('/api/tenant-switching/switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tenantId: tenant.id })
      });

      if (response.ok) {
        onTenantChange(tenant);
        setIsOpen(false);
      } else {
        throw new Error('Failed to switch tenant');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error switching tenant:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleDropdown = () => {
    if (!loading) {
      setIsOpen(!isOpen);
    }
  };

  const getSizeClasses = () => {
    const sizeMap = {
      small: 'tenant-selector-sm',
      medium: 'tenant-selector-md',
      large: 'tenant-selector-lg'
    };
    return sizeMap[size] || sizeMap.medium;
  };

  const getPlacementClasses = () => {
    const placementMap = {
      'bottom-left': 'dropdown-bottom-left',
      'bottom-right': 'dropdown-bottom-right',
      'top-left': 'dropdown-top-left',
      'top-right': 'dropdown-top-right'
    };
    return placementMap[placement] || placementMap['bottom-right'];
  };

  if (!currentTenant && tenants.length === 0) {
    return null;
  }

  return (
    <div className={`tenant-selector ${getSizeClasses()} ${className}`}>
      <button
        ref={buttonRef}
        className={`tenant-selector-button ${isOpen ? 'active' : ''} ${loading ? 'loading' : ''}`}
        onClick={toggleDropdown}
        disabled={loading}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select tenant"
      >
        <div className="current-tenant">
          {showLogo && currentTenant?.branding?.logo?.url && (
            <img 
              src={currentTenant.branding.logo.url} 
              alt="" 
              className="tenant-logo"
            />
          )}
          <div className="tenant-info">
            <span className="tenant-name">
              {currentTenant?.name || 'Select Tenant'}
            </span>
            {showSubdomain && currentTenant?.subdomain && (
              <span className="tenant-subdomain">
                @{currentTenant.subdomain}
              </span>
            )}
          </div>
        </div>
        
        <div className="selector-arrow">
          {loading ? (
            <div className="spinner-sm"></div>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4 6l4 4 4-4H4z"/>
            </svg>
          )}
        </div>
      </button>

      {isOpen && (
        <div 
          ref={dropdownRef}
          className={`tenant-dropdown ${getPlacementClasses()}`}
          role="listbox"
        >
          {error && (
            <div className="dropdown-error">
              <span>⚠️ {error}</span>
              <button 
                onClick={fetchTenants}
                className="retry-button"
                disabled={loading}
              >
                Retry
              </button>
            </div>
          )}
          
          {tenants.length === 0 && !error && !loading && (
            <div className="dropdown-empty">
              <span>No accessible tenants</span>
            </div>
          )}

          {tenants.length > 0 && (
            <>
              <div className="dropdown-header">
                <span>Switch Tenant ({tenants.length})</span>
              </div>
              
              <div className="dropdown-list">
                {tenants.map((tenant) => (
                  <button
                    key={tenant.id}
                    className={`tenant-option ${tenant.id === currentTenant?.id ? 'current' : ''}`}
                    onClick={() => handleTenantSelect(tenant)}
                    disabled={loading || tenant.id === currentTenant?.id}
                    role="option"
                    aria-selected={tenant.id === currentTenant?.id}
                  >
                    <div className="option-content">
                      {showLogo && tenant.branding?.logo?.url && (
                        <img 
                          src={tenant.branding.logo.url} 
                          alt="" 
                          className="tenant-logo"
                        />
                      )}
                      <div className="tenant-info">
                        <span className="tenant-name">{tenant.name}</span>
                        {showSubdomain && (
                          <span className="tenant-subdomain">
                            @{tenant.subdomain}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {tenant.id === currentTenant?.id && (
                      <div className="current-indicator">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                        </svg>
                      </div>
                    )}
                    
                    {loading && tenant.id !== currentTenant?.id && (
                      <div className="loading-indicator">
                        <div className="spinner-sm"></div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TenantSelector;