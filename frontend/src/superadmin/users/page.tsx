import React, { useState, useEffect } from 'react';
import SuperAdminLayout from '../layout.tsx';
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import Table from "../../components/ui/Table.jsx";
import Modal from "../../components/ui/Modal.jsx";

function AddUserModal({ onClose, onUserAdded }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'editor',
    tenant: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      let endpoint, requestBody;

      if (formData.tenant.trim()) {
        // First, find tenant by name or subdomain
        const tenantsResponse = await fetch('http://localhost:5000/api/tenants', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const tenantsData = await tenantsResponse.json();
        
        if (!tenantsData.success) {
          setError('Failed to fetch tenants');
          return;
        }
        
        const tenant = tenantsData.tenants.find(t => 
          t.name.toLowerCase() === formData.tenant.toLowerCase()
        );
        
        if (!tenant) {
          setError(`Tenant '${formData.tenant}' not found. Please check the tenant name.`);
          return;
        }
        
        // Create user within the found tenant
        endpoint = `http://localhost:5000/api/tenants/${tenant._id}/users`;
        requestBody = {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          roleName: formData.role
        };
      } else {
        // Create standalone user (no tenant)
        endpoint = 'http://localhost:5000/api/users';
        requestBody = {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role
        };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      
      if (data.success) {
        onUserAdded();
      } else {
        setError(data.message || 'Failed to create user');
      }
    } catch (error) {
      setError('Error creating user: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={true} onClose={onClose}>
      <div className="p-6 w-96">
        <h2 className="text-lg font-semibold mb-4">Add New User</h2>

        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <Input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tenant
            </label>
            <Input
              type="text"
              value={formData.tenant}
              onChange={(e) => setFormData({...formData, tenant: e.target.value})}
              placeholder="Enter tenant name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
            </select>
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
              {loading ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function UserDetailsModal({ user, onClose }) {
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserDetails();
  }, [user._id]);

  const fetchUserDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const [userRes, imagesRes, filesRes] = await Promise.all([
        fetch(`http://localhost:5000/api/users/${user._id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`http://localhost:5000/api/users/${user._id}/images`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`http://localhost:5000/api/files`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const userData = await userRes.json();
      const imagesData = await imagesRes.json();
      const filesData = await filesRes.json();

      const userFiles = filesData.success && filesData.data ? 
        filesData.data.filter(file => file.user === user._id) : [];

      setUserDetails({
        ...userData.data,
        imageCount: imagesData.success ? (imagesData.data?.length || 0) : 0,
        fileCount: userFiles.length
      });
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={true} onClose={onClose}>
      <div className="p-6 w-96">
        <h2 className="text-lg font-semibold mb-4">User Details</h2>
        
        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : userDetails ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <p className="text-sm text-gray-900">{userDetails.username}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="text-sm text-gray-900">{userDetails.email}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <p className="text-sm text-gray-900">{userDetails.role?.name || userDetails.role}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Tenant</label>
              <p className="text-sm text-gray-900">{userDetails.tenant?.name || 'No Tenant'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                userDetails.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {userDetails.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Images Uploaded</label>
              <p className="text-sm text-gray-900">{userDetails.imageCount}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Files Uploaded</label>
              <p className="text-sm text-gray-900">{userDetails.fileCount}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Created</label>
              <p className="text-sm text-gray-900">{new Date(userDetails.createdAt).toLocaleString()}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">Failed to load user details</div>
        )}
        
        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      console.log('Current user role:', parsedUser.role);
      console.log('Current user tenant:', parsedUser.tenant);
    }
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/users?includeInactive=true', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.data) {
        setUsers(data.data || []);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId, isActive) => {
    const action = isActive ? 'deactivate' : 'reactivate';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    
    try {
      const token = localStorage.getItem('token');
      const endpoint = isActive 
        ? `http://localhost:5000/api/users/${userId}`
        : `http://localhost:5000/api/users/${userId}/reactivate`;
      const method = isActive ? 'DELETE' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
    }
  };

  const handlePermanentDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to PERMANENTLY delete this user? This action cannot be undone!')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/users/${userId}?permanent=true`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Error permanently deleting user:', error);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.tenant?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { key: 'username', label: 'Name', render: (user) => (
      <button 
        onClick={() => setSelectedUser(user)}
        className="text-blue-600 hover:text-blue-800 hover:underline"
        title="Click to view user details"
      >
        {user.username}
      </button>
    )},
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (user) => user.role?.name || user.role },
    { key: 'tenant', label: 'Tenant', render: (user) => user.tenant?.name || 'No Tenant' },
    { key: 'isActive', label: 'Status', render: (user) => user.isActive ? 'Active' : 'Inactive' },
    { 
      key: 'actions', 
      label: 'Actions', 
      render: (user) => (
        <div className="flex gap-2">
          <button 
            onClick={() => handleToggleUserStatus(user._id, user.isActive)}
            className={user.isActive ? "text-orange-600 hover:text-orange-800" : "text-green-600 hover:text-green-800"}
            title={user.isActive ? "Deactivate user" : "Reactivate user"}
          >
            {user.isActive ? '⏸️' : '▶️'}
          </button>
          <button 
            onClick={() => handlePermanentDelete(user._id)}
            className="text-red-600 hover:text-red-800"
            title="Permanently delete user"
          >
            🗑️
          </button>
        </div>
      )
    }
  ];

  return (
    <SuperAdminLayout title="Users Management" user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="🔍 Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button onClick={() => setShowAddModal(true)}>
              + Add User
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center">Loading users...</div>
          ) : (
            <Table 
              data={filteredUsers}
              columns={columns}
            />
          )}
        </div>

        {filteredUsers.length > 10 && (
          <div className="flex justify-center">
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 border rounded">←</button>
              <span className="px-3 py-1 bg-blue-600 text-white rounded">1</span>
              <button className="px-3 py-1 border rounded">2</button>
              <button className="px-3 py-1 border rounded">3</button>
              <button className="px-3 py-1 border rounded">→</button>
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddUserModal 
          onClose={() => setShowAddModal(false)}
          onUserAdded={() => {
            setShowAddModal(false);
            fetchUsers();
          }}
        />
      )}

      {selectedUser && (
        <UserDetailsModal 
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </SuperAdminLayout>
  );
}