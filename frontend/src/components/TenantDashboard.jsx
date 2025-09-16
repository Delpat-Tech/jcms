// components/TenantDashboard.jsx
import React, { useState, useEffect } from 'react';
import TenantSwitcher from './TenantSwitcher';
import './TenantDashboard.css';

const TenantDashboard = () => {
  const [currentTenant, setCurrentTenant] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState('7d');

  useEffect(() => {
    fetchCurrentContext();
  }, []);

  useEffect(() => {
    if (currentTenant) {
      fetchDashboardData();
      applyTenantBranding();
    }
  }, [currentTenant, timeframe]);

  const fetchCurrentContext = async () => {
    try {
      const token = localStorage.getItem('jcms_token');
      const response = await fetch('/api/tenant-switching/my/context', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.tenant) {
          setCurrentTenant(data.tenant);
        }
      }
    } catch (error) {
      console.error('Error fetching current context:', error);
    }
  };

  const fetchDashboardData = async () => {
    if (!currentTenant) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('jcms_token');
      
      const response = await fetch(`/api/tenant-analytics/${currentTenant.id}/dashboard?timeframe=${timeframe}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data.dashboard);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyTenantBranding = () => {
    if (!currentTenant?.branding) return;

    const { colors, typography, theme } = currentTenant.branding;
    
    // Apply CSS variables to document root
    const root = document.documentElement;
    
    // Colors
    root.style.setProperty('--tenant-primary', colors?.primary || '#3b82f6');
    root.style.setProperty('--tenant-secondary', colors?.secondary || '#64748b');
    root.style.setProperty('--tenant-accent', colors?.accent || '#10b981');
    root.style.setProperty('--tenant-background', colors?.background || '#ffffff');
    root.style.setProperty('--tenant-surface', colors?.surface || '#f8fafc');
    root.style.setProperty('--tenant-text-primary', colors?.text?.primary || '#1e293b');
    root.style.setProperty('--tenant-text-secondary', colors?.text?.secondary || '#64748b');
    
    // Typography
    root.style.setProperty('--tenant-font-family', typography?.fontFamily || 'Inter, system-ui, sans-serif');
    root.style.setProperty('--tenant-font-small', typography?.fontSize?.small || '14px');
    root.style.setProperty('--tenant-font-medium', typography?.fontSize?.medium || '16px');
    root.style.setProperty('--tenant-font-large', typography?.fontSize?.large || '18px');
    
    // Theme
    root.style.setProperty('--tenant-border-radius', theme?.borderRadius || '8px');
    
    const shadowMap = {
      'none': 'none',
      'light': '0 1px 3px rgba(0, 0, 0, 0.1)',
      'medium': '0 4px 6px rgba(0, 0, 0, 0.1)',
      'strong': '0 10px 15px rgba(0, 0, 0, 0.1)'
    };
    root.style.setProperty('--tenant-shadow', shadowMap[theme?.shadowIntensity] || shadowMap.medium);

    // Update favicon if available
    if (currentTenant.branding.favicon?.url) {
      updateFavicon(currentTenant.branding.favicon.url);
    }

    // Update page title
    document.title = `${currentTenant.name} - Dashboard`;
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

  const handleTenantChange = (tenant) => {
    setCurrentTenant(tenant);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (!currentTenant) {
    return (
      <div className="tenant-dashboard loading-state">
        <div className="loading-content">
          <div className="spinner"></div>
          <p>Loading tenant context...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tenant-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="tenant-info">
            {currentTenant.branding?.logo?.url && (
              <img 
                src={currentTenant.branding.logo.url} 
                alt={currentTenant.name} 
                className="tenant-logo-header"
              />
            )}
            <div className="tenant-title">
              <h1>{currentTenant.name}</h1>
              <span className="tenant-subdomain">@{currentTenant.subdomain}</span>
            </div>
          </div>
          
          <div className="header-actions">
            <div className="timeframe-selector">
              <label>Period:</label>
              <select 
                value={timeframe} 
                onChange={(e) => setTimeframe(e.target.value)}
                className="timeframe-select"
              >
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </div>
            <TenantSwitcher 
              currentTenant={currentTenant} 
              onTenantChange={handleTenantChange} 
            />
          </div>
        </div>
      </header>

      <main className="dashboard-content">
        {loading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
          </div>
        )}

        {dashboardData && (
          <>
            {/* Overview Stats */}
            <section className="stats-overview">
              <div className="stat-card users">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <h3>Users</h3>
                  <div className="stat-number">{formatNumber(dashboardData.overview.totalUsers)}</div>
                  <div className="stat-detail">
                    {dashboardData.overview.activeUsers} active
                  </div>
                </div>
              </div>

              <div className="stat-card resources">
                <div className="stat-icon">📁</div>
                <div className="stat-content">
                  <h3>Resources</h3>
                  <div className="stat-number">{formatNumber(dashboardData.overview.totalResources)}</div>
                  <div className="stat-detail">
                    {dashboardData.overview.totalImages} images, {dashboardData.overview.totalFiles} files
                  </div>
                </div>
              </div>

              <div className="stat-card storage">
                <div className="stat-icon">💾</div>
                <div className="stat-content">
                  <h3>Storage</h3>
                  <div className="stat-number">{dashboardData.storage.usagePercentage.toFixed(1)}%</div>
                  <div className="stat-detail">
                    {formatBytes(dashboardData.storage.used)} used
                  </div>
                </div>
              </div>

              <div className="stat-card activity">
                <div className="stat-icon">⚡</div>
                <div className="stat-content">
                  <h3>New Activity</h3>
                  <div className="stat-number">
                    {formatNumber(dashboardData.activity.newImages + dashboardData.activity.newFiles)}
                  </div>
                  <div className="stat-detail">
                    This {timeframe === '24h' ? 'day' : 'period'}
                  </div>
                </div>
              </div>
            </section>

            {/* Storage Usage */}
            {dashboardData.storage && (
              <section className="storage-section">
                <div className="section-header">
                  <h2>Storage Usage</h2>
                </div>
                <div className="storage-card">
                  <div className="storage-bar">
                    <div 
                      className="storage-used" 
                      style={{ 
                        width: `${Math.min(dashboardData.storage.usagePercentage, 100)}%`,
                        backgroundColor: dashboardData.storage.isOverQuota ? '#ef4444' : 'var(--tenant-primary)'
                      }}
                    ></div>
                  </div>
                  <div className="storage-details">
                    <div className="storage-info">
                      <span className="storage-used-text">
                        {formatBytes(dashboardData.storage.used)} used
                      </span>
                      <span className="storage-total-text">
                        of {dashboardData.storage.maxAllowed}
                      </span>
                    </div>
                    {dashboardData.storage.isOverQuota && (
                      <div className="storage-warning">
                        ⚠️ Storage quota exceeded
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Recent Activity */}
            {dashboardData.activity?.dailyActivity?.length > 0 && (
              <section className="activity-section">
                <div className="section-header">
                  <h2>Daily Activity</h2>
                </div>
                <div className="activity-chart">
                  {dashboardData.activity.dailyActivity.map((day, index) => (
                    <div key={day._id || index} className="activity-day">
                      <div 
                        className="activity-bar"
                        style={{ 
                          height: `${Math.max((day.uploads / Math.max(...dashboardData.activity.dailyActivity.map(d => d.uploads))) * 100, 5)}%`,
                          backgroundColor: 'var(--tenant-primary)'
                        }}
                      ></div>
                      <span className="activity-date">
                        {new Date(day._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="activity-count">{day.uploads}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Top Users */}
            {dashboardData.users?.topUploaders?.length > 0 && (
              <section className="users-section">
                <div className="section-header">
                  <h2>Top Contributors</h2>
                </div>
                <div className="user-list">
                  {dashboardData.users.topUploaders.map((user, index) => (
                    <div key={user._id} className="user-item">
                      <div className="user-rank">#{index + 1}</div>
                      <div className="user-info">
                        <span className="user-name">{user.username}</span>
                        <span className="user-stats">
                          {user.uploads} uploads • {formatBytes(user.totalSize)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default TenantDashboard;