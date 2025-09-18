import { useState, useEffect, useCallback } from "react";
import SuperAdminLayout from "../layout.tsx";
import Modal from "../../components/ui/Modal.jsx";
import { useToasts } from "../../components/util/Toasts.jsx";

function AnalyticsPage() {
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const { addNotification } = useToasts() || { addNotification: () => {} };

  const token = localStorage.getItem("token");

  const fetchTenantAnalytics = useCallback(async (tenantId) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/tenant-analytics/${tenantId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (error) {
      addNotification('error', 'Error', 'Failed to fetch analytics');
    }
  }, [token, addNotification]);

  const fetchTenants = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/tenants`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTenants(data.tenants);
        if (data.tenants.length > 0) {
          setSelectedTenant(data.tenants[0]);
          fetchTenantAnalytics(data.tenants[0]._id);
        }
      }
    } catch (error) {
      addNotification('error', 'Error', 'Failed to fetch tenants');
    } finally {
      setLoading(false);
    }
  }, [token, addNotification, fetchTenantAnalytics]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const handleTenantChange = (tenant) => {
    setSelectedTenant(tenant);
    fetchTenantAnalytics(tenant._id);
  };

  if (loading) return <SuperAdminLayout><div>Loading analytics...</div></SuperAdminLayout>;

  return (
    <SuperAdminLayout title="Analytics">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Tenant Analytics</h1>
          <select 
            className="px-4 py-2 border rounded-lg"
            value={selectedTenant?._id || ''}
            onChange={(e) => {
              const tenant = tenants.find(t => t._id === e.target.value);
              handleTenantChange(tenant);
            }}
          >
            {tenants.map(tenant => (
              <option key={tenant._id} value={tenant._id}>
                {tenant.name}
              </option>
            ))}
          </select>
        </div>

        {selectedTenant && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">{selectedTenant.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-gray-600">Domain:</span>
                <p className="font-semibold">{selectedTenant.domain}</p>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <p className={`font-semibold ${selectedTenant.isActive ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedTenant.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Created:</span>
                <p className="font-semibold">{new Date(selectedTenant.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        )}

        {analytics && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-700">Users</h3>
                <p className="text-3xl font-bold text-blue-600">{analytics.users?.total || 0}</p>
                <p className="text-sm text-gray-500">Active: {analytics.users?.active || 0}</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-700">Images</h3>
                <p className="text-3xl font-bold text-green-600">{analytics.images?.total || 0}</p>
                <p className="text-sm text-gray-500">Size: {analytics.images?.totalSize || 0}MB</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-700">Files</h3>
                <p className="text-3xl font-bold text-purple-600">{analytics.files?.total || 0}</p>
                <p className="text-sm text-gray-500">Size: {analytics.files?.totalSize || 0}MB</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-700">Activities</h3>
                <p className="text-3xl font-bold text-orange-600">{analytics.activities?.total || 0}</p>
                <p className="text-sm text-gray-500">Today: {analytics.activities?.today || 0}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Recent Activities</h3>
                <div className="space-y-2">
                  {analytics.recentActivities?.map((activity, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b">
                      <div className="flex items-center space-x-3">
                        <div>
                          {activity.imageUrl ? (
                            <button 
                              onClick={() => {
                                console.log('Clicking image activity:', activity.imageUrl);
                                setSelectedImage(activity.imageUrl);
                              }}
                              className="text-blue-600 hover:underline font-medium text-left"
                            >
                              {activity.action}
                            </button>
                          ) : (
                            <p className="font-medium">{activity.action}</p>
                          )}
                          <p className="text-sm text-gray-500">{activity.username}</p>
                        </div>
                        {activity.imageUrl && (
                          <img 
                            src={activity.imageUrl} 
                            alt="Uploaded" 
                            className="w-8 h-8 object-cover rounded cursor-pointer" 
                            onClick={() => {
                              console.log('Clicking thumbnail:', activity.imageUrl);
                              setSelectedImage(activity.imageUrl);
                            }}
                          />
                        )}
                      </div>
                      <span className="text-sm text-gray-400">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  )) || <p className="text-gray-500">No recent activities</p>}
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Storage Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Images</span>
                    <span className="font-semibold">{analytics.images?.totalSize || 0}MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Files</span>
                    <span className="font-semibold">{analytics.files?.totalSize || 0}MB</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Total Used</span>
                    <span className="font-semibold">{(analytics.images?.totalSize || 0) + (analytics.files?.totalSize || 0)}MB</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        
        <Modal
          open={!!selectedImage}
          onClose={() => {
            console.log('Closing modal');
            setSelectedImage(null);
          }}
          title="Image Preview"
        >
          {selectedImage && (
            <div className="text-center">
              <img 
                src={selectedImage} 
                alt="Preview" 
                className="max-w-full max-h-96 mx-auto rounded"
                onError={(e) => {
                  console.log('Image load error:', e.target.src);
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
                onLoad={() => console.log('Image loaded successfully')}
              />
              <div style={{display: 'none'}} className="text-red-500 p-4">
                Failed to load image: {selectedImage}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </SuperAdminLayout>
  );
}

export default AnalyticsPage;