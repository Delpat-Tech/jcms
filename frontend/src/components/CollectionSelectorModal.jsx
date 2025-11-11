// components/CollectionSelectorModal.jsx
import React, { useState, useEffect } from 'react';
import Button from './ui/Button.jsx';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const CollectionSelectorModal = ({ 
  isOpen, 
  onClose, 
  onSelectCollection, 
  selectedImageIds = [],
  selectedFileIds = [],
  title = "Add to Collection" 
}) => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [creating, setCreating] = useState(false);

  const token = localStorage.getItem('token');

  const apiCall = async (endpoint, options = {}) => {
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
  };

  const loadCollections = async () => {
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
  };

  useEffect(() => {
    if (isOpen) {
      loadCollections();
    }
  }, [isOpen]);

  const handleSelectCollection = async (collection) => {
    try {
      console.log('Adding items to collection:', { 
        collectionId: collection._id, 
        imageIds: selectedImageIds,
        fileIds: selectedFileIds 
      });
      
      let totalModified = 0;
      
      // Add images to the selected collection
      if (selectedImageIds.length > 0) {
        const imageResult = await apiCall(`/api/image-management/collections/${collection._id}/add-images`, {
          method: 'POST',
          body: JSON.stringify({ imageIds: selectedImageIds })
        });
        if (imageResult.success) {
          totalModified += imageResult.data?.modifiedCount || 0;
        }
      }
      
      // Add files to the selected collection
      if (selectedFileIds.length > 0) {
        const fileResult = await apiCall(`/api/image-management/collections/${collection._id}/add-files`, {
          method: 'POST',
          body: JSON.stringify({ fileIds: selectedFileIds })
        });
        if (fileResult.success) {
          totalModified += fileResult.data?.modifiedCount || 0;
        }
      }
      
      const enhancedResult = {
        success: true,
        data: {
          modifiedCount: totalModified
        }
      };
      
      console.log('Enhanced result:', enhancedResult);
      onSelectCollection(collection, enhancedResult);
      onClose();
    } catch (error) {
      console.error('Failed to add items to collection:', error);
      alert('Failed to add items to collection: ' + error.message);
    }
  };

  const handleCreateNewCollection = async () => {
    if (!newCollectionName.trim()) {
      alert('Please enter a collection name');
      return;
    }

    try {
      setCreating(true);
      
      // Create empty collection first
      const createResult = await apiCall('/api/image-management/collections', {
        method: 'POST',
        body: JSON.stringify({
          name: newCollectionName.trim()
          
        })
      });

      if (createResult.success) {
        const collection = createResult.data;
        let totalModified = 0;
        
        // Add images to the new collection
        if (selectedImageIds.length > 0) {
          const imageResult = await apiCall(`/api/image-management/collections/${collection._id}/add-images`, {
            method: 'POST',
            body: JSON.stringify({ imageIds: selectedImageIds })
          });
          if (imageResult.success) {
            totalModified += imageResult.data?.modifiedCount || 0;
          }
        }
        
        // Add files to the new collection
        if (selectedFileIds.length > 0) {
          const fileResult = await apiCall(`/api/image-management/collections/${collection._id}/add-files`, {
            method: 'POST',
            body: JSON.stringify({ fileIds: selectedFileIds })
          });
          if (fileResult.success) {
            totalModified += fileResult.data?.modifiedCount || 0;
          }
        }
        
        const enhancedResult = {
          success: true,
          data: {
            modifiedCount: totalModified
          }
        };
        
        onSelectCollection(collection, enhancedResult);
        onClose();
      } else {
        alert('Failed to create collection: ' + createResult.message);
      }
    } catch (error) {
      console.error('Failed to create collection:', error);
      alert('Failed to create collection: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            Selected: <strong>{selectedImageIds.length} image(s)</strong>
            {selectedFileIds.length > 0 && (
              <span>, <strong>{selectedFileIds.length} file(s)</strong></span>
            )}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div className="mt-2 text-gray-600">Loading collections...</div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Existing Collections */}
            <div>
              <h3 className="font-medium mb-3">Choose Existing Collection:</h3>
              {collections.length === 0 ? (
                <p className="text-gray-500 text-sm py-4 text-center">
                  No collections found. Create a new one below.
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {collections.map(collection => (
                    <div
                      key={collection._id}
                      onClick={() => handleSelectCollection(collection)}
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium">{collection.name}</h4>
                          {collection.description && (
                            <p className="text-sm text-gray-600 mt-1">{collection.description}</p>
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            {collection.imageCount || 0} images • {collection.formattedStats?.formattedSize || '0 B'}
                          </div>
                        </div>
                        <div className={`px-2 py-1 text-xs rounded ${
                          collection.visibility === 'public' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {collection.visibility || 'private'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Create New Collection */}
            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">Or Create New Collection:</h3>
              
              {!showCreateNew ? (
                <Button
                  onClick={() => setShowCreateNew(true)}
                  variant="secondary"
                  className="w-full"
                >
                  + Create New Collection
                </Button>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder="Enter collection name..."
                    className="w-full border rounded-lg px-3 py-2"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCreateNewCollection}
                      disabled={creating || !newCollectionName.trim()}
                      className="flex-1"
                    >
                      {creating ? 'Creating...' : 'Create & Add Images'}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowCreateNew(false);
                        setNewCollectionName('');
                      }}
                      variant="secondary"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t">
          <Button
            onClick={onClose}
            variant="secondary"
            className="w-full"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CollectionSelectorModal;
