import React, { useState, useEffect } from 'react';
import SuperAdminLayout from '../layout.tsx';
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import Table from "../../components/ui/Table.jsx";
import Modal from "../../components/ui/Modal.jsx";
import { tenantApi, userApi, imageApi, fileApi, superadminApi, subscriptionApi } from '../../api';
import { PauseCircle, PlayCircle, Trash2, Search, ArrowLeft, ArrowRight, Plus, TriangleAlert } from 'lucide-react';
import { useToasts } from '../../components/util/Toasts.jsx';

function AddUserModal({ onClose, onUserAdded }) {
  const [formData, setFormData] = useState<any>({
    username: '',
    email: '',
    password: '',
    role: 'editor',
    tenant: '',
    tenantId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordHint, setPasswordHint] = useState('');
  const [strength, setStrength] = useState(0);
  const [tenants, setTenants] = useState<any[]>([]);

  useEffect(() => {
    const loadTenants = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await tenantApi.getAll();
        const data = await res.json();
        if (data.success && Array.isArray(data.tenants)) {
          setTenants(data.tenants);
        }
      } catch (e) {
        // silent fail; dropdown will be empty
      }
    };
    loadTenants();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      let endpoint, requestBody;

      // Require tenant selection for all roles
      if (!formData.tenantId) {
        setError('Please select a tenant');
        return;
      }

      // Admin creation: use dedicated endpoint
      if (formData.role === 'admin') {
        endpoint = `http://localhost:5000/api/tenants/${formData.tenantId}/admin`;
        requestBody = {
          username: formData.username,
          email: formData.email,
          password: formData.password
        };
      } else {
        // Non-admin tenant-scoped user creation
        endpoint = `http://localhost:5000/api/tenants/${formData.tenantId}/users`;
        requestBody = {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          roleName: formData.role
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
    <Modal open={true} onClose={onClose} title={"Add New User"} footer={null}>
      <div className="p-6 w-96 mx-auto">
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
              onChange={(e) => {
                const v = e.target.value;
                setFormData({...formData, password: v});
                // Simple strength calc to mirror backend policy
                let s = 0;
                if (v.length >= 8) s++;
                if (/[A-Z]/.test(v)) s++;
                if (/[a-z]/.test(v)) s++;
                if (/[0-9]/.test(v)) s++;
                if (/[^A-Za-z0-9]/.test(v)) s++;
                setStrength(s);
                const missing = [];
                if (v && v.length < 8) missing.push('8+ chars');
                if (v && !/[A-Z]/.test(v)) missing.push('uppercase');
                if (v && !/[a-z]/.test(v)) missing.push('lowercase');
                if (v && !/[0-9]/.test(v)) missing.push('number');
                if (v && !/[^A-Za-z0-9]/.test(v)) missing.push('special');
                setPasswordHint(missing.length ? `Missing: ${missing.join(', ')}` : 'Looks good');
              }}
              required
            />
            <div className="h-2 bg-gray-200 rounded mt-2">
              <div className={`h-2 rounded ${strength <= 2 ? 'bg-red-500' : strength === 3 ? 'bg-yellow-500' : strength === 4 ? 'bg-blue-500' : 'bg-green-600'}`} style={{ width: `${(strength/5)*100}%` }} />
            </div>
            {formData.password && (
              <div className="text-xs text-gray-600 mt-1">{passwordHint}</div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tenant
            </label>
            <select
              value={formData.tenantId}
              onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select tenant (required)</option>
              {tenants.map((t) => (
                <option key={t._id} value={t._id}>{t.name} {t.subdomain ? `(${t.subdomain})` : ''}</option>
              ))}
            </select>
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
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subLoading, setSubLoading] = useState(false);
  const [subscription, setSubscription] = useState<any | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [newPlan, setNewPlan] = useState('');

  useEffect(() => {
    fetchUserDetails();
    fetchSubscription();
    fetchPlans();
  }, [user._id]);

  const fetchUserDetails = async () => {
    try {
      const token = localStorage.getItem('token');
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

  const fetchSubscription = async () => {
    try {
      const res = await superadminApi.getUserSubscription(user._id);
      const data = await res.json();
      if (data.success) {
        setSubscription(data.subscription);
      }
    } catch (e) {
      // ignore
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await superadminApi.getPlans();
      const data = await res.json();
      if (data.success && Array.isArray(data.plans)) {
        setPlans(data.plans);
      }
    } catch (e) { /* ignore */ }
  };

  const handleChangePlan = async () => {
    if (!newPlan) return;
    setSubLoading(true);
    try {
      const res = await superadminApi.setUserSubscription(user._id, newPlan);
      const data = await res.json();
      if (data.success) {
        setSubscription(data.subscription);
      }
    } catch (e) {
      // ignore
    } finally {
      setSubLoading(false);
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

            <div className="pt-2 border-t">
              <h3 className="text-md font-semibold mb-2">Subscription</h3>
              {subscription ? (
                <div className="text-sm text-gray-800 space-y-1">
                  <div>Plan: <span className="font-medium">{subscription.plan}</span></div>
                  <div>Status: {subscription.status}</div>
                  <div>Payment: {subscription.paymentStatus}</div>
                  <div>Expires: {subscription.expiryDate ? new Date(subscription.expiryDate).toLocaleString() : 'N/A'}</div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">No subscription found</div>
              )}

              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Change Plan</label>
                <div className="flex gap-2 items-center">
                  <select
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value)}
                  >
                    <option value="">Select plan</option>
                    {plans.map((p) => (
                      <option key={p._id || p.name} value={p.name}>{p.displayName || p.name}</option>
                    ))}
                  </select>
                  <Button onClick={handleChangePlan} disabled={subLoading || !newPlan}>
                    {subLoading ? 'Updating...' : 'Update'}
                  </Button>
                </div>
              </div>
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
  const { addNotification } = useToasts() || { addNotification: () => {} };
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [mySub, setMySub] = useState<any | null>(null);
  const [mySubLoading, setMySubLoading] = useState<boolean>(true);
  const [userSubs, setUserSubs] = useState<Record<string, any>>({});

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      console.log('Current user role:', parsedUser.role);
      console.log('Current user tenant:', parsedUser.tenant);
    }
  }, []);

  useEffect(() => {
    const loadMySub = async () => {
      setMySubLoading(true);
      try {
        const res = await subscriptionApi.getStatus();
        const data = await res.json();
        setMySub(data);
      } catch (e) {
        setMySub(null);
      } finally {
        setMySubLoading(false);
      }
    };
    loadMySub();
  }, []);

  useEffect(() => {
    fetchUsers();
    // Reset pagination when filter changes
    setCurrentPage(1);
  }, [statusFilter]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const query = statusFilter === 'all' ? 'includeInactive=true' : `status=${encodeURIComponent(statusFilter)}`;
      const response = await userApi.getAll(query);
      const data = await response.json();
      if (data.success && data.data) {
        setUsers(data.data || []);
        // Load subscriptions for each user
        try {
          const subsEntries: [string, any][] = await Promise.all(
            (data.data || []).map(async (u: any) => {
              try {
                const res = await superadminApi.getUserSubscription(u._id);
                const s = await res.json();
                return [u._id, s?.subscription || null];
              } catch {
                return [u._id, null];
              }
            })
          );
          const map: Record<string, any> = {};
          subsEntries.forEach(([id, sub]) => { map[id] = sub; });
          setUserSubs(map);
        } catch {}
      } else {
        setUsers([]);
        setUserSubs({});
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId, isActive) => {
    const action = isActive ? 'deactivate' : 'reactivate';
    addNotification && addNotification('info', `${action === 'deactivate' ? 'Deactivating' : 'Reactivating'} user`, 'Please wait...', true, 1500);
    
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
        addNotification && addNotification('success', `User ${action === 'deactivate' ? 'deactivated' : 'reactivated'}`, '', true, 2500);
        fetchUsers();
      } else {
        addNotification && addNotification('error', `Failed to ${action} user`, '', true, 3000);
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      addNotification && addNotification('error', `Error trying to ${action} user`, error.message || '', true, 3000);
    }
  };

  const handlePermanentDelete = async (userId) => {
    // Show confirmation toast with actions
    const confirmDelete = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await userApi.delete(userId, true);
        if (response.ok) {
          addNotification && addNotification('success', 'User deleted', 'The user was permanently deleted', true, 2500);
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
      'This action cannot be undone. Proceed?',
      true,
      undefined,
      [
        { label: 'Cancel' },
        { label: 'Delete', variant: 'destructive', onClick: confirmDelete }
      ],
      <TriangleAlert className="w-5 h-5 text-yellow-500" />
    );
  };

  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.tenant?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePrevious = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
    { key: 'subscription', label: 'Subscription', render: (user) => {
        const sub = userSubs[user._id];
        return sub?.plan ? sub.plan : '-';
      }
    },
    { key: 'isActive', label: 'Status', render: (user) => user.isActive ? 'Active' : 'Inactive' },
    { 
      key: 'actions', 
      label: 'Actions', 
      render: (user) => (
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => handleToggleUserStatus(user._id, user.isActive)}
            className={user.isActive ? "text-blue-600 hover:text-blue-800" : "text-green-600 hover:text-green-800"}
            title={user.isActive ? "Deactivate user" : "Reactivate user"}
          >
            {user.isActive ? <PauseCircle className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => handlePermanentDelete(user._id)}
            className="text-red-600 hover:text-red-800"
            title="Permanently delete user"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      )
    }
  ];

  return (
    <SuperAdminLayout title="Users Management">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Users Management</h1>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="inline-flex items-center rounded-md border border-gray-300 bg-white shadow-sm overflow-hidden w-full sm:w-auto" role="tablist" aria-label="Status filter">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                aria-pressed={statusFilter === 'all'}
                title="Show all users"
                className={`px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  statusFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                All
              </button>
              <div className="w-px h-5 bg-gray-200" />
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                aria-pressed={statusFilter === 'active'}
                title="Show active users"
                className={`px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  statusFilter === 'active'
                    ? 'bg-green-600 text-white'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                Active
              </button>
              <div className="w-px h-5 bg-gray-200" />
              <button
                type="button"
                onClick={() => setStatusFilter('inactive')}
                aria-pressed={statusFilter === 'inactive'}
                title="Show inactive users"
                className={`px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  statusFilter === 'inactive'
                    ? 'bg-red-600 text-white'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                Inactive
              </button>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full"
              />
            </div>
            <Button onClick={() => setShowAddModal(true)} className="w-full sm:w-auto">
              <span className="inline-flex items-center gap-1"><Plus className="w-4 h-4" /> Add User</span>
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">Loading users...</div>
          ) : (
            <Table 
              data={currentUsers}
              columns={columns}
            />
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center px-2">
            <div className="flex items-center gap-2">
              <button 
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className={`px-3 py-1 border rounded ${
                  currentPage === 1 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1 rounded ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'border hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button 
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 border rounded ${
                  currentPage === totalPages 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        
        {filteredUsers.length > 0 && (
          <div className="text-center text-sm text-gray-500">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
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