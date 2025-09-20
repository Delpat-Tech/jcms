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
  getAll: (includeInactive = false) => api.get(`/api/users${includeInactive ? '?includeInactive=true' : ''}`),
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
  update: (id, data) => api.put(`/api/images/${id}`, data),
  delete: (id) => api.delete(`/api/images/${id}`),
  getThumbnail: (id) => api.get(`/api/images/${id}/thumbnail`),
  getMedium: (id) => api.get(`/api/images/${id}/medium`),
  getLarge: (id) => api.get(`/api/images/${id}/large`),
  getByUser: (userId) => api.get(`/api/users/${userId}/images`)
};

export const fileApi = {
  getAll: () => api.get('/api/files'),
  upload: (formData) => api.post('/api/files/upload-multiple', formData),
  uploadSingle: (formData) => api.post('/api/files/upload-single', formData),
  delete: (id) => api.delete(`/api/files/${id}`),
  getByUser: (userId) => api.get(`/api/users/${userId}/files`)
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
  getDashboard: () => api.get('/api/analytics/dashboard'),
  getUsers: () => api.get('/api/analytics/users'),
  getFiles: () => api.get('/api/analytics/files')
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
  deleteUser: (id) => api.delete(`/api/admin/users/${id}`)
};

export const superadminApi = {
  getUsers: () => api.get('/api/superadmin/users'),
  getRoles: () => api.get('/api/superadmin/roles'),
  createRole: (roleData) => api.post('/api/superadmin/roles', roleData),
  updateRole: (id, roleData) => api.put(`/api/superadmin/roles/${id}`, roleData),
  deleteRole: (id) => api.delete(`/api/superadmin/roles/${id}`),
  getDashboard: () => api.get('/api/superadmin/dashboard'),
  getStats: () => api.get('/api/superadmin/stats')
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

export { ApiError };
export default apiRequest;