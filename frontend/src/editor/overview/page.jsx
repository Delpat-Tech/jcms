import React, { useEffect, useState, useMemo } from 'react';
import { Hand, Clock, FileText, CheckCircle2, Image as ImageIcon, File as FileIcon, PenLine, Palette, BookOpen, Upload, Folder, AlertTriangle, FolderOpen, Settings as SettingsIcon, CircleHelp, Building2, User as UserIcon, RotateCw } from 'lucide-react';
import UserLayout from '../layout.jsx';
import Button from '../../components/ui/Button.jsx';
import TrioLoader from '../../components/ui/TrioLoader.jsx';
import DashboardWidget, { StatsWidget, ListWidget } from '../../components/common/DashboardWidget.jsx';
import { Link } from 'react-router-dom';
import { imageApi, fileApi, tenantSwitchingApi, editorStatsApi } from '../../api';

export default function UserOverview() {
  const [user, setUser] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Editor-specific stats
  const [editorStats, setEditorStats] = useState({
    totalContent: 0,
    publishedContent: 0,
    draftContent: 0,
    scheduledContent: 0,
    totalMedia: 0,
    recentActivity: []
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  // Media stats (fallback)
  const [imagesCount, setImagesCount] = useState(0);
  const [filesCount, setFilesCount] = useState(0);
  const [mediaLoading, setMediaLoading] = useState(true);
  const [mediaError, setMediaError] = useState(null);

  // Recent items (editor-accessible)
  const [recentImages, setRecentImages] = useState([]);
  const [recentFiles, setRecentFiles] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [recentError, setRecentError] = useState(null);

  // Tenant context
  const [currentTenant, setCurrentTenant] = useState(null);
  const [myTenants, setMyTenants] = useState([]);
  const [tenantLoading, setTenantLoading] = useState(true);
  const [tenantError, setTenantError] = useState(null);

  const apiBase = useMemo(() => (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) ? process.env.REACT_APP_API_URL : '', []);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
    fetchEditorStats();
    fetchMediaCountsAndRecent();
    fetchTenantContext();

    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Auto-refresh data every 5 minutes
    const dataInterval = setInterval(() => {
      fetchEditorStats();
      fetchMediaCountsAndRecent();
    }, 300000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(dataInterval);
    };
  }, []);

  const authHeaders = () => ({ 'Authorization': `Bearer ${localStorage.getItem('token')}` });

  const fetchEditorStats = async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const response = await editorStatsApi.getDashboard();
      const data = await response.json();
      if (data.success) {
        setEditorStats({
          totalContent: data.data.contentStats.total,
          publishedContent: data.data.contentStats.published,
          draftContent: data.data.contentStats.draft,
          scheduledContent: data.data.contentStats.scheduled,
          totalMedia: data.data.mediaStats.total,
          recentActivity: data.data.recentActivity
        });
      }
    } catch (error) {
      console.error('Error fetching editor stats:', error);
      setStatsError('Failed to load dashboard statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchMediaCountsAndRecent = async () => {
    setMediaLoading(true);
    setRecentLoading(true);
    setMediaError(null);
    setRecentError(null);
    try {
      // Images (supports ?own=true per imagesRoutes)
      const imgRes = await imageApi.getAll(true);
      const imgData = await imgRes.json();
      const imgs = Array.isArray(imgData) ? imgData : (imgData.images || []);
      setImagesCount(imgs.length);
      // Sort by createdAt desc if present
      const sortedImgs = [...imgs].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setRecentImages(sortedImgs.slice(0, 5));

      // Files (no explicit own filter exposed; fallback to all and sort)
      const fileRes = await fileApi.getAll();
      const fileJson = await fileRes.json();
      const files = Array.isArray(fileJson) ? fileJson : (fileJson.files || []);
      setFilesCount(files.length);
      const sortedFiles = [...files].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setRecentFiles(sortedFiles.slice(0, 5));
    } catch (e) {
      setMediaError('Failed to load media stats');
      setRecentError('Failed to load recent items');
    } finally {
      setMediaLoading(false);
      setRecentLoading(false);
    }
  };

  const fetchTenantContext = async () => {
    setTenantLoading(true);
    setTenantError(null);
    try {
      // Current tenant context
      const ctxRes = await tenantSwitchingApi.getMyContext();
      const ctxData = await ctxRes.json();
      console.log('Tenant context response:', ctxData); // DEBUG
      if (ctxData && ctxData.success !== false) {
        setCurrentTenant(ctxData.tenant || ctxData.data || ctxData);
      }
      // My tenants
      const tRes = await tenantSwitchingApi.getMyTenants();
      const tData = await tRes.json();
      console.log('My tenants response:', tData); // DEBUG
      const tenants = Array.isArray(tData) ? tData : (tData.tenants || tData.data || []);
      setMyTenants(tenants);
    } catch (e) {
      console.error('Error loading tenant info:', e); // DEBUG
      setTenantError('Failed to load tenant info');
    } finally {
      setTenantLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const recentActivityData = useMemo(() => {
    if (editorStats.recentActivity && editorStats.recentActivity.length > 0) {
      return editorStats.recentActivity.map(activity => ({
        key: activity._id || activity.id,
        type: activity.type || 'content',
        title: activity.title || activity.action || 'Activity',
        date: activity.createdAt || activity.date,
        icon: activity.type === 'content' ? '📝' : activity.type === 'media' ? '🖼️' : '📊'
      }));
    }
    // Fallback to combined recent items
    const mapImage = (img) => ({
      key: img._id || img.id,
      type: 'image',
      title: img.originalName || img.name || 'Image',
      date: img.createdAt,
      icon: '🖼️'
    });
    const mapFile = (f) => ({
      key: f._id || f.id,
      type: 'file',
      title: f.originalName || f.name || 'File',
      date: f.createdAt,
      icon: '📁'
    });
    const combined = [...recentImages.map(mapImage), ...recentFiles.map(mapFile)];
    return combined
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .slice(0, 5);
  }, [editorStats.recentActivity, recentImages, recentFiles]);

  return (
    <UserLayout title="Editor Dashboard">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 mb-8 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {getGreeting()}, {user?.username || 'Editor'}! <Hand className="inline w-6 h-6 ml-1 align-[-2px]" />
            </h1>
            <p className="text-blue-100 text-lg">
              {currentTime.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            <p className="text-blue-200 text-sm mt-1">
              Ready to create amazing content?
            </p>
          </div>
          <div className="hidden md:block">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-2xl mb-2"><Clock className="w-6 h-6" /></div>
              <div className="text-sm font-medium">
                {currentTime.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Content</p>
              <p className="text-3xl font-bold text-blue-600">
                {statsLoading ? <TrioLoader size="24" color="#2563eb" /> : editorStats.totalContent}
              </p>
              <p className="text-xs text-gray-500 mt-1">Articles & pages</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <FileText className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Published</p>
              <p className="text-3xl font-bold text-green-600">
                {statsLoading ? <TrioLoader size="24" color="#16a34a" /> : editorStats.publishedContent}
              </p>
              <p className="text-xs text-gray-500 mt-1">Live content</p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Drafts</p>
              <p className="text-3xl font-bold text-yellow-600">
                {statsLoading ? <TrioLoader size="24" color="#ca8a04" /> : editorStats.draftContent}
              </p>
              <p className="text-xs text-gray-500 mt-1">Work in progress</p>
            </div>
            <div className="bg-yellow-100 rounded-full p-3">
              <FileIcon className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Media</p>
              <p className="text-3xl font-bold text-purple-600">
                {statsLoading ? <TrioLoader size="24" color="#9333ea" /> : editorStats.totalMedia}
              </p>
              <p className="text-xs text-gray-500 mt-1">Images & files</p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <ImageIcon className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Content Creation */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Content Creation</h2>
            <PenLine className="w-6 h-6" />
          </div>
          <div className="space-y-4">
            <Link to="/user/content" className="block">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:scale-[1.02] group">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">New Article</h3>
                    <p className="text-sm text-gray-600">Start writing your next masterpiece</p>
                  </div>
                  <div className="bg-blue-100 rounded-full p-2 group-hover:bg-blue-200 transition-colors">
                    <FileText className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </Link>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/user/content" className="bg-gray-50 hover:bg-gray-100 rounded-lg p-3 text-center transition-all duration-200 hover:scale-105 group">
                <div className="text-lg mb-1"><FileIcon className="w-5 h-5 inline" /></div>
                <div className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Pages</div>
              </Link>
              <Link to="/user/content" className="bg-gray-50 hover:bg-gray-100 rounded-lg p-3 text-center transition-all duration-200 hover:scale-105 group">
                <div className="text-lg mb-1"><Palette className="w-5 h-5 inline" /></div>
                <div className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Templates</div>
              </Link>
            </div>
          </div>
        </div>

        {/* Media Library */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Media Library</h2>
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="space-y-4">
            <Link to="/user/media" className="block">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:scale-[1.02] group">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">Upload Media</h3>
                    <p className="text-sm text-gray-600">Add images, documents, and files</p>
                  </div>
                  <div className="bg-green-100 rounded-full p-2 group-hover:bg-green-200 transition-colors">
                    <Upload className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </Link>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/user/media" className="bg-gray-50 hover:bg-gray-100 rounded-lg p-3 text-center transition-all duration-200 hover:scale-105 group">
                <div className="text-lg mb-1"><ImageIcon className="w-5 h-5 inline" /></div>
                <div className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Gallery</div>
              </Link>
              <Link to="/user/media" className="bg-gray-50 hover:bg-gray-100 rounded-lg p-3 text-center transition-all duration-200 hover:scale-105 group">
                <div className="text-lg mb-1"><Folder className="w-5 h-5 inline" /></div>
                <div className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Files</div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity & Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Items */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
            <button 
              onClick={() => { fetchEditorStats(); fetchMediaCountsAndRecent(); }}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              disabled={statsLoading || recentLoading}
            >
              {(statsLoading || recentLoading) ? <TrioLoader size="16" color="#6b7280" /> : <RotateCw className="w-4 h-4" />}
            </button>
          </div>
          <div className="space-y-3">
            {(statsError || recentError) ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-yellow-500" />
                <p className="text-gray-500">{statsError || recentError}</p>
              </div>
            ) : recentActivityData.length > 0 ? (
              recentActivityData.map((item, idx) => (
                <div key={item.key || idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{item.icon}</span>
                    <div>
                      <p className="font-medium text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-500 capitalize">{item.type}</p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {item.date ? new Date(item.date).toLocaleDateString() : ''}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <FolderOpen className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500">No recent activity</p>
                <p className="text-sm text-gray-400">Start creating content to see your activity here</p>
              </div>
            )}
          </div>
        </div>

        {/* Tenant & Profile Info */}
        <div className="space-y-6">
          {/* Tenant Context */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Workspace</h3>
              <span className="text-xl"><Building2 className="w-5 h-5" /></span>
            </div>
            {tenantLoading ? (
              <div className="text-center py-4">
                <TrioLoader size="24" color="#6b7280" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-purple-700">Current Tenant</p>
                  <p className="text-lg font-bold text-purple-900">
                    {currentTenant?.name || currentTenant?.tenantName || 'Default'}
                  </p>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Access to <span className="font-medium">{myTenants.length}</span> tenant{myTenants.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Profile & Settings */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Account</h3>
              <span className="text-xl"><UserIcon className="w-5 h-5" /></span>
            </div>
            <div className="space-y-4">
              <Link to="/user/profile" className="block">
                <div className="bg-gray-50 hover:bg-gray-100 rounded-lg p-3 transition-all duration-200 hover:scale-[1.02] group">
                  <div className="flex items-center space-x-3">
                    <div className="bg-indigo-100 rounded-full p-2"><SettingsIcon className="w-4 h-4" /></div>
                    <div>
                      <p className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">Profile Settings</p>
                      <p className="text-xs text-gray-500">Update your information</p>
                    </div>
                  </div>
                </div>
              </Link>
              <Link to="/user/help" className="block">
                <div className="bg-gray-50 hover:bg-gray-100 rounded-lg p-3 transition-all duration-200 hover:scale-[1.02] group">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 rounded-full p-2"><CircleHelp className="w-4 h-4" /></div>
                    <div>
                      <p className="font-medium text-gray-900 group-hover:text-green-600 transition-colors">Help & Support</p>
                      <p className="text-xs text-gray-500">Get assistance</p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}