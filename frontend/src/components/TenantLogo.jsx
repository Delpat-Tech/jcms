import React, { useState, useEffect } from 'react';
import { Edit3 } from 'lucide-react';
import TenantLogoEditor from './TenantLogoEditor';
import { tenantApi } from '../api';

const TenantLogo = ({ user }) => {
  const [tenantLogo, setTenantLogo] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showTenantSelector, setShowTenantSelector] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.tenant?._id) {
      fetchTenantLogo();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchTenantLogo = async () => {
    try {
      const response = await tenantApi.getById(user.tenant._id);
      const result = await response.json();
      if (result.success) {
        setTenantLogo(result.tenant.branding?.logo);
      }
    } catch (error) {
      console.error('Error fetching tenant logo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpdate = (newLogo) => {
    setTenantLogo(newLogo);
    setShowEditor(false);
  };

  const fetchTenants = async () => {
    try {
      const response = await tenantApi.getAll();
      const result = await response.json();
      if (result.success) {
        setTenants(result.tenants);
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
  };

  const handleTenantSelect = (tenantId) => {
    setSelectedTenantId(tenantId);
    setShowTenantSelector(false);
    setShowEditor(true);
  };

  const handleSuperadminClick = async () => {
    await fetchTenants();
    setShowTenantSelector(true);
  };

  // Allow admin users to edit their tenant logo, superadmin can edit any tenant
  const canEdit = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'superadmin';

  if (loading) {
    return (
      <div className="h-10 w-24 rounded-sm bg-gray-100 animate-pulse border border-gray-300" />
    );
  }

  return (
    <div className="relative group">
      <div 
        className={`h-10 w-24 rounded-sm bg-gray-200 flex items-center justify-center text-gray-600 text-[10px] font-medium border border-gray-300 overflow-hidden ${
          canEdit ? 'cursor-pointer hover:bg-gray-300' : ''
        }`}
        onClick={canEdit ? (user?.role?.toLowerCase() === 'superadmin' ? handleSuperadminClick : () => setShowEditor(true)) : undefined}
      >
        {tenantLogo?.url ? (
          <img 
            src={tenantLogo.url} 
            alt="Tenant Logo" 
            className="h-full w-full object-contain"
          />
        ) : (
          'Tenant Logo'
        )}
        
        {canEdit && (
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
            <Edit3 className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {showTenantSelector && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 100
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-xl" 
            style={{
              position: 'absolute',
              top: '40%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '384px',
              maxHeight: '500px'
            }}
          >
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Select Tenant</h3>
              <p className="text-sm text-gray-600">Choose tenant to edit logo</p>
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {tenants.map(tenant => (
                <button
                  key={tenant._id}
                  onClick={() => handleTenantSelect(tenant._id)}
                  className="w-full p-4 text-left hover:bg-gray-50 border-b border-gray-100 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-gray-900">{tenant.name}</div>
                    <div className="text-sm text-gray-500">{tenant.subdomain}</div>
                  </div>
                  <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                    {tenant.branding?.logo?.url ? (
                      <img src={tenant.branding.logo.url} alt="Logo" className="w-full h-full object-contain rounded" />
                    ) : (
                      'No'
                    )}
                  </div>
                </button>
              ))}
            </div>
            
            <div className="p-4 border-t">
              <button
                onClick={() => setShowTenantSelector(false)}
                className="w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditor && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 100
          }}
        >
          <div 
            className="bg-white rounded-lg p-6" 
            style={{
              position: 'absolute',
              top: '40%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100%',
              maxWidth: '448px'
            }}
          >
            <h3 className="text-lg font-semibold mb-4">Update Tenant Logo</h3>
            <TenantLogoEditor
              tenantId={selectedTenantId || user.tenant?._id}
              currentLogo={tenantLogo}
              onLogoUpdate={handleLogoUpdate}
            />
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowEditor(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantLogo;
