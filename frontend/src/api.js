const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  // Don't set Content-Type for FormData
  if (options.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, config);
    
    // Handle 401 - redirect to login
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
      return;
    }
    
    // Handle other errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || `HTTP ${response.status}`,
        response.status,
        errorData
      );
    }
    
    return response;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Network error', 0, { originalError: error });
  }
};

// Convenience methods
export const api = {
  get: (endpoint) => apiRequest(endpoint),
  post: (endpoint, data) => apiRequest(endpoint, {
    method: 'POST',
    body: data instanceof FormData ? data : JSON.stringify(data)
  }),
  put: (endpoint, data) => apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' }),
  patch: (endpoint, data) => apiRequest(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
};

// Specific API functions
export const authApi = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  }
};

export const userApi = {
  getAll: (param = false) => {
    // Legacy boolean param: include inactive users when true
    if (typeof param === 'boolean') {
      const includeInactive = param;
      return api.get(`/api/users${includeInactive ? '?includeInactive=true' : ''}`);
    }
    // If a string is provided, treat it as a raw query string (e.g., 'status=inactive')
    if (typeof param === 'string' && param.trim().length > 0) {
      const qs = param.startsWith('?') ? param.slice(1) : param;
      return api.get(`/api/users?${qs}`);
    }
    // Default: no query
    return api.get('/api/users');
  },
  getById: (id) => api.get(`/api/users/${id}`),
  create: (userData) => api.post('/api/users', userData),
  update: (id, userData) => api.put(`/api/users/${id}`, userData),
  delete: (id, permanent = false) => api.delete(`/api/users/${id}${permanent ? '?permanent=true' : ''}`),
  reactivate: (id) => api.post(`/api/users/${id}/reactivate`)
};

export const imageApi = {
  getAll: (ownOnly = false) => api.get(`/api/images${ownOnly ? '?own=true' : ''}`),
  getById: (id) => api.get(`/api/images/${id}`),
  upload: (formData) => api.post('/api/images', formData),
  delete: (id) => api.delete(`/api/images/${id}`),
  getThumbnail: (id) => api.get(`/api/images/${id}/thumbnail`),
  getMedium: (id) => api.get(`/api/images/${id}/medium`),
  getLarge: (id) => api.get(`/api/images/${id}/large`),
  getByUser: (userId) => api.get(`/api/users/${userId}/images`),
  getRaw: () => api.get('/api/images?raw=true').then(res => res.json()),
  getRawById: (id) => api.get(`/api/images/${id}?raw=true`).then(res => res.json())
};

export const fileApi = {
  getAll: () => api.get('/api/files'),
  upload: (formData) => api.post('/api/files/upload-multiple', formData),
  uploadSingle: (formData) => api.post('/api/files/upload-single', formData),
  update: (id, data) => apiRequest(`/api/files/${id}`, {
    method: 'PUT',
    body: data instanceof FormData ? data : JSON.stringify(data)
  }),
  delete: (id) => api.delete(`/api/files/${id}`),
  getByUser: (userId) => api.get(`/api/users/${userId}/files`),
  getRaw: () => api.get('/api/files?raw=true').then(res => res.json()),
  getRawById: (id) => api.get(`/api/files/${id}?raw=true`).then(res => res.json())
};

export const tenantApi = {
  getAll: () => api.get('/api/tenants'),
  getById: (id) => api.get(`/api/tenants/${id}`),
  create: (tenantData) => api.post('/api/tenants', tenantData),
  delete: (id) => api.delete(`/api/tenants/${id}`),
  getUsers: (id) => api.get(`/api/tenants/${id}/users`),
  getStats: (id) => api.get(`/api/tenants/${id}/stats`),
  register: (data) => api.post('/api/tenants/register', data),
  uploadLogo: (id, formData) => api.post(`/api/tenants/${id}/logo`, formData),
  exportUsers: (id, format) => api.get(`/api/tenants/${id}/users/export?format=${format}`)
};

export const analyticsApi = {
  // Dashboard & sections
  getDashboard: () => api.get('/api/analytics/dashboard'),
  getUsers: (params = '') => api.get(`/api/analytics/users${params}`),
  getSystem: () => api.get('/api/analytics/system'),
  getSecurity: () => api.get('/api/analytics/security'),
  getContent: () => api.get('/api/analytics/content'),
  getPredictions: () => api.get('/api/analytics/predictions'),
  getPerformance: () => api.get('/api/analytics/performance'),
  // Backward compatibility
  getFiles: () => api.get('/api/analytics/content')
};

export const profileApi = {
  get: () => api.get('/api/profile'),
  update: (data) => api.put('/api/profile', data),
  changePassword: (data) => api.put('/api/profile/change-password', data),
  changeUsername: (data) => api.put('/api/profile/change-username', data)
};

export const notificationApi = {
  getAll: () => api.get('/api/notifications'),
  markAsRead: (id) => api.patch(`/api/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/api/notifications/mark-all-read'),
  delete: (id) => api.delete(`/api/notifications/${id}`)
};

export const activityApi = {
  getAll: () => api.get('/api/activity'),
  getByUser: (userId) => api.get(`/api/activity/user/${userId}`)
};

export const adminApi = {
  getUsers: () => api.get('/api/admin/users'),
  createUser: (userData) => api.post('/api/admin/users', userData),
  updateUser: (id, userData) => api.put(`/api/admin/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/api/admin/users/${id}`),
  getDashboard: () => api.get('/api/admin/dashboard'),
  getStats: () => api.get('/api/admin/stats')
  
};
export const superadminApi = {
  getUsers: () => api.get('/api/superadmin/users'),
  getRoles: () => api.get('/api/superadmin/roles'),
  createRole: (roleData) => api.post('/api/superadmin/roles', roleData),
  updateRole: (id, roleData) => api.put(`/api/superadmin/roles/${id}`, roleData),
  deleteRole: (id) => api.delete(`/api/superadmin/roles/${id}`),
  getDashboard: () => api.get('/api/superadmin/dashboard'),
  getStats: () => api.get('/api/superadmin/stats'),
  // Subscription management
  getUserSubscription: (userId) => api.get(`/api/superadmin/users/${userId}/subscription`),
  setUserSubscription: (userId, plan) => api.put(`/api/superadmin/users/${userId}/subscription`, { plan }),
  cancelUserSubscription: (userId) => api.delete(`/api/superadmin/users/${userId}/subscription`),
  getPlans: () => api.get('/api/superadmin/subscription-plans')
};

export const tenantAnalyticsApi = {
  getDashboard: (tenantId) => api.get(`/api/tenant-analytics/${tenantId}/dashboard`),
  getUsers: (tenantId) => api.get(`/api/tenant-analytics/${tenantId}/users`),
  getFiles: (tenantId) => api.get(`/api/tenant-analytics/${tenantId}/files`),
  getById: (tenantId) => api.get(`/api/tenant-analytics/${tenantId}`)
};

export const tenantBrandingApi = {
  get: (tenantId) => api.get(`/api/tenant-branding/${tenantId}`),
  update: (tenantId, data) => api.put(`/api/tenant-branding/${tenantId}`, data),
  reset: (tenantId) => api.post(`/api/tenant-branding/${tenantId}/reset`)
};

export const settingsApi = {
  get: () => api.get('/api/settings'),
  update: (data) => api.put('/api/settings', data),
  getSuperadmin: () => api.get('/api/superadmin/settings'),
  updateSuperadmin: (data) => api.put('/api/superadmin/settings', data)
};

export const tenantSwitchingApi = {
  switch: (tenantId) => api.post('/api/tenant-switching/switch', { tenantId }),
  getAvailable: () => api.get('/api/tenant-switching/available'),
  getMyContext: () => api.get('/api/tenant-switching/my/context'),
  getMyTenants: () => api.get('/api/tenant-switching/my/tenants'),
  switchTenant: (tenantId) => api.post('/api/tenant-switching/my/switch', { tenantId })
};

export const tenantAnalyticsApiWithTimeframe = {
  getDashboard: (tenantId, timeframe = '7d') => api.get(`/api/tenant-analytics/${tenantId}/dashboard?timeframe=${timeframe}`)
};

export const imageProcessingApi = {
  getSize: (id, size) => api.get(`/api/images/${id}/size/${size}`)
};

export const contentApi = {
  getAll: () => api.get('/api/content'),
  getById: (id) => api.get(`/api/content/${id}`),
  getByStatus: (status) => api.get(`/api/content/status/${status}`),
  create: (contentData) => api.post('/api/content', contentData),
  update: (id, contentData) => api.put(`/api/content/${id}`, contentData),
  delete: (id) => api.delete(`/api/content/${id}`),
  publish: (id) => api.post(`/api/content/${id}/publish`),
  schedule: (id, data) => api.post(`/api/content/${id}/schedule`, data)
};

export const uploadApi = {
  image: (formData) => api.post('/api/upload/image', formData)
};

export const editorStatsApi = {
  getDashboard: () => api.get('/api/editor/dashboard'),
  getContentStats: () => api.get('/api/editor/content-stats'),
  getRecentActivity: () => api.get('/api/editor/recent-activity')
};

export const helpApi = {
  sendContact: (data) => api.post('/api/help/contact', data),
  getArticles: (query = '') => api.get(`/api/help/articles${query ? `?search=${query}` : ''}`),
  getFAQ: () => api.get('/api/help/faq')
};

export const subscriptionApi = {
  getPlans: () => api.get('/api/subscription/prices'),
  getStatus: () => api.get('/api/subscription/status'),
  createOrder: (subtype) => api.post('/api/subscription/create-order', { subtype }),
  verifyPayment: (paymentData) => api.post('/api/subscription/verify-payment', paymentData)
};

export const imageManagementApi = {
  // Upload images
  uploadImages: (formData) => apiRequest('/api/image-management/upload', {
    method: 'POST',
    body: formData
  }),
  
  // Get images for content page
  getContentPageImages: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/api/image-management/content-page${queryString ? `?${queryString}` : ''}`);
  },
  
  // Get image analytics
  getAnalytics: () => api.get('/api/image-management/analytics'),
  
  // Get individual image
  getImageById: (id) => api.get(`/api/image-management/${id}`),
  
  // Update image metadata
  updateImageMetadata: (id, data) => api.patch(`/api/image-management/${id}/metadata`, data),
  
  // Visibility management
  makeImagesPublic: (imageIds) => api.post('/api/image-management/make-public', { imageIds }),
  makeImagesPrivate: (imageIds) => api.post('/api/image-management/make-private', { imageIds }),
  
  // Bulk operations
  deleteImages: (imageIds) => apiRequest('/api/image-management/bulk-delete', {
    method: 'DELETE',
    body: JSON.stringify({ imageIds }),
    headers: { 'Content-Type': 'application/json' }
  }),
  
  // System status
  getR2Status: () => api.get('/api/image-management/system/r2-status'),
  
  // Collection management
  createCollection: (data) => api.post('/api/image-management/collections', data),
  getCollections: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/api/image-management/collections${queryString ? `?${queryString}` : ''}`);
  },
  getCollectionById: (id, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/api/image-management/collections/${id}${queryString ? `?${queryString}` : ''}`);
  },
  updateCollection: (id, data) => api.put(`/api/image-management/collections/${id}`, data),
  deleteCollection: (id) => api.delete(`/api/image-management/collections/${id}`),
  makeCollectionPublic: (id) => api.post(`/api/image-management/collections/${id}/make-public`),
  makeCollectionPrivate: (id) => api.post(`/api/image-management/collections/${id}/make-private`),
  addImagesToCollection: (id, imageIds) => api.post(`/api/image-management/collections/${id}/add-images`, { imageIds }),
  
  // Cloudflare Tunnel endpoints
  startTunnel: () => api.post('/api/image-management/tunnel/start'),
  stopTunnel: () => api.post('/api/image-management/tunnel/stop'),
  getTunnelStatus: () => api.get('/api/image-management/tunnel/status'),
  makeCollectionPublicViaTunnel: (id) => api.post(`/api/image-management/tunnel/collections/${id}/make-public`),
  makeCollectionPrivateViaTunnel: (id) => api.post(`/api/image-management/tunnel/collections/${id}/make-private`),
  downloadCollectionZip: (id) => fetch(`${API_BASE_URL}/api/image-management/tunnel/collections/${id}/download-zip`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  })
};

export { ApiError };
export default apiRequest;
