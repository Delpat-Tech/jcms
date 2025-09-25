// components/TunnelImageCollectionManager.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Button from './ui/Button.jsx';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const TunnelImageCollectionManager = () => {
  const [view, setView] = useState('collections');
  const [collections, setCollections] = useState([]);
  const [currentCollection, setCurrentCollection] = useState(null);
  const [collectionImages, setCollectionImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCollections, setSelectedCollections] = useState(new Set());
  const [selectedImages, setSelectedImages] = useState(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tunnelStatus, setTunnelStatus] = useState({ isRunning: false, tunnelUrl: null });
  const [startingTunnel, setStartingTunnel] = useState(false);

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

  const loadCollections = useCallback(async () => {
    try {
      setLoading(true);
      const result = await apiCall('/api/image-management/collections');
      setCollections(result.data || []);
    } catch (error) {
      console.error('Failed to load collections:', error);
      setCollections([]);
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  const loadTunnelStatus = useCallback(async () => {
    try {
      const result = await apiCall('/api/image-management/tunnel/status');
      setTunnelStatus(result.data);
    } catch (error) {
      console.error('Failed to load tunnel status:', error);
    }
  }, [apiCall]);

  const loadCollectionDetail = useCallback(async (collectionId) => {
    try {
      setLoading(true);
      const result = await apiCall(`/api/image-management/collections/${collectionId}`);
      setCurrentCollection(result.data.collection);
      setCollectionImages(result.data.images);
      setView('collection-detail');
    } catch (error) {
      console.error('Failed to load collection detail:', error);
      alert('Failed to load collection: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  useEffect(() => {
    loadCollections();
    loadTunnelStatus();
  }, [loadCollections, loadTunnelStatus]);

  const handleStartTunnel = async () => {
    try {
      setStartingTunnel(true);
      const result = await apiCall('/api/image-management/tunnel/start', {
        method: 'POST'
      });

      if (result.success) {
        setTunnelStatus(result.data.status);
        alert(`Tunnel started successfully!\nPublic URL: ${result.data.tunnelUrl}`);
      }
    } catch (error) {
      console.error('Failed to start tunnel:', error);
      alert('Failed to start tunnel: ' + error.message);
    } finally {
      setStartingTunnel(false);
    }
  };

  const handleStopTunnel = async () => {
    try {
      const result = await apiCall('/api/image-management/tunnel/stop', {
        method: 'POST'
      });

      if (result.success) {
        setTunnelStatus(result.data.status);
        alert('Tunnel stopped successfully!');
      }
    } catch (error) {
      console.error('Failed to stop tunnel:', error);
      alert('Failed to stop tunnel: ' + error.message);
    }
  };

  const handleMakeCollectionPublic = async (collectionId) => {
    if (!tunnelStatus.isRunning) {
      const startTunnel = window.confirm(
        'Tunnel is not running. Would you like to start it first?'
      );
      if (startTunnel) {
        await handleStartTunnel();
        // Wait a moment for tunnel to be ready
        setTimeout(() => makeCollectionPublicViaTunnel(collectionId), 2000);
      }
      return;
    }

    await makeCollectionPublicViaTunnel(collectionId);
  };

  const makeCollectionPublicViaTunnel = async (collectionId) => {
    try {
      const result = await apiCall(`/api/image-management/tunnel/collections/${collectionId}/make-public`, {
        method: 'POST'
      });

      if (result.success) {
        alert(`Collection made public!\n\nTunnel URL: ${result.data.tunnelUrl}\nCollection URL: ${result.data.collectionUrl}\n\n${result.data.summary.successful} image(s) published.`);
        
        if (view === 'collections') {
          loadCollections();
        } else {
          loadCollectionDetail(collectionId);
        }
      }
    } catch (error) {
      console.error('Failed to make collection public:', error);
      alert('Failed to make collection public: ' + error.message);
    }
  };

  const handleDownloadCollectionZip = async (collectionId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/image-management/tunnel/collections/${collectionId}/download-zip`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download ZIP');
      }

      // Get filename from response headers
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `collection_${collectionId}.zip`;

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);

      alert('Collection ZIP downloaded successfully!');
    } catch (error) {
      console.error('Failed to download collection ZIP:', error);
      alert('Failed to download ZIP: ' + error.message);
    }
  };

  const handleCreateCollection = async (collectionData) => {
    try {
      await apiCall('/api/image-management/collections', {
        method: 'POST',
        body: JSON.stringify(collectionData)
      });
      setShowCreateModal(false);
      loadCollections();
      alert('Collection created successfully!');
    } catch (error) {
      console.error('Failed to create collection:', error);
      alert('Failed to create collection: ' + error.message);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  if (view === 'collection-detail') {
    return (
      <CollectionDetailView
        collection={currentCollection}
        images={collectionImages}
        onBack={() => setView('collections')}
        onMakePublic={() => handleMakeCollectionPublic(currentCollection._id)}
        onDownloadZip={() => handleDownloadCollectionZip(currentCollection._id)}
        tunnelStatus={tunnelStatus}
        formatFileSize={formatFileSize}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Image Collections</h1>
          <div className="flex gap-3">
            <Button
              onClick={loadCollections}
              variant="secondary"
              size="sm"
            >
              Refresh
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Create Collection
            </Button>
          </div>
        </div>

        {/* Tunnel Status Banner */}
        <div className={`p-4 rounded-lg mb-4 ${
          tunnelStatus.isRunning 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${
                tunnelStatus.isRunning ? 'bg-green-500' : 'bg-yellow-500'
              }`}></div>
              <div>
                <span className={`text-sm font-medium ${
                  tunnelStatus.isRunning ? 'text-green-800' : 'text-yellow-800'
                }`}>
                  {tunnelStatus.isRunning 
                    ? `Tunnel Running: ${tunnelStatus.tunnelUrl}` 
                    : 'Tunnel Not Running - Click "Start Tunnel" to enable public access'
                  }
                </span>
                {tunnelStatus.cloudflaredAvailable === false && (
                  <div className="text-xs text-red-600 mt-1">
                    ⚠️ cloudflared.exe not found. Please install Cloudflare Tunnel.
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {!tunnelStatus.isRunning ? (
                <Button
                  onClick={handleStartTunnel}
                  disabled={startingTunnel || !tunnelStatus.cloudflaredAvailable}
                  className="bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  {startingTunnel ? 'Starting...' : 'Start Tunnel'}
                </Button>
              ) : (
                <Button
                  onClick={handleStopTunnel}
                  className="bg-red-600 hover:bg-red-700"
                  size="sm"
                >
                  Stop Tunnel
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Collections Grid */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Your Collections</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div className="mt-2 text-gray-600">Loading collections...</div>
          </div>
        ) : collections.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No collections found. Create your first collection to organize images!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {collections.map(collection => (
              <div
                key={collection._id}
                className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Collection Cover */}
                <div className="h-48 bg-gray-200 relative cursor-pointer"
                     onClick={() => loadCollectionDetail(collection._id)}>
                  {collection.coverImage ? (
                    <img
                      src={`${API_BASE_URL}${collection.coverImage.fileUrl}`}
                      alt={collection.name}
                      className="w-full h-full object-cover"
                    />
                  ) : collection.recentImages && collection.recentImages.length > 0 ? (
                    <div className="grid grid-cols-2 gap-1 h-full">
                      {collection.recentImages.slice(0, 4).map((image, idx) => (
                        <img
                          key={idx}
                          src={`${API_BASE_URL}${image.fileUrl}`}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <span>No Images</span>
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      collection.visibility === 'public' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {collection.visibility}
                    </span>
                  </div>
                </div>

                {/* Collection Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{collection.name}</h3>
                  {collection.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{collection.description}</p>
                  )}
                  
                  <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                    <span>{collection.stats?.totalImages || 0} images</span>
                    <span>{formatFileSize(collection.stats?.totalSize || 0)}</span>
                  </div>

                  {/* Public URL Display */}
                  {collection.visibility === 'public' && collection.tunnelUrl && (
                    <div className="mb-3 p-2 bg-green-50 rounded text-xs">
                      <div className="font-medium text-green-800 mb-1">Public URL:</div>
                      <div className="text-green-700 break-all">{collection.tunnelUrl}</div>
                    </div>
                  )}

                  {collection.tags && collection.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {collection.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                      {collection.tags.length > 3 && (
                        <span className="text-xs text-gray-500">+{collection.tags.length - 3}</span>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {collection.visibility === 'private' && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMakeCollectionPublic(collection._id);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white flex-1"
                        size="sm"
                      >
                        Go Public
                      </Button>
                    )}
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadCollectionZip(collection._id);
                      }}
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                    >
                      Download ZIP
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Collection Modal */}
      {showCreateModal && (
        <CreateCollectionModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateCollection}
        />
      )}
    </div>
  );
};

// Collection Detail View Component
const CollectionDetailView = ({ 
  collection, 
  images, 
  onBack, 
  onMakePublic, 
  onDownloadZip, 
  tunnelStatus, 
  formatFileSize 
}) => {
  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button onClick={onBack} variant="secondary" size="sm">
            ← Back to Collections
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">{collection.name}</h1>
          <span className={`px-3 py-1 text-sm font-medium rounded ${
            collection.visibility === 'public' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {collection.visibility}
          </span>
        </div>

        {collection.description && (
          <p className="text-gray-600 mb-4">{collection.description}</p>
        )}

        {/* Public URL Display */}
        {collection.visibility === 'public' && collection.tunnelUrl && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="font-medium text-green-800 mb-2">🌐 Public Collection URL:</div>
            <div className="text-green-700 break-all font-mono text-sm">{collection.tunnelUrl}</div>
            <Button
              onClick={() => navigator.clipboard.writeText(collection.tunnelUrl)}
              size="sm"
              variant="secondary"
              className="mt-2"
            >
              Copy URL
            </Button>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="flex gap-6 text-sm text-gray-600">
            <span>{collection.stats?.totalImages || images.length} images</span>
            <span>{formatFileSize(collection.stats?.totalSize || 0)}</span>
            <span>Created {new Date(collection.createdAt).toLocaleDateString()}</span>
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={onDownloadZip}
              variant="secondary"
            >
              Download ZIP
            </Button>
            {collection.visibility === 'private' && (
              <Button
                onClick={onMakePublic}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Go Public (Entire Collection)
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Images Grid */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Images in Collection</h2>
        </div>

        {images.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            This collection is empty. Add some images to get started!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {images.map(image => (
              <div key={image._id} className="border rounded-lg overflow-hidden">
                <div className="relative">
                  <img
                    src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${image.fileUrl}`}
                    alt={image.title}
                    className="w-full h-48 object-cover"
                  />
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
                  <h3 className="font-medium text-sm truncate">{image.title}</h3>
                  <div className="text-xs text-gray-500 mt-1">
                    <div>{image.format?.toUpperCase()} • {formatFileSize(image.fileSize)}</div>
                    <div>{image.daysSinceUpload}d ago</div>
                  </div>
                  
                  {/* Public URL for individual image */}
                  {image.visibility === 'public' && image.tunnelUrl && (
                    <div className="mt-2 p-2 bg-green-50 rounded text-xs">
                      <div className="font-medium text-green-800 mb-1">Public URL:</div>
                      <div className="text-green-700 break-all">{image.tunnelUrl}</div>
                      <div className="flex gap-1 mt-1">
                        <button
                          onClick={() => navigator.clipboard.writeText(image.tunnelUrl)}
                          className="text-green-600 hover:text-green-800 text-xs"
                        >
                          Copy
                        </button>
                        <button
                          onClick={() => window.open(image.tunnelUrl, '_blank')}
                          className="text-green-600 hover:text-green-800 text-xs"
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Create Collection Modal (same as before)
const CreateCollectionModal = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: []
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Collection name is required');
      return;
    }
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Create New Collection</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Collection Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="e.g., Product Photos, Event Gallery"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2"
              rows="3"
              placeholder="Brief description of this collection"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
            <input
              type="text"
              value={formData.tags.join(', ')}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
              }))}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="e.g., products, marketing, 2024"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              Create Collection
            </Button>
            <Button type="button" onClick={onClose} variant="secondary">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TunnelImageCollectionManager;
