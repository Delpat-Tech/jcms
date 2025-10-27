// components/ImageCollectionManager.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Button from './ui/Button.jsx';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Helper function to get proper image URL
const getImageUrl = (image) => {
  if (!image) return '';
  
  if (image.fileUrl) {
    if (image.fileUrl.startsWith('http')) {
      return image.fileUrl;
    }
    return `${API_BASE_URL}${image.fileUrl}`;
  }
  
  if (image.filename) {
    return `${API_BASE_URL}/uploads/${image.filename}`;
  }
  
  if (image.internalPath) {
    return `${API_BASE_URL}/${image.internalPath}`;
  }
  
  return '';
};

const ImageCollectionManager = () => {
  const [view, setView] = useState('collections');
  const [collections, setCollections] = useState([]);
  const [currentCollection, setCurrentCollection] = useState(null);
  const [collectionImages, setCollectionImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

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



  const loadCollectionDetail = useCallback(async (collectionId) => {
    try {
      setLoading(true);
      console.log('Loading collection detail for ID:', collectionId);
      const result = await apiCall(`/api/image-management/collections/${collectionId}`);
      console.log('Collection detail response:', result);
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

  const handleRemoveItem = async (itemId, collectionId, itemType) => {
    const itemName = itemType === 'image' ? 'image' : 'file';
    if (window.confirm(`Remove this ${itemName} from the collection?`)) {
      try {
        console.log('Removing item:', itemId, 'type:', itemType, 'from collection:', collectionId);
        
        const endpoint = itemType === 'image' 
          ? `/api/image-management/collections/${collectionId}/remove-images`
          : `/api/image-management/collections/${collectionId}/remove-files`;
        
        const bodyKey = itemType === 'image' ? 'imageIds' : 'fileIds';
        
        const result = await apiCall(endpoint, {
          method: 'POST',
          body: JSON.stringify({ [bodyKey]: [itemId] })
        });
        
        console.log('Remove result:', result);
        if (result.success) {
          alert(`${itemName.charAt(0).toUpperCase() + itemName.slice(1)} removed from collection`);
          loadCollectionDetail(collectionId);
        } else {
          alert(`Failed to remove ${itemName}: ` + result.message);
        }
      } catch (error) {
        console.error('Remove item error:', error);
        alert(`Failed to remove ${itemName}: ` + error.message);
      }
    }
  };

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);



  const handleDownloadCollectionZip = async (collectionId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/image-management/collections/${collectionId}/download-zip`, {
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

  const handleDeleteCollection = async (collectionId, collectionName) => {
    if (!window.confirm(`Are you sure you want to delete the collection "${collectionName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const result = await apiCall(`/api/image-management/collections/${collectionId}`, {
        method: 'DELETE'
      });

      if (result.success) {
        alert(`Collection "${collectionName}" has been deleted successfully`);
        loadCollections();
      } else {
        alert(`Failed to delete collection: ${result.message}`);
      }
    } catch (error) {
      console.error('Delete collection error:', error);
      alert(`Failed to delete collection: ${error.message}`);
    }
  };

  if (view === 'collection-detail') {
    return (
      <CollectionDetailView
        collection={currentCollection}
        images={collectionImages}
        onBack={() => setView('collections')}
        onDownloadZip={() => handleDownloadCollectionZip(currentCollection._id)}
        formatFileSize={formatFileSize}
        onRemoveItem={handleRemoveItem}
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
                    <img
                      src={getImageUrl(collection.recentImages[0])}
                      alt={collection.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.log('Image failed to load:', collection.recentImages[0]);
                        // Try alternative URLs
                        const img = collection.recentImages[0];
                        const altUrls = [
                          `${API_BASE_URL}/uploads/${img.filename}`,
                          `${API_BASE_URL}/public/${collection.slug}/${img.filename}`,
                          `${API_BASE_URL}/public/kitty/download.jpeg`
                        ];
                        
                        let currentIndex = parseInt(e.target.dataset.urlIndex || '0');
                        if (currentIndex < altUrls.length - 1) {
                          e.target.dataset.urlIndex = (currentIndex + 1).toString();
                          e.target.src = altUrls[currentIndex + 1];
                        } else {
                          e.target.style.display = 'none';
                        }
                      }}
                    />
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
                  
                  {/* Collection API URL Display */}
                  <div className="mb-3 p-2 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="text-xs font-medium text-gray-700 mb-1">Public API URL:</div>
                    <div className="text-xs font-mono text-gray-600 break-all bg-white px-2 py-1 rounded border">
                      {`${API_BASE_URL}/api/public/collection/${collection.slug}`}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(`${API_BASE_URL}/api/public/collection/${collection.slug}`);
                        alert('API URL copied to clipboard!');
                      }}
                      className="mt-1 text-xs text-blue-600 hover:text-blue-800"
                    >
                      Copy URL
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                    <span>{collection.stats?.totalImages || 0} images</span>
                    <span>{formatFileSize(collection.stats?.totalSize || 0)}</span>
                  </div>



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
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCollection(collection._id, collection.name);
                      }}
                      variant="secondary"
                      size="sm"
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      Delete
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
  onDownloadZip, 
  formatFileSize,
  onRemoveItem 
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
          </div>
        </div>
      </div>

      {/* Images Grid */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Items in Collection</h2>
        </div>

        {images.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            This collection is empty. Add some images or files to get started!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {images.map((item, index) => (
              <div key={item.index || index} className="border rounded-lg overflow-hidden">
                <div className="relative">
                  {item.type === 'image' ? (
                    <img
                      src={getImageUrl(item)}
                      alt={item.title}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        console.log('Detail image failed to load:', item);
                        // Try alternative URLs
                        const altUrls = [
                          `${API_BASE_URL}/uploads/${item.filename}`,
                          `${API_BASE_URL}/public/kitty/download.jpeg`,
                          item.accessUrl,
                          item.fileUrl
                        ].filter(Boolean);
                        
                        let currentIndex = parseInt(e.target.dataset.urlIndex || '0');
                        if (currentIndex < altUrls.length - 1) {
                          e.target.dataset.urlIndex = (currentIndex + 1).toString();
                          e.target.src = altUrls[currentIndex + 1];
                        } else {
                          e.target.style.display = 'none';
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl mb-2">📄</div>
                        <div className="text-sm font-medium text-gray-700">{item.format?.toUpperCase()} File</div>
                        <a 
                          href={item.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-xs mt-1 inline-block"
                        >
                          Open File
                        </a>
                      </div>
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      item.visibility === 'public' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.visibility}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      console.log('Remove button clicked:', { itemId: item._id || item.id, collectionId: collection._id, type: item.type });
                      onRemoveItem(item._id || item.id, collection._id, item.type);
                    }}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold z-10 cursor-pointer shadow-lg"
                  >
                    ×
                  </button>
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm truncate">{item.title}</h3>
                  <div className="text-xs text-gray-500 mt-1">
                    <div>{item.format?.toUpperCase()} • {formatFileSize(item.fileSize)}</div>
                    <div>{item.daysSinceUpload}d ago</div>
                  </div>
                  
                  

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



export default ImageCollectionManager;
