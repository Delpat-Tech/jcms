// pages/TestDashboard.jsx
import React, { useState, useEffect } from 'react';
import TenantDashboard from '../components/TenantDashboard';
import TenantSelector from '../components/common/TenantSelector';
import BrandingProvider from '../components/common/BrandingProvider';
import DashboardWidget, { StatsWidget, ListWidget } from '../components/common/DashboardWidget';
import './TestDashboard.css';

const TestDashboard = () => {
  const [currentTenant, setCurrentTenant] = useState(null);
  const [testMode, setTestMode] = useState('dashboard'); // 'dashboard', 'components', 'widgets'
  const [mockData, setMockData] = useState({
    tenants: [],
    dashboardData: null
  });

  useEffect(() => {
    // Create some mock data for testing
    const mockTenants = [
      {
        id: '1',
        name: 'Acme Corp',
        subdomain: 'acme',
        branding: {
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
              large: '20px'
            }
          },
          theme: {
            borderRadius: '8px',
            shadowIntensity: 'medium'
          },
          logo: {
            url: 'https://via.placeholder.com/48x48/3b82f6/ffffff?text=AC'
          }
        }
      },
      {
        id: '2',
        name: 'TechStart Inc',
        subdomain: 'techstart',
        branding: {
          colors: {
            primary: '#7c3aed',
            secondary: '#6b7280',
            accent: '#f59e0b',
            background: '#fefefe',
            surface: '#f9fafb',
            text: {
              primary: '#111827',
              secondary: '#6b7280'
            }
          },
          typography: {
            fontFamily: 'Poppins, system-ui, sans-serif',
            fontSize: {
              small: '13px',
              medium: '15px',
              large: '18px'
            }
          },
          theme: {
            borderRadius: '12px',
            shadowIntensity: 'light'
          },
          logo: {
            url: 'https://via.placeholder.com/48x48/7c3aed/ffffff?text=TS'
          }
        }
      },
      {
        id: '3',
        name: 'Green Solutions',
        subdomain: 'greensol',
        branding: {
          colors: {
            primary: '#059669',
            secondary: '#4b5563',
            accent: '#dc2626',
            background: '#f8fffe',
            surface: '#f0fdfa',
            text: {
              primary: '#064e3b',
              secondary: '#4b5563'
            }
          },
          typography: {
            fontFamily: 'Roboto, system-ui, sans-serif',
            fontSize: {
              small: '14px',
              medium: '16px',
              large: '22px'
            }
          },
          theme: {
            borderRadius: '6px',
            shadowIntensity: 'strong'
          },
          logo: {
            url: 'https://via.placeholder.com/48x48/059669/ffffff?text=GS'
          }
        }
      }
    ];

    const mockDashboard = {
      overview: {
        totalUsers: 1247,
        activeUsers: 89,
        totalResources: 5632,
        totalImages: 3421,
        totalFiles: 2211
      },
      storage: {
        used: 2147483648, // 2GB in bytes
        maxAllowed: '5GB',
        usagePercentage: 42.9,
        isOverQuota: false
      },
      activity: {
        newImages: 127,
        newFiles: 43,
        dailyActivity: [
          { _id: '2024-01-10', uploads: 45 },
          { _id: '2024-01-11', uploads: 32 },
          { _id: '2024-01-12', uploads: 78 },
          { _id: '2024-01-13', uploads: 56 },
          { _id: '2024-01-14', uploads: 91 },
          { _id: '2024-01-15', uploads: 23 },
          { _id: '2024-01-16', uploads: 67 }
        ]
      },
      users: {
        topUploaders: [
          { _id: 'u1', username: 'john_doe', uploads: 156, totalSize: 524288000 },
          { _id: 'u2', username: 'sarah_wilson', uploads: 142, totalSize: 487342080 },
          { _id: 'u3', username: 'mike_chen', uploads: 98, totalSize: 298844160 },
          { _id: 'u4', username: 'emma_davis', uploads: 87, totalSize: 267386880 },
          { _id: 'u5', username: 'alex_brown', uploads: 71, totalSize: 209715200 }
        ]
      }
    };

    setMockData({
      tenants: mockTenants,
      dashboardData: mockDashboard
    });

    // Set first tenant as default
    setCurrentTenant(mockTenants[0]);
  }, []);

  const handleTenantChange = (tenant) => {
    console.log('Switching to tenant:', tenant);
    setCurrentTenant(tenant);
  };

  const mockApiCalls = () => {
    // Override fetch for testing
    const originalFetch = window.fetch;
    
    window.fetch = async (url, options) => {
      console.log('Mock API call:', url, options);
      
      // Mock tenant switching endpoints
      if (url.includes('/api/tenant-switching/my/tenants')) {
        return {
          ok: true,
          json: async () => ({ tenants: mockData.tenants })
        };
      }
      
      if (url.includes('/api/tenant-switching/my/context')) {
        return {
          ok: true,
          json: async () => ({ tenant: currentTenant })
        };
      }
      
      if (url.includes('/api/tenant-switching/switch')) {
        return {
          ok: true,
          json: async () => ({ success: true })
        };
      }
      
      if (url.includes('/api/tenant-analytics/') && url.includes('/dashboard')) {
        return {
          ok: true,
          json: async () => ({ dashboard: mockData.dashboardData })
        };
      }
      
      // Fallback to real API
      return originalFetch(url, options);
    };
    
    return () => {
      window.fetch = originalFetch;
    };
  };

  useEffect(() => {
    const cleanup = mockApiCalls();
    return cleanup;
  }, [currentTenant, mockData]);

  const mockWidgetData = {
    recentUploads: [
      { id: 1, name: 'product-image.jpg', user: 'john_doe', time: '2 mins ago' },
      { id: 2, name: 'document.pdf', user: 'sarah_wilson', time: '5 mins ago' },
      { id: 3, name: 'presentation.pptx', user: 'mike_chen', time: '8 mins ago' },
      { id: 4, name: 'spreadsheet.xlsx', user: 'emma_davis', time: '12 mins ago' },
    ],
    systemAlerts: [
      { id: 1, message: 'Storage quota at 85%', type: 'warning' },
      { id: 2, message: 'New user registered', type: 'info' },
      { id: 3, message: 'Backup completed successfully', type: 'success' },
    ]
  };

  return (
    <BrandingProvider tenant={currentTenant}>
      <div className="test-dashboard">
        <header className="test-header">
          <div className="test-header-content">
            <h1>🧪 JCMS Component Testing</h1>
            <div className="test-controls">
              <div className="mode-selector">
                <label>Test Mode:</label>
                <select 
                  value={testMode} 
                  onChange={(e) => setTestMode(e.target.value)}
                  className="mode-select"
                >
                  <option value="dashboard">Full Dashboard</option>
                  <option value="components">Individual Components</option>
                  <option value="widgets">Widget Showcase</option>
                </select>
              </div>
              
              <TenantSelector
                currentTenant={currentTenant}
                onTenantChange={handleTenantChange}
                size="medium"
                placement="bottom-right"
              />
            </div>
          </div>
        </header>

        <main className="test-content">
          {testMode === 'dashboard' && (
            <div className="test-section">
              <div className="section-info">
                <h2>📊 Tenant Dashboard Test</h2>
                <p>Testing the complete tenant dashboard with all features:</p>
                <ul>
                  <li>✅ Dynamic tenant branding</li>
                  <li>✅ Analytics data display</li>
                  <li>✅ Storage usage visualization</li>
                  <li>✅ Activity charts</li>
                  <li>✅ User statistics</li>
                  <li>✅ Responsive design</li>
                </ul>
              </div>
              <TenantDashboard />
            </div>
          )}

          {testMode === 'components' && (
            <div className="test-section">
              <div className="section-info">
                <h2>🔧 Component Testing</h2>
                <p>Testing individual components with different configurations.</p>
              </div>
              
              <div className="component-tests">
                <div className="test-group">
                  <h3>TenantSelector Variants</h3>
                  <div className="selector-variants">
                    <div className="variant">
                      <label>Small:</label>
                      <TenantSelector
                        currentTenant={currentTenant}
                        onTenantChange={handleTenantChange}
                        size="small"
                      />
                    </div>
                    <div className="variant">
                      <label>Medium:</label>
                      <TenantSelector
                        currentTenant={currentTenant}
                        onTenantChange={handleTenantChange}
                        size="medium"
                      />
                    </div>
                    <div className="variant">
                      <label>Large:</label>
                      <TenantSelector
                        currentTenant={currentTenant}
                        onTenantChange={handleTenantChange}
                        size="large"
                      />
                    </div>
                  </div>
                </div>

                <div className="test-group">
                  <h3>Branding Application Test</h3>
                  <div className="branding-demo">
                    <div className="demo-card" style={{
                      background: 'var(--tenant-surface)',
                      border: '1px solid var(--tenant-border, #e2e8f0)',
                      borderRadius: 'var(--tenant-border-radius)',
                      padding: '20px',
                      boxShadow: 'var(--tenant-shadow)'
                    }}>
                      <h4 style={{ color: 'var(--tenant-text-primary)' }}>
                        Dynamic Branding Demo
                      </h4>
                      <p style={{ color: 'var(--tenant-text-secondary)' }}>
                        This card uses CSS variables that change based on the selected tenant.
                      </p>
                      <button style={{
                        background: 'var(--tenant-primary)',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: 'var(--tenant-border-radius)',
                        fontFamily: 'var(--tenant-font-family)'
                      }}>
                        Primary Button
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {testMode === 'widgets' && (
            <div className="test-section">
              <div className="section-info">
                <h2>📦 Widget Showcase</h2>
                <p>Testing all dashboard widget variations and states.</p>
              </div>
              
              <div className="widgets-grid">
                <StatsWidget
                  title="Total Users"
                  value={1247}
                  change={12.5}
                  changeType="positive"
                  subtitle="Active this month"
                  icon="👥"
                />

                <StatsWidget
                  title="Revenue"
                  value="$45.2K"
                  change={-3.2}
                  changeType="negative"
                  subtitle="This quarter"
                  icon="💰"
                />

                <StatsWidget
                  title="Storage Used"
                  value="2.1GB"
                  change={5.8}
                  changeType="neutral"
                  subtitle="of 5GB limit"
                  icon="💾"
                />

                <DashboardWidget
                  title="System Status"
                  icon="⚡"
                  loading={false}
                  onRefresh={() => console.log('Refreshing...')}
                >
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <div style={{ fontSize: '32px', marginBottom: '10px' }}>✅</div>
                    <div>All systems operational</div>
                  </div>
                </DashboardWidget>

                <ListWidget
                  title="Recent Uploads"
                  items={mockWidgetData.recentUploads}
                  icon="📁"
                  renderItem={(item) => (
                    <div key={item.id} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: '500' }}>{item.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--tenant-text-secondary)' }}>
                          by {item.user}
                        </div>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--tenant-text-secondary)' }}>
                        {item.time}
                      </div>
                    </div>
                  )}
                  maxItems={3}
                  showMore={true}
                  onShowMore={() => console.log('Show more uploads')}
                />

                <ListWidget
                  title="System Alerts"
                  items={mockWidgetData.systemAlerts}
                  icon="🔔"
                  renderItem={(item) => (
                    <div key={item.id} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '16px' }}>
                        {item.type === 'warning' ? '⚠️' : 
                         item.type === 'success' ? '✅' : 'ℹ️'}
                      </span>
                      <span>{item.message}</span>
                    </div>
                  )}
                />

                <DashboardWidget
                  title="Loading Demo"
                  loading={true}
                  icon="⏳"
                />

                <DashboardWidget
                  title="Error Demo"
                  error="Failed to load data"
                  icon="❌"
                  onRefresh={() => console.log('Retrying...')}
                />
              </div>
            </div>
          )}
        </main>

        <div className="test-info">
          <h3>🔍 Current Test Info</h3>
          <div className="info-grid">
            <div className="info-item">
              <strong>Current Tenant:</strong> {currentTenant?.name || 'None'}
            </div>
            <div className="info-item">
              <strong>Subdomain:</strong> @{currentTenant?.subdomain || 'none'}
            </div>
            <div className="info-item">
              <strong>Primary Color:</strong> 
              <span 
                className="color-swatch" 
                style={{ backgroundColor: currentTenant?.branding?.colors?.primary || '#gray' }}
              ></span>
              {currentTenant?.branding?.colors?.primary || 'Default'}
            </div>
            <div className="info-item">
              <strong>Font Family:</strong> {currentTenant?.branding?.typography?.fontFamily || 'Default'}
            </div>
          </div>
        </div>
      </div>
    </BrandingProvider>
  );
};

export default TestDashboard;