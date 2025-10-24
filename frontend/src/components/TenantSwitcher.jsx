// components/TenantSwitcher.jsx
import React, { useState, useEffect, useRef } from 'react';
import { tenantSwitchingApi } from '../api';
import './TenantSwitcher.css';
import TrioLoader from './ui/TrioLoader';

const TenantSwitcher = ({ onTenantChange, currentTenant }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(currentTenant);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchAccessibleTenants();
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setSelectedTenant(currentTenant);
  }, [currentTenant]);

  const fetchAccessibleTenants = async () => {
    try {
      const response = await tenantSwitchingApi.getMyTenants();
      const data = await response.json();
      setTenants(data.tenants);
      
      // If no current tenant is set, set the first available tenant
      if (!selectedTenant && data.tenants.length > 0) {
        setSelectedTenant(data.tenants[0]);
        if (onTenantChange) {
          onTenantChange(data.tenants[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching accessible tenants:', error);
    }
  };

  const switchTenant = async (tenant) => {
    if (tenant.id === selectedTenant?.id) {
      setIsOpen(false);
      return;
    }

    try {
      setLoading(true);
      const response = await tenantSwitchingApi.switchTenant(tenant.id);
      const data = await response.json();
      setSelectedTenant(data.tenant);
      setIsOpen(false);
      
      if (onTenantChange) {
        onTenantChange(data.tenant);
      }
    } catch (error) {
      console.error('Error switching tenant:', error);
    } finally {
      setLoading(false);
    }
  };

  if (tenants.length <= 1) {
    return null; // Don't show switcher if user has access to only one tenant
  }

  return (
    <div className="tenant-switcher" ref={dropdownRef}>
      <button
        className="tenant-switcher-button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
      >
        <div className="current-tenant-info">
          {selectedTenant?.logo?.url && (
            <img 
              src={selectedTenant.logo.url} 
              alt="Tenant logo" 
              className="tenant-logo-small"
            />
          )}
          <div className="tenant-details">
            <span className="tenant-name">
              {selectedTenant?.name || 'Select Tenant'}
            </span>
            {selectedTenant?.subdomain && (
              <span className="tenant-subdomain">
                @{selectedTenant.subdomain}
              </span>
            )}
          </div>
        </div>
        <div className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4.427 6.573L8 10.146l3.573-3.573a.5.5 0 11.708.708l-4 4a.5.5 0 01-.708 0l-4-4a.5.5 0 11.708-.708z"/>
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="tenant-dropdown">
          <div className="dropdown-header">
            <span>Switch Tenant</span>
            {tenants.length > 0 && (
              <span className="tenant-count">{tenants.length} available</span>
            )}
          </div>
          
          <div className="tenant-list">
            {tenants.map((tenant) => (
              <button
                key={tenant.id}
                className={`tenant-option ${selectedTenant?.id === tenant.id ? 'selected' : ''}`}
                onClick={() => switchTenant(tenant)}
                disabled={loading}
              >
                <div className="tenant-option-content">
                  {tenant.logo?.url && (
                    <img 
                      src={tenant.logo.url} 
                      alt="Tenant logo" 
                      className="tenant-logo"
                    />
                  )}
                  {!tenant.logo?.url && (
                    <div 
                      className="tenant-logo-placeholder"
                      style={{
                        backgroundColor: tenant.colors?.primary || '#3b82f6'
                      }}
                    >
                      {tenant.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="tenant-info">
                    <div className="tenant-name-row">
                      <span className="tenant-option-name">{tenant.name}</span>
                      {selectedTenant?.id === tenant.id && (
                        <span className="current-badge">Current</span>
                      )}
                    </div>
                    <span className="tenant-option-subdomain">
                      @{tenant.subdomain}
                    </span>
                  </div>
                </div>
                
                {tenant.colors && (
                  <div className="tenant-colors">
                    <div 
                      className="color-swatch" 
                      style={{ backgroundColor: tenant.colors.primary }}
                    />
                    <div 
                      className="color-swatch" 
                      style={{ backgroundColor: tenant.colors.secondary }}
                    />
                  </div>
                )}
              </button>
            ))}
          </div>
          
          {loading && (
            <div className="dropdown-loading">
              <TrioLoader size="24" color="#3b82f6" />
              <span>Switching tenant...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TenantSwitcher;
