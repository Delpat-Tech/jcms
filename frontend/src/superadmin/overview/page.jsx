import React, { useEffect, useState } from 'react';
import SuperAdminLayout from '../layout.tsx';
import Button from '../../components/ui/Button.jsx';
import { superadminApi } from '../../api';
import TrioLoader from '../../components/ui/TrioLoader.jsx';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, AlertTriangle, Users as UsersIcon, Building2, Image as ImageIcon, BarChart3, LineChart, Settings as SettingsIcon, Shield, Folder } from 'lucide-react';

export default function SuperAdminOverview() {
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      console.log('Current user:', parsedUser);
      console.log('User role:', parsedUser?.role);
    } else {
      console.log('No user data found in localStorage');
    }
    fetchDashboardData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      setError(null);
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      
      console.log('Fetching dashboard data...');
      console.log('Token from localStorage:', localStorage.getItem('token'));
      console.log('User from localStorage:', localStorage.getItem('user'));
      
      const response = await superadminApi.getDashboard();
      console.log('Response received:', response);
      
      if (!response) {
        throw new Error('No response received');
      }
      
      const data = await response.json();
      console.log('Data parsed:', data);
      
      if (data.success) {
        setDashboardData(data.data);
        setLastUpdated(new Date());
        console.log('Dashboard data set:', data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        data: error.data
      });
      setError(error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  if (loading) {
    return (
      <SuperAdminLayout title="Super Admin Overview">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <TrioLoader size="50" color="#3b82f6" />
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout title="Super Admin Overview">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Overview</h1>
            <p className="text-gray-600">Welcome back, {user?.username}</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 flex items-center space-x-2 disabled:opacity-50"
            >
              {refreshing ? <TrioLoader size="16" color="#6b7280" /> : <RotateCcw className="w-4 h-4" />}
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            {lastUpdated && (
              <span className="text-xs text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
              <div className="flex-1">
                <p className="text-red-700">Error loading dashboard: {error}</p>
                <div className="mt-2 text-xs text-gray-600">
                  <p>Debug Info:</p>
                  <p>Token exists: {localStorage.getItem('token') ? 'Yes' : 'No'}</p>
                  <p>User exists: {localStorage.getItem('user') ? 'Yes' : 'No'}</p>
                  <p>API URL: {process.env.REACT_APP_API_URL || 'http://localhost:5000'}</p>
                  <button 
                    onClick={async () => {
                      try {
                        const response = await superadminApi.getUsers();
                        const data = await response.json();
                        console.log('Test API call result:', data);
                        alert('Test API call successful! Check console for details.');
                      } catch (err) {
                        console.error('Test API call failed:', err);
                        alert(`Test API call failed: ${err.message}`);
                      }
                    }}
                    className="mt-2 px-2 py-1 bg-blue-500 text-white rounded text-xs"
                  >
                    Test API
                  </button>
                </div>
              </div>
              <button 
                onClick={() => fetchDashboardData()}
                className="ml-auto text-red-600 hover:text-red-800 underline"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Show dashboard content even if there's an error (if we have cached data) */}
        {dashboardData && (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div 
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-blue-300 hover:scale-105"
                onClick={() => navigate('/superadmin/users')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2 transition-all duration-500">{dashboardData.overview?.totalUsers || 0}</p>
                    <p className="text-sm text-gray-500 mt-1">{dashboardData.overview?.activeUsersToday || 0} active today</p>
                  </div>
                  <UsersIcon className="w-10 h-10 text-blue-500 opacity-20 hover:opacity-40 transition-opacity" />
                </div>
              </div>

              <div 
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-green-300 hover:scale-105"
                onClick={() => navigate('/superadmin/tenants')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tenants</p>
                    <p className="text-3xl font-bold text-green-600 mt-2 transition-all duration-500">{dashboardData.overview?.totalTenants || 0}</p>
                    <p className="text-sm text-gray-500 mt-1">{dashboardData.analytics?.tenantsByStatus?.active || 0} active</p>
                  </div>
                  <Building2 className="w-10 h-10 text-green-500 opacity-20 hover:opacity-40 transition-opacity" />
                </div>
              </div>

              <div 
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-purple-300 hover:scale-105"
                onClick={() => navigate('/superadmin/media')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Images</p>
                    <p className="text-3xl font-bold text-purple-600 mt-2 transition-all duration-500">{dashboardData.overview?.totalImages || 0}</p>
                    <p className="text-sm text-gray-500 mt-1">{dashboardData.analytics?.storage?.total || 0}MB used</p>
                  </div>
                  <ImageIcon className="w-10 h-10 text-purple-500 opacity-20 hover:opacity-40 transition-opacity" />
                </div>
              </div>

              <div 
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-orange-300 hover:scale-105"
                onClick={() => navigate('/superadmin/analytics')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Analytics</p>
                    <BarChart3 className="w-10 h-10 text-orange-600 mt-2" />
                    <p className="text-sm text-gray-500 mt-1">View insights</p>
                  </div>
                  <LineChart className="w-10 h-10 text-orange-500 opacity-20 hover:opacity-40 transition-opacity" />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md" onClick={() => navigate('/superadmin/users')}>
                  <div className="flex items-center space-x-3">
                    <UsersIcon className="w-6 h-6" />
                    <div>
                      <h3 className="font-medium">Manage Users</h3>
                      <p className="text-sm text-gray-500">Create and manage accounts</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md" onClick={() => navigate('/superadmin/tenants')}>
                  <div className="flex items-center space-x-3">
                    <Building2 className="w-6 h-6" />
                    <div>
                      <h3 className="font-medium">Tenant Management</h3>
                      <p className="text-sm text-gray-500">Configure tenant settings</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md" onClick={() => navigate('/superadmin/settings')}>
                  <div className="flex items-center space-x-3">
                    <SettingsIcon className="w-6 h-6" />
                    <div>
                      <h3 className="font-medium">System Settings</h3>
                      <p className="text-sm text-gray-500">System configuration</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md" onClick={() => navigate('/superadmin/roles')}>
                  <div className="flex items-center space-x-3">
                    <Shield className="w-6 h-6" />
                    <div>
                      <h3 className="font-medium">Role Management</h3>
                      <p className="text-sm text-gray-500">Define user roles</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md" onClick={() => navigate('/superadmin/media')}>
                  <div className="flex items-center space-x-3">
                    <Folder className="w-6 h-6" />
                    <div>
                      <h3 className="font-medium">Media Library</h3>
                      <p className="text-sm text-gray-500">Browse media files</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md" onClick={() => navigate('/superadmin/analytics')}>
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="w-6 h-6" />
                    <div>
                      <h3 className="font-medium">Analytics</h3>
                      <p className="text-sm text-gray-500">System insights</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* System Health & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Uptime</span>
                    <span className="text-sm font-medium">
                      {Math.floor((dashboardData.system?.uptime || 0) / 3600)}h {Math.floor(((dashboardData.system?.uptime || 0) % 3600) / 60)}m
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Memory</span>
                    <span className="text-sm font-medium">
                      {dashboardData.system?.memory?.used || 0}MB / {dashboardData.system?.memory?.total || 0}MB
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                </div>
                <div className="p-6">
                  {dashboardData.recentActivity && dashboardData.recentActivity.length > 0 ? (
                    <div className="space-y-3">
                      {dashboardData.recentActivity.slice(0, 3).map((activity, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium">{activity.user} {activity.action}</p>
                            <p className="text-xs text-gray-500">{new Date(activity.timestamp).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-4">No recent activity</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Show message when no data is available */}
        {!dashboardData && !loading && !error && (
          <div className="text-center py-12">
            <div className="mb-4 flex justify-center"><BarChart3 className="w-10 h-10 text-gray-400" /></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
            <p className="text-gray-500 mb-4">Dashboard data is not available at the moment.</p>
            <button 
              onClick={() => fetchDashboardData()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
            >
              Load Dashboard
            </button>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
}