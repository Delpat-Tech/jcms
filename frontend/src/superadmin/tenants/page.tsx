import React, { useState, useEffect } from 'react';
import SuperAdminLayout from '../layout.tsx';
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import Table from "../../components/ui/Table.jsx";
import Modal from "../../components/ui/Modal.jsx";

function CreateTenantModal({ onClose, onTenantCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    adminUsername: '',
    adminEmail: '',
    adminPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        onTenantCreated();
      } else {
        setError(data.message || 'Failed to create tenant');
      }
    } catch (error) {
      setError('Error creating tenant: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={true} onClose={onClose}>
      <div className="p-6 w-96">
        <h2 className="text-lg font-semibold mb-4">Create New Tenant</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tenant Name
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Company ABC"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subdomain
            </label>
            <Input
              type="text"
              value={formData.subdomain}
              onChange={(e) => setFormData({...formData, subdomain: e.target.value})}
              placeholder="company-abc"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Admin Username
            </label>
            <Input
              type="text"
              value={formData.adminUsername}
              onChange={(e) => setFormData({...formData, adminUsername: e.target.value})}
              placeholder="admin_abc"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Admin Email
            </label>
            <Input
              type="email"
              value={formData.adminEmail}
              onChange={(e) => setFormData({...formData, adminEmail: e.target.value})}
              placeholder="admin@company-abc.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Admin Password
            </label>
            <Input
              type="password"
              value={formData.adminPassword}
              onChange={(e) => setFormData({...formData, adminPassword: e.target.value})}
              placeholder="Secure password"
              required
            />
          </div>
          
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
          
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Tenant'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function TenantDetailsModal({ tenant, onClose, onTenantUpdated }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Default to overview tab and fetch users for count
    setActiveTab('overview');
    fetchTenantUsers();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchTenantUsers();
    } else if (activeTab === 'stats') {
      fetchTenantStats();
    }
  }, [activeTab, tenant._id]);

  const fetchTenantUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/tenants/${tenant._id}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        // Fetch image and file counts for each user
        const usersWithCounts = await Promise.all(
          (data.users || []).map(async (user) => {
            try {
              const [imagesRes, filesRes] = await Promise.all([
                fetch(`http://localhost:5000/api/users/${user._id}/images`, {
                  headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`http://localhost:5000/api/files`, {
                  headers: { 'Authorization': `Bearer ${token}` }
                })
              ]);
              
              const imagesData = await imagesRes.json();
              const filesData = await filesRes.json();
              
              // Filter files by user ID
              const userFiles = filesData.success && filesData.data ? 
                filesData.data.filter(file => file.user === user._id) : [];
              
              return {
                ...user,
                imageCount: imagesData.success ? (imagesData.data?.length || 0) : 0,
                fileCount: userFiles.length
              };
            } catch (error) {
              console.log(`Error fetching counts for user ${user.username}:`, error);
              return {
                ...user,
                imageCount: 0,
                fileCount: 0
              };
            }
          })
        );
        setUsers(usersWithCounts);
      }
    } catch (error) {
      console.error('Error fetching tenant users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTenantStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/tenants/${tenant._id}/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching tenant stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportUsers = async (format = 'json') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/tenants/${tenant._id}/users/export?format=${format}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (format === 'csv') {
        const csvData = await response.text();
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tenant-${tenant.subdomain}-users.csv`;
        a.click();
      } else {
        const jsonData = await response.json();
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tenant-${tenant.subdomain}-users.json`;
        a.click();
      }
    } catch (error) {
      console.error('Error exporting users:', error);
    }
  };

  return (
    <Modal open={true} onClose={onClose}>
      <div className="p-6 w-full max-w-[1400px] max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{tenant.name} Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        
        <div className="border-b border-gray-200 mb-4">
          <nav className="flex space-x-8">
            {['overview', 'users', 'stats'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
        
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="mt-1 text-sm text-gray-900">{tenant.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Subdomain</label>
                <p className="mt-1 text-sm text-gray-900">{tenant.subdomain}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Admin User</label>
                <p className="mt-1 text-sm text-gray-900">{tenant.adminUser?.username} ({tenant.adminUser?.email})</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  tenant.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {tenant.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Created</label>
                <p className="mt-1 text-sm text-gray-900">{new Date(tenant.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Current Users</label>
                <p className="mt-1 text-sm text-gray-900">{users.length}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Max Users</label>
                <p className="mt-1 text-sm text-gray-900">{tenant.settings?.maxUsers || 50}</p>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Tenant Users ({users.length})</h3>
            </div>
            
            {loading ? (
              <div className="text-center py-4">Loading users...</div>
            ) : users.length > 0 ? (
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/3">User</th>
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/6">Role</th>
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/6">Status</th>
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/12">Images</th>
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/12">Files</th>
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/6">Created</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map(user => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-2 py-3">
                          <div className="max-w-xs">
                            <div className="text-sm font-medium text-gray-900 truncate">{user.username}</div>
                            <div className="text-xs text-gray-500 truncate">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-2 py-3">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {user.role?.name}
                          </span>
                        </td>
                        <td className="px-2 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-2 py-3 text-center">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {user.imageCount || 0}
                          </span>
                        </td>
                        <td className="px-2 py-3 text-center">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            {user.fileCount || 0}
                          </span>
                        </td>
                        <td className="px-2 py-3 text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No users found in this tenant.</p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'stats' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Tenant Statistics</h3>
            
            {loading ? (
              <div className="text-center py-4">Loading statistics...</div>
            ) : stats ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900">Users</h4>
                  <p className="text-2xl font-bold text-blue-600">{stats.users?.total || 0}</p>
                  <p className="text-sm text-blue-700">Active: {stats.users?.active || 0}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900">Images</h4>
                  <p className="text-2xl font-bold text-green-600">{stats.images?.total || 0}</p>
                  <p className="text-sm text-green-700">Size: {Math.round((stats.images?.totalSize || 0) / 1024 / 1024)} MB</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-900">Files</h4>
                  <p className="text-2xl font-bold text-purple-600">{stats.files?.total || 0}</p>
                  <p className="text-sm text-purple-700">Size: {Math.round((stats.files?.totalSize || 0) / 1024 / 1024)} MB</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-medium text-orange-900">Storage</h4>
                  <p className="text-2xl font-bold text-orange-600">{Math.round((stats.storage?.totalUsed || 0) / 1024 / 1024)} MB</p>
                  <p className="text-sm text-orange-700">Limit: {stats.storage?.maxAllowed || '10GB'}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">No statistics available</div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/tenants', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setTenants(data.tenants || []);
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTenant = async (tenantId) => {
    if (!window.confirm('Are you sure you want to delete this tenant? This will delete all associated users and data.')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/tenants/${tenantId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        fetchTenants();
      }
    } catch (error) {
      console.error('Error deleting tenant:', error);
    }
  };

  const filteredTenants = tenants.filter(t => 
    t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.subdomain?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.adminUser?.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { 
      key: 'name', 
      label: 'Tenant Name',
      render: (tenant) => (
        <button 
          onClick={() => setSelectedTenant(tenant)}
          className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
          title="Click to view tenant details"
        >
          {tenant.name}
        </button>
      )
    },
    { key: 'subdomain', label: 'Subdomain' },
    { key: 'adminUser', label: 'Admin User', render: (tenant) => `${tenant.adminUser?.username} (${tenant.adminUser?.email})` },
    { key: 'isActive', label: 'Status', render: (tenant) => (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
        tenant.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {tenant.isActive ? 'Active' : 'Inactive'}
      </span>
    )},
    { key: 'createdAt', label: 'Created', render: (tenant) => new Date(tenant.createdAt).toLocaleDateString() },
    { 
      key: 'actions', 
      label: 'Actions', 
      render: (tenant) => (
        <div className="flex gap-2">
          <button 
            onClick={() => setSelectedTenant(tenant)}
            className="text-blue-600 hover:text-blue-800"
            title="View Details"
          >
            👁️
          </button>
          <button 
            onClick={() => handleDeleteTenant(tenant._id)}
            className="text-red-600 hover:text-red-800"
            title="Delete Tenant"
          >
            🗑️
          </button>
        </div>
      )
    }
  ];

  return (
    <SuperAdminLayout title="Tenant Management" user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Tenant Management</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="🔍 Search tenants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              + Create Tenant
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center">Loading tenants...</div>
          ) : (
            <Table 
              data={filteredTenants}
              columns={columns}
            />
          )}
        </div>

        {filteredTenants.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'No tenants found matching your search.' : 'No tenants created yet.'}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateTenantModal 
          onClose={() => setShowCreateModal(false)}
          onTenantCreated={() => {
            setShowCreateModal(false);
            fetchTenants();
          }}
        />
      )}

      {selectedTenant && (
        <TenantDetailsModal 
          tenant={selectedTenant}
          onClose={() => setSelectedTenant(null)}
          onTenantUpdated={() => {
            setSelectedTenant(null);
            fetchTenants();
          }}
        />
      )}
    </SuperAdminLayout>
  );
}
