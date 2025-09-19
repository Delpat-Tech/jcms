import React, { useEffect, useState } from 'react';
import AdminLayout from '../layout.tsx';
import Button from "../../components/ui/Button.jsx";
import { userApi, imageApi, activityApi } from '../../api';

export default function AdminOverview() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ users: 0, images: 0, files: 0, storage: '0 MB' });
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch users count
      const usersRes = await userApi.getAll();
      const usersData = await usersRes.json();
      
      // Fetch images count
      const imagesRes = await imageApi.getAll();
      const imagesData = await imagesRes.json();
      
      // Fetch activity logs
      const activityRes = await activityApi.getAll();
      const activityData = await activityRes.json();
      
      setStats({
        users: usersData.users?.length || 0,
        images: imagesData.images?.length || 0,
        files: 0 // Will be updated when files API is called
      });
      
      setActivities(activityData.activities?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  return (
    <AdminLayout title="Dashboard Overview">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <Button>+ New Content</Button>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h3 className="text-sm font-medium text-gray-500">Users</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.users}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h3 className="text-sm font-medium text-gray-500">Images</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.images}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h3 className="text-sm font-medium text-gray-500">Files</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.files}</p>
          </div>
        </div>
        
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-6">
            {activities.length > 0 ? (
              <div className="space-y-3">
                {activities.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <div className="flex items-center">
                      <span className="text-gray-400 mr-2">•</span>
                      <span className="text-sm text-gray-700">
                        {activity.username} {activity.action?.toLowerCase()} {activity.resource}
                        {activity.resourceId && ` (${activity.resourceId.slice(-8)})`}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(activity.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No recent activity
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
