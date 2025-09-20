import React, { useState, useEffect } from 'react';
import { imageApi } from '../../api';
import TrioLoader from '../ui/TrioLoader';

function ImageGallery({ refreshTrigger }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchImages = async () => {
    try {
      const response = await imageApi.getAll();
      const result = await response.json();
      if (result.success) {
        setImages(result.data);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [refreshTrigger]);

  const deleteImage = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;

    try {
      const response = await imageApi.delete(imageId);
      const result = await response.json();
      if (result.success) {
        setImages(images.filter(img => img._id !== imageId));
      } else {
        alert('Delete failed: ' + result.message);
      }
    } catch (error) {
      alert('Delete error: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <TrioLoader size="40" color="#3b82f6" />
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Image Gallery ({images.length})</h3>
      
      {images.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No images uploaded yet</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((image) => (
            <div key={image._id} className="border rounded-lg overflow-hidden">
              <img
                src={image.fileUrl}
                alt={image.title}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBub3QgZm91bmQ8L3RleHQ+PC9zdmc+';
                }}
              />
              <div className="p-3">
                <h4 className="font-medium text-sm mb-1 truncate" title={image.title}>
                  {image.title || 'Untitled'}
                </h4>
                <p className="text-xs text-gray-500 mb-2">
                  {image.format?.toUpperCase()} • {new Date(image.createdAt).toLocaleDateString()}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 truncate" title={image.tenantName}>
                    {image.tenantName || 'System'}
                  </span>
                  <button
                    onClick={() => deleteImage(image._id)}
                    className="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ImageGallery;