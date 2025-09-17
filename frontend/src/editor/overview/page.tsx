// @ts-nocheck
import React, { useEffect, useState, useMemo } from 'react';
import UserLayout from '../layout.tsx';
import Button from '../../components/ui/Button.jsx';
import DashboardWidget, { StatsWidget, ListWidget } from '../../components/common/DashboardWidget.jsx';
import { Link } from 'react-router-dom';

export default function UserOverview() {
  const [user, setUser] = useState(null);

  // Media stats
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
    fetchMediaCountsAndRecent();
    fetchTenantContext();
  }, []);

  const authHeaders = () => ({ 'Authorization': `Bearer ${localStorage.getItem('token')}` });

  const fetchMediaCountsAndRecent = async () => {
    setMediaLoading(true);
    setRecentLoading(true);
    setMediaError(null);
    setRecentError(null);
    try {
      // Images (supports ?own=true per imagesRoutes)
      const imgRes = await fetch(`${apiBase}/api/images?own=true`, { headers: authHeaders() });
      const imgData = await imgRes.json();
      const imgs = Array.isArray(imgData) ? imgData : (imgData.images || []);
      setImagesCount(imgs.length);
      // Sort by createdAt desc if present
      const sortedImgs = [...imgs].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setRecentImages(sortedImgs.slice(0, 5));

      // Files (no explicit own filter exposed; fallback to all and sort)
      const fileRes = await fetch(`${apiBase}/api/files`, { headers: authHeaders() });
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
      const ctxRes = await fetch(`${apiBase}/api/tenant-switch/my/context`, { headers: authHeaders() });
      const ctxData = await ctxRes.json();
      if (ctxData && ctxData.success !== false) {
        setCurrentTenant(ctxData.tenant || ctxData.data || ctxData);
      }
      // My tenants
      const tRes = await fetch(`${apiBase}/api/tenant-switch/my/tenants`, { headers: authHeaders() });
      const tData = await tRes.json();
      const tenants = Array.isArray(tData) ? tData : (tData.tenants || tData.data || []);
      setMyTenants(tenants);
    } catch (e) {
      setTenantError('Failed to load tenant info');
    } finally {
      setTenantLoading(false);
    }
  };

  const recentItemsCombined = useMemo(() => {
    const mapImage = (img) => ({
      key: img._id || img.id,
      type: 'image',
      title: img.originalName || img.name || 'Image',
      date: img.createdAt,
    });
    const mapFile = (f) => ({
      key: f._id || f.id,
      type: 'file',
      title: f.originalName || f.name || 'File',
      date: f.createdAt,
    });
    const combined = [...recentImages.map(mapImage), ...recentFiles.map(mapFile)];
    return combined
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .slice(0, 5);
  }, [recentImages, recentFiles]);

  return (
    <UserLayout title="Editor Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatsWidget title="Images" value={imagesCount} loading={mediaLoading} error={mediaError} />
        <StatsWidget title="Files" value={filesCount} loading={mediaLoading} error={mediaError} />
        <StatsWidget title="My Tenants" value={myTenants.length} loading={tenantLoading} error={tenantError} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <DashboardWidget title="My Content" variant="list" className="h-full" actions={<Link to="/user/content"><Button size="sm">Go to Content</Button></Link>}>
          <div className="flex flex-col gap-3">
            <div className="text-gray-600 text-sm">Quickly access your drafts, published, and scheduled content.</div>
            <div className="flex flex-wrap gap-2">
              <Link to="/user/content"><Button size="sm" variant="secondary">Drafts</Button></Link>
              <Link to="/user/content"><Button size="sm" variant="secondary">Published</Button></Link>
              <Link to="/user/content"><Button size="sm" variant="secondary">Scheduled</Button></Link>
            </div>
          </div>
        </DashboardWidget>
        <DashboardWidget title="Content Creation" variant="default" actions={<Link to="/user/content"><Button size="sm">New Article</Button></Link>}>
          <div className="text-gray-500 text-sm">Start a new article, page, or template. Use the editor for authoring and refinement.</div>
        </DashboardWidget>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <DashboardWidget title="Media Library" variant="list" actions={<Link to="/user/media"><Button size="sm">Open Media</Button></Link>}>
          <div className="text-gray-500 text-sm">Manage your images, files, and bulk uploads. Access personal and shared assets.</div>
        </DashboardWidget>
        <DashboardWidget title="Profile & Settings" variant="default" actions={<Link to="/user/profile"><Button size="sm">Profile</Button></Link>}>
          <div className="text-gray-500 text-sm">Update your personal info, password, and preferences. Self-service profile management.</div>
        </DashboardWidget>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <ListWidget
          title="Recent Items"
          items={recentItemsCombined.map(item => ({ key: item.key, content: `${item.type === 'image' ? '🖼️' : '📁'} ${item.title}`, date: item.date }))}
          loading={recentLoading}
          error={recentError}
          maxItems={5}
          renderItem={(item, idx) => (
            <div key={item.key || idx} className="flex items-center justify-between py-2 px-2 border-b last:border-b-0">
              <span className="text-sm text-gray-700">{item.content}</span>
              <span className="text-xs text-gray-400">{item.date ? new Date(item.date).toLocaleString() : ''}</span>
            </div>
          )}
          emptyMessage="No recent items."
          onRefresh={fetchMediaCountsAndRecent}
        />
        <DashboardWidget title="Tenant Context" variant="list" loading={tenantLoading} error={tenantError} onRefresh={fetchTenantContext}>
          <div className="text-sm text-gray-600 mb-3">
            Current Tenant: <span className="font-medium text-gray-900">{currentTenant?.name || currentTenant?.tenantName || 'N/A'}</span>
          </div>
          <div className="text-xs text-gray-500 mb-2">You have access to {myTenants.length} tenant{myTenants.length === 1 ? '' : 's'}.</div>
          <div className="border rounded-md overflow-hidden">
            {myTenants.slice(0, 5).map((t) => (
              <div key={t._id || t.id} className="px-3 py-2 text-sm border-b last:border-b-0 flex items-center justify-between">
                <span className="text-gray-700">{t.name || t.tenantName || t.slug || 'Tenant'}</span>
              </div>
            ))}
            {myTenants.length === 0 && (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">No additional tenants</div>
            )}
          </div>
        </DashboardWidget>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <DashboardWidget title="Help & Support" variant="default">
          <div className="text-gray-500 text-sm mb-2">Access documentation, tutorials, FAQ, or contact support.</div>
          <ul className="list-disc pl-5 text-sm text-indigo-700">
            <li><a href="https://docs.yourcms.com" target="_blank" rel="noopener noreferrer">Documentation</a></li>
            <li><a href="https://docs.yourcms.com/tutorials" target="_blank" rel="noopener noreferrer">Tutorials</a></li>
            <li><a href="https://docs.yourcms.com/faq" target="_blank" rel="noopener noreferrer">FAQ</a></li>
            <li><a href="mailto:support@yourcms.com">Contact Support</a></li>
          </ul>
        </DashboardWidget>
      </div>
    </UserLayout>
  );
}
