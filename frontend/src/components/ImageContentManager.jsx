// components/ImageContentManager.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Button from './ui/Button.jsx';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ImageContentManager = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedImages, setSelectedImages] = useState(new Set());
  const [filters, setFilters] = useState({
    visibility: '',
    search: '',
    project: '',
    tags: '',
    dateFrom: '',
    dateTo: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [r2Status, setR2Status] = useState({ configured: false });
  const [analytics, setAnalytics] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [publicUrls, setPublicUrls] = useState([]);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  const apiCall = useCallback(async (endpoint, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }
    
    return response.json();
  }, [token]);

  const loadImages = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });

      const result = await apiCall(`/api/image-management/content-page?${queryParams}`);
      
      setImages(result.data.images);
      setPagination(prev => ({
        ...prev,
        total: result.data.pagination.total,
        pages: result.data.pagination.pages
      }));
    } catch (error) {
      console.error('Failed to load images:', error);
      alert('Failed to load images: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [apiCall, filters, pagination.page, pagination.limit]);

  const loadR2Status = useCallback(async () => {
    try {
      const result = await apiCall('/api/image-management/system/r2-status');
      setR2Status(result.data);
    } catch (error) {
      console.error('Failed to load R2 status:', error);
    }
  }, [apiCall]);

  const loadAnalytics = useCallback(async () => {
    try {
      const result = await apiCall('/api/image-management/analytics');
      setAnalytics(result.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  }, [apiCall]);

  useEffect(() => {
    loadImages();
    loadR2Status();
  }, [loadImages, loadR2Status]);

  const handleUpload = async (files, metadata) => {
    try {
      setUploading(true);
      const formData = new FormData();
      
      Array.from(files).forEach(file => {
        formData.append('images', file);
      });
      
      if (metadata.title) formData.append('title', metadata.title);
      if (metadata.project) formData.append('project', metadata.project);
      if (metadata.tags) formData.append('tags', JSON.stringify(metadata.tags));
      if (metadata.notes) formData.append('notes', JSON.stringify(metadata.notes));
      if (metadata.format) formData.append('format', metadata.format);
      if (metadata.quality) formData.append('quality', metadata.quality);

      const response = await fetch(`${API_BASE_URL}/api/image-management/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`${result.data.success.length} image(s) uploaded successfully!`);
        setShowUploadModal(false);
        loadImages();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleMakePublic = async () => {
    if (selectedImages.size === 0) {
      alert('Please select images to make public');
      return;
    }

    if (!r2Status.configured) {
      alert('Cloudflare R2 is not configured. Cannot make images public.');
      return;
    }

    try {
      const imageIds = Array.from(selectedImages);
      const result = await apiCall('/api/image-management/make-public', {
        method: 'POST',
        body: JSON.stringify({ imageIds })
      });

      if (result.success) {
        setPublicUrls(result.data.publicUrls);
        alert(`${result.data.summary.successful} image(s) made public successfully!`);
        setSelectedImages(new Set());
        loadImages();
      } else {
        alert(`Operation completed with issues: ${result.message}`);
        if (result.data.publicUrls.length > 0) {
          setPublicUrls(result.data.publicUrls);
        }
        loadImages();
      }
    } catch (error) {
      console.error('Failed to make images public:', error);
      alert('Failed to make images public: ' + error.message);
    }
  };

  const handleMakePrivate = async () => {
    if (selectedImages.size === 0) {
      alert('Please select images to make private');
      return;
    }

    try {
      const imageIds = Array.from(selectedImages);
      const result = await apiCall('/api/image-management/make-private', {
        method: 'POST',
        body: JSON.stringify({ imageIds })
      });

      if (result.success) {
        alert(`${result.data.summary.successful} image(s) made private successfully!`);
        setSelectedImages(new Set());
        loadImages();
      } else {
        alert(`Operation completed with issues: ${result.message}`);
        loadImages();
      }
    } catch (error) {
      console.error('Failed to make images private:', error);
      alert('Failed to make images private: ' + error.message);
    }
  };

  const handleDelete = async () => {
    if (selectedImages.size === 0) {
      alert('Please select images to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedImages.size} image(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      const imageIds = Array.from(selectedImages);
      const result = await apiCall('/api/image-management/bulk-delete', {
        method: 'DELETE',
        body: JSON.stringify({ imageIds })
      });

      if (result.success) {
        alert(`${result.data.summary.successful} image(s) deleted successfully!`);
        setSelectedImages(new Set());
        loadImages();
      } else {
        alert(`Operation completed with issues: ${result.message}`);
        loadImages();
      }
    } catch (error) {
      console.error('Failed to delete images:', error);
      alert('Failed to delete images: ' + error.message);
    }
  };

  const toggleImageSelection = (imageId) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(imageId)) {
      newSelected.delete(imageId);
    } else {
      newSelected.add(imageId);
    }
    setSelectedImages(newSelected);
  };

  const selectAllImages = () => {
    if (selectedImages.size === images.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(images.map(img => img._id)));
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Image Content Manager</h1>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowAnalytics(!showAnalytics)}
              variant="secondary"
              size="sm"
            >
              {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
            </Button>
            <Button
              onClick={() => setShowUploadModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Upload Images
            </Button>
          </div>
        </div>

        {/* R2 Status Banner */}
        <div className={`p-3 rounded-lg mb-4 ${r2Status.configured ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-3 ${r2Status.configured ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span className={`text-sm font-medium ${r2Status.configured ? 'text-green-800' : 'text-yellow-800'}`}>
              {r2Status.message}
            </span>
          </div>
        </div>
      </div>

      {/* Analytics Panel */}
      {showAnalytics && analytics && (
        <div className="bg-white rounded-lg border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Analytics Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{analytics.summary.totalImages}</div>
              <div className="text-sm text-blue-800">Total Images</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{analytics.summary.publicImages}</div>
              <div className="text-sm text-green-800">Public Images</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{analytics.summary.privateImages}</div>
              <div className="text-sm text-gray-800">Private Images</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{analytics.summary.formattedTotalSize}</div>
              <div className="text-sm text-purple-800">Total Size</div>
            </div>
          </div>
          
          {analytics.formats.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Format Distribution</h3>
              <div className="flex flex-wrap gap-2">
                {analytics.formats.map(format => (
                  <span key={format.format} className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                    {format.format.toUpperCase()}: {format.count} ({format.percentage}%)
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <input
            type="text"
            placeholder="Search images..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="border rounded-lg px-3 py-2"
          />
          <select
            value={filters.visibility}
            onChange={(e) => setFilters(prev => ({ ...prev, visibility: e.target.value }))}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">All Visibility</option>
            <option value="private">Private</option>
            <option value="public">Public</option>
          </select>
          <input
            type="text"
            placeholder="Tags (comma-separated)"
            value={filters.tags}
            onChange={(e) => setFilters(prev => ({ ...prev, tags: e.target.value }))}
            className="border rounded-lg px-3 py-2"
          />
          <input
            type="date"
            placeholder="From Date"
            value={filters.dateFrom}
            onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
            className="border rounded-lg px-3 py-2"
          />
          <input
            type="date"
            placeholder="To Date"
            value={filters.dateTo}
            onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
            className="border rounded-lg px-3 py-2"
          />
          <Button onClick={loadImages} variant="secondary" size="sm">
            Apply Filters
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedImages.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-blue-800 font-medium">
              {selectedImages.size} image(s) selected
            </span>
            <div className="flex gap-2">
              {r2Status.configured && (
                <Button
                  onClick={handleMakePublic}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  Go Public
                </Button>
              )}
              <Button
                onClick={handleMakePrivate}
                variant="secondary"
                size="sm"
              >
                Make Private
              </Button>
              <Button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
                size="sm"
              >
                Delete
              </Button>
              <Button
                onClick={() => setSelectedImages(new Set())}
                variant="secondary"
                size="sm"
              >
                Clear Selection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Public URLs Display */}
      {publicUrls.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-green-800 mb-3">Public Download Links</h3>
          <div className="space-y-2">
            {publicUrls.map(item => (
              <div key={item.imageId} className="flex items-center justify-between bg-white p-3 rounded border">
                <div>
                  <div className="font-medium">{item.title}</div>
                  <div className="text-sm text-gray-600 font-mono break-all">{item.publicUrl}</div>
                </div>
                <Button
                  onClick={() => navigator.clipboard.writeText(item.publicUrl)}
                  variant="secondary"
                  size="sm"
                >
                  Copy Link
                </Button>
              </div>
            ))}
          </div>
          <Button
            onClick={() => setPublicUrls([])}
            variant="secondary"
            size="sm"
            className="mt-3"
          >
            Close
          </Button>
        </div>
      )}

      {/* Images Grid */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={images.length > 0 && selectedImages.size === images.length}
                onChange={selectAllImages}
                className="mr-2"
              />
              Select All
            </label>
            <span className="text-sm text-gray-600">
              Showing {images.length} of {pagination.total} images
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div className="mt-2 text-gray-600">Loading images...</div>
          </div>
        ) : images.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No images found. Upload some images to get started!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {images.map(image => (
              <div
                key={image._id}
                className={`border rounded-lg overflow-hidden hover:shadow-lg transition-shadow ${
                  selectedImages.has(image._id) ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="relative">
                  <img
                    src={`${API_BASE_URL}${image.fileUrl}`}
                    alt={image.title}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=';
                    }}
                  />
                  <div className="absolute top-2 left-2">
                    <input
                      type="checkbox"
                      checked={selectedImages.has(image._id)}
                      onChange={() => toggleImageSelection(image._id)}
                      className="w-4 h-4"
                    />
                  </div>
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      image.visibility === 'public' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {image.visibility}
                    </span>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm truncate" title={image.title}>
                    {image.title}
                  </h3>
                  <div className="text-xs text-gray-500 mt-1">
                    <div>{image.filename}</div>
                    <div className="flex justify-between mt-1">
                      <span>{image.format?.toUpperCase()}</span>
                      <span>{formatFileSize(image.fileSize)}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span>{image.metadata?.width}×{image.metadata?.height}</span>
                      <span>{image.daysSinceUpload}d ago</span>
                    </div>
                  </div>
                  {image.tags && image.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {image.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                      {image.tags.length > 2 && (
                        <span className="text-xs text-gray-500">+{image.tags.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t flex justify-center">
            <div className="flex gap-2">
              <Button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                variant="secondary"
                size="sm"
              >
                Previous
              </Button>
              <span className="px-3 py-2 text-sm">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                disabled={pagination.page === pagination.pages}
                variant="secondary"
                size="sm"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <ImageUploadModal
          onClose={() => setShowUploadModal(false)}
          onUpload={handleUpload}
          uploading={uploading}
        />
      )}
    </div>
  );
};

// Upload Modal Component
const ImageUploadModal = ({ onClose, onUpload, uploading }) => {
  const [files, setFiles] = useState([]);
  const [metadata, setMetadata] = useState({
    title: '',
    project: '',
    tags: [],
    notes: '',
    format: 'webp',
    quality: 80
  });

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (files.length === 0) {
      alert('Please select at least one image');
      return;
    }
    onUpload(files, metadata);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Upload Images</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={uploading}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Images</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="w-full border rounded-lg px-3 py-2"
              disabled={uploading}
            />
            {files.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                {files.length} file(s) selected
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Title (optional)</label>
            <input
              type="text"
              value={metadata.title}
              onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Leave empty to use filename"
              disabled={uploading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
            <input
              type="text"
              value={metadata.tags.join(', ')}
              onChange={(e) => setMetadata(prev => ({ 
                ...prev, 
                tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
              }))}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="e.g. product, banner, hero"
              disabled={uploading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Format</label>
            <select
              value={metadata.format}
              onChange={(e) => setMetadata(prev => ({ ...prev, format: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2"
              disabled={uploading}
            >
              <option value="webp">WebP (Recommended)</option>
              <option value="avif">AVIF (Smallest)</option>
              <option value="jpeg">JPEG</option>
              <option value="png">PNG</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Quality: {metadata.quality}%</label>
            <input
              type="range"
              min="10"
              max="100"
              value={metadata.quality}
              onChange={(e) => setMetadata(prev => ({ ...prev, quality: parseInt(e.target.value) }))}
              className="w-full"
              disabled={uploading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes (optional)</label>
            <textarea
              value={metadata.notes}
              onChange={(e) => setMetadata(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2"
              rows="3"
              placeholder="Additional notes about these images"
              disabled={uploading}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={uploading || files.length === 0}
              className="flex-1"
            >
              {uploading ? 'Uploading...' : 'Upload Images'}
            </Button>
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              disabled={uploading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ImageContentManager;
