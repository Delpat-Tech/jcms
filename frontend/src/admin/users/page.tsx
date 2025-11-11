import React, { useState, useEffect } from 'react';
import AdminLayout from '../layout.tsx';
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import Table from "../../components/ui/Table.jsx";
import Modal from "../../components/ui/Modal.jsx";
import { userApi, imageApi, fileApi, subscriptionApi } from '../../api';
import { checkUserCountLimit } from '../../utils/subscriptionLimits';
import { useToasts } from '../../components/util/Toasts.jsx';
import { TriangleAlert, Search, Crown, AlertCircle } from 'lucide-react';

function AddUserModal({ onClose, onUserAdded, users }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'editor'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [userLimitError, setUserLimitError] = useState('');

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  useEffect(() => {
    validateUserLimit();
  }, [formData.role, subscriptionStatus, users]);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await subscriptionApi.getStatus();
      if (response.success) {
        setSubscriptionStatus(response.data);
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    }
  };

  const validateUserLimit = () => {
    if (!subscriptionStatus || !users) return;
    
    const hasActiveSubscription = subscriptionStatus.hasActiveSubscription;
    const currentEditors = users.filter(u => u.role?.name === 'editor' || u.role === 'editor').length;
    
    if (formData.role === 'editor') {
      const limitCheck = checkUserCountLimit(currentEditors, 'editor', hasActiveSubscription);
      setUserLimitError(limitCheck.valid ? '' : limitCheck.error);
    } else {
      setUserLimitError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (userLimitError) {
      setError(userLimitError);
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const response = await userApi.create(formData);
      const data = await response.json();
      
      if (data.success) {
        onUserAdded();
        onClose();
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
        <h2 className="text-lg font-semibold mb-4 dark:text-white">Add New User</h2>
        
        {/* Subscription Status */}
        {subscriptionStatus && (
          <div className={`p-3 rounded-lg border ${
            subscriptionStatus.hasActiveSubscription 
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-orange-50 border-orange-200 text-orange-800'
          }`}>
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              <span className="text-sm font-medium">
                {subscriptionStatus.hasActiveSubscription 
                  ? `Premium Plan - Up to 10 editors`
                  : `Free Plan - Up to 1 editor`
                }
              </span>
              {!subscriptionStatus.hasActiveSubscription && (
                <a href="/subscribe" className="text-sm underline hover:no-underline">
                  Upgrade
                </a>
              )}
            </div>
          </div>
        )}

        {/* User Limit Warning */}
        {userLimitError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">User Limit Reached</span>
            </div>
            <p className="text-sm text-red-700 mt-1">{userLimitError}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              className="w-full px-3 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="editor">Editor</option>
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
            <Button type="submit" disabled={loading || !!userLimitError}>
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
      const [userRes, imagesRes, filesRes] = await Promise.all([
        userApi.getById(user._id),
        imageApi.getByUser(user._id),
        fileApi.getAll()
      ]);

      const userData = await userRes.json();
      const imagesData = await imagesRes.json();
      const filesData = await filesRes.json();

      const userFiles = filesData.success && filesData.data ? 
        filesData.data.filter(file => file.user === user._id) : [];

      setUserDetails({
        ...userData.data,
        imageCount: imagesData.success ? (imagesData.data?.length || 0) : 0,
        fileCount: userFiles.length,
        isActive: userData.data?.isActive !== undefined ? userData.data.isActive : user.isActive
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
        <h2 className="text-lg font-semibold mb-4 dark:text-white">User Details</h2>
        
        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : userDetails ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
              <p className="text-sm text-gray-900 dark:text-white">{userDetails.username}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <p className="text-sm text-gray-900 dark:text-white">{userDetails.email}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
              <p className="text-sm text-gray-900 dark:text-white">{userDetails.role?.name || userDetails.role}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tenant</label>
              <p className="text-sm text-gray-900 dark:text-white">{userDetails.tenant?.name || 'No Tenant'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                userDetails.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {userDetails.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Images Uploaded</label>
              <p className="text-sm text-gray-900 dark:text-white">{userDetails.imageCount}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Files Uploaded</label>
              <p className="text-sm text-gray-900 dark:text-white">{userDetails.fileCount}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Created</label>
              <p className="text-sm text-gray-900 dark:text-white">{new Date(userDetails.createdAt).toLocaleString()}</p>
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

export default function AdminUsersPage() {
  const { addNotification } = useToasts() || { addNotification: () => {} };
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await userApi.getAll(true);
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
    addNotification && addNotification('info', `${isActive ? 'Deactivating' : 'Reactivating'} user`, 'Please wait...', true, 1500);
    
    try {
      const response = isActive 
        ? await userApi.delete(userId)
        : await userApi.reactivate(userId);
      
      if (response.ok) {
        addNotification && addNotification('success', `User ${isActive ? 'deactivated' : 'reactivated'}`, '', true, 2500);
        fetchUsers();
      } else {
        addNotification && addNotification('error', `Failed to ${action} user`, '', true, 3000);
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      addNotification && addNotification('error', `Error trying to ${action} user`, error.message || '', true, 3000);
    }
  };

  const handlePermanentDelete = async (userId, username) => {
    const confirm = async () => {
      try {
        const response = await userApi.delete(userId, true);
        if (response.ok) {
          addNotification && addNotification('success', 'User deleted', `${username} was permanently deleted`, true, 2500);
          fetchUsers();
        } else {
          addNotification && addNotification('error', 'Failed to delete user', '', true, 3000);
        }
      } catch (error) {
        console.error('Error permanently deleting user:', error);
        addNotification && addNotification('error', 'Error deleting user', error.message || '', true, 3000);
      }
    };
    addNotification && addNotification(
      'warning',
      'Confirm permanent delete',
      `Delete ${username}? This cannot be undone.`,
      true,
      undefined,
      [
        { label: 'Cancel' },
        { label: 'Delete', variant: 'destructive', onClick: confirm }
      ],
      <TriangleAlert className="w-5 h-5 text-yellow-500" />
    );
  };

  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { key: 'username', label: 'Name', render: (user) => (
      <button 
        onClick={() => setSelectedUser(user)}
        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
        title="Click to view user details"
      >
        {user.username}
      </button>
    )},
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (user) => user.role?.name || user.role },
    { key: 'isActive', label: 'Status', render: (user) => (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {user.isActive ? 'Active' : 'Inactive'}
      </span>
    )},
    { key: 'createdAt', label: 'Created', render: (user) => new Date(user.createdAt).toLocaleDateString() },
    { 
      key: 'actions', 
      label: 'Actions', 
      render: (user) => (
        <div className="flex gap-2">
          <button 
            onClick={() => handleToggleUserStatus(user._id, user.isActive)}
            className={`px-2 py-1 text-xs font-medium rounded ${
              user.isActive 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
            title={user.isActive ? "Deactivate user" : "Reactivate user"}
          >
            {user.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button 
            onClick={() => handlePermanentDelete(user._id, user.username)}
            className="px-2 py-1 text-xs font-medium rounded bg-red-600 text-white hover:bg-red-700"
            title="Permanently delete user and all their data"
          >
            Delete
          </button>
        </div>
      )
    }
  ];

  return (
    <AdminLayout title="User Management">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full"
              />
            </div>
            <Button onClick={() => setShowAddModal(true)} className="w-full sm:w-auto">
              + Add User
            </Button>
          </div>
        </div>

        <div className="bg-white dark:bg-[#2C2C2E] rounded-lg shadow overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">Loading users...</div>
          ) : (
            <Table 
              data={filteredUsers}
              columns={columns}
            />
          )}
        </div>

        {filteredUsers.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'No users found matching your search.' : 'No users in your tenant yet.'}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddUserModal 
          users={users}
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
    </AdminLayout>
  );
}
