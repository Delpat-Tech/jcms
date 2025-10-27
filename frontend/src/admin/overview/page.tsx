import React, { useEffect, useState } from 'react';
import AdminLayout from '../layout.tsx';
import Button from '../../components/ui/Button.jsx';
import { adminApi, userApi, imageApi, fileApi, contentApi, activityApi } from '../../api';
import TrioLoader from '../../components/ui/TrioLoader.jsx';
import { useNavigate } from 'react-router-dom';
import { RefreshCcw, AlertTriangle, Users as UsersIcon, FileText, Image as ImageIcon, BarChart3, LineChart, Settings as SettingsIcon, Folder } from 'lucide-react';

export default function AdminOverview() {
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
      
      // Use admin dashboard API instead of individual calls
      const response = await adminApi.getDashboard();
      const data = await response.json();
      
      console.log('Admin dashboard response:', data);
      
      if (data.success) {
        console.log('Dashboard data overview:', data.data.overview);
        setDashboardData(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch dashboard data');
      }
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
      <AdminLayout title="Admin Overview">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <TrioLoader size="50" color="#3b82f6" />
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Admin Overview">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tenant Overview</h1>
            <p className="text-gray-600">Welcome back, {user?.username}</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 flex items-center space-x-2 disabled:opacity-50"
            >
              {refreshing ? <TrioLoader size="16" color="#6b7280" /> : <RefreshCcw className="w-4 h-4 text-gray-500" />}
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
              <div className="flex-1">
                <p className="text-red-700">Error loading dashboard: {error}</p>
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

        {dashboardData && (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div 
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-blue-300 hover:scale-105"
                onClick={() => navigate('/admin/users')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tenant Users</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{dashboardData.overview?.totalUsers || 0}</p>
                    <p className="text-sm text-gray-500 mt-1">{dashboardData.overview?.activeUsers || 0} active</p>
                  </div>
                  <UsersIcon className="w-12 h-12 text-blue-500 opacity-20 hover:opacity-40 transition-opacity" />
                </div>
              </div>

              <div 
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-green-300 hover:scale-105"
                onClick={() => navigate('/content')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Collections</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">{dashboardData.overview?.totalCollections || 0}</p>
                    <p className="text-sm text-gray-500 mt-1">{dashboardData.overview?.publicCollections || 0} public</p>
                  </div>
                  <Folder className="w-12 h-12 text-green-500 opacity-20 hover:opacity-40 transition-opacity" />
                </div>
              </div>

              <div 
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-purple-300 hover:scale-105"
                onClick={() => navigate('/admin/media')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Media Files</p>
                    <p className="text-3xl font-bold text-purple-600 mt-2">{(dashboardData.overview?.totalImages || 0) + (dashboardData.overview?.totalFiles || 0)}</p>
                    <p className="text-sm text-gray-500 mt-1">{dashboardData.overview?.totalStorage || 0}MB used</p>
                    <p className="text-xs text-gray-400 mt-1">Images: {dashboardData.overview?.totalImages || 0}, Files: {dashboardData.overview?.totalFiles || 0}</p>
                  </div>
                  <ImageIcon className="w-12 h-12 text-purple-500 opacity-20 hover:opacity-40 transition-opacity" />
                </div>
              </div>

              <div 
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-orange-300 hover:scale-105"
                onClick={() => navigate('/admin/analytics')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Analytics</p>
                    <BarChart3 className="w-10 h-10 text-orange-600 mt-2" />
                    <p className="text-sm text-gray-500 mt-1">View insights</p>
                  </div>
                  <LineChart className="w-12 h-12 text-orange-500 opacity-20 hover:opacity-40 transition-opacity" />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md" onClick={() => navigate('/admin/users')}>
                  <div className="flex items-center space-x-3">
                    <UsersIcon className="w-6 h-6 text-gray-700" />
                    <div>
                      <h3 className="font-medium">Manage Users</h3>
                      <p className="text-sm text-gray-500">Create editors & viewers</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md" onClick={() => navigate('/admin/content')}>
                  <div className="flex items-center space-x-3">
                    <FileText className="w-6 h-6 text-gray-700" />
                    <div>
                      <h3 className="font-medium">Content Management</h3>
                      <p className="text-sm text-gray-500">Create and publish content</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md" onClick={() => navigate('/admin/media')}>
                  <div className="flex items-center space-x-3">
                    <Folder className="w-6 h-6 text-gray-700" />
                    <div>
                      <h3 className="font-medium">Media Library</h3>
                      <p className="text-sm text-gray-500">Upload and manage files</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md" onClick={() => navigate('/admin/analytics')}>
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="w-6 h-6 text-gray-700" />
                    <div>
                      <h3 className="font-medium">Analytics</h3>
                      <p className="text-sm text-gray-500">Tenant insights</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md" onClick={() => navigate('/admin/profile')}>
                  <div className="flex items-center space-x-3">
                    <SettingsIcon className="w-6 h-6 text-gray-700" />
                    <div>
                      <h3 className="font-medium">Profile Settings</h3>
                      <p className="text-sm text-gray-500">Update your profile</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Distribution</h3>
                <div className="space-y-3">
                  {Object.entries(dashboardData.usersByRole || {}).map(([role, count]) => (
                    <div key={role} className="flex justify-between">
                      <span className="text-sm text-gray-600 capitalize">{role}s</span>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                </div>
                <div className="p-6">
                  {dashboardData.recentActivity && dashboardData.recentActivity.length > 0 ? (
                    <div className="space-y-3">
                      {dashboardData.recentActivity.map((activity, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium">{activity.username} {activity.action?.toLowerCase()} {activity.resource}</p>
                            <p className="text-xs text-gray-500">{new Date(activity.createdAt).toLocaleString()}</p>
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

        {!dashboardData && !loading && !error && (
          <div className="text-center py-12">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
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
    </AdminLayout>
  );
}
