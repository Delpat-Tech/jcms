import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Edit3, Trash2 } from 'lucide-react';

const PreviewModal = ({ file, onClose, onNext, onPrev, onDelete, onDownload }) => {
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
  const [dropdownTimeout, setDropdownTimeout] = useState(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(file.title || file.filename || '');

  const handleImageDownload = (imageId, size) => {
    const url = `http://localhost:5000/api/images/${imageId}/${size}`;
    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${file.title || file.filename}_${size}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      });
  };

  const handleRegularDownload = (file) => {
    const url = file.publicUrl || file.fileUrl || file.fullUrl;
    if (url) {
      fetch(url)
        .then(response => response.blob())
        .then(blob => {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = file.filename || file.title || 'download';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);
        });
    }
  };

  const handleRename = async () => {
    try {
      const { imageApi, fileApi } = await import('../../api');
      const response = file.type === 'image' 
        ? await imageApi.update(file._id, { title: newTitle })
        : await fileApi.update?.(file._id, { title: newTitle });
      
      if (response) {
        file.title = newTitle;
        setIsRenaming(false);
      }
    } catch (error) {
      console.error('Rename failed:', error);
    }
  };
  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowLeft':
        onPrev?.();
        break;
      case 'ArrowRight':
        onNext?.();
        break;
    }
  };

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderPreview = () => {
    if ((file.publicUrl || file.fileUrl || file.fullUrl) && file.type === 'image') {
      return (
        <img 
          src={file.publicUrl || file.fileUrl || file.fullUrl} 
          alt={file.title || file.filename}
          className="max-w-full max-h-full object-contain"
          onError={(e) => { e.currentTarget.replaceWith(document.createTextNode('Preview not available')); }}
        />
      );
    }
    
    if (file.type === 'video') {
      return (
        <video 
          controls 
          className="max-w-full max-h-full"
          src={file.publicUrl || file.fileUrl || file.fullUrl}
        >
          Your browser does not support video playback.
        </video>
      );
    }
    
    if (file.type === 'audio') {
      return (
        <div className="flex flex-col items-center space-y-4">
          <div className="w-32 h-32 bg-purple-100 rounded-full flex items-center justify-center">
            <span className="text-4xl">🎵</span>
          </div>
          <audio controls className="w-full max-w-md">
            <source src={file.publicUrl || file.fileUrl || file.fullUrl} />
            Your browser does not support audio playback.
          </audio>
        </div>
      );
    }
    
    return (
      <div className="flex flex-col items-center space-y-4 text-gray-500">
        <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
          <span className="text-4xl">📄</span>
        </div>
        <p>Preview not available for this file type</p>
        <button 
          onClick={() => handleRegularDownload(file)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Download to view
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="relative w-full h-full flex items-center justify-center p-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
        >
          <X className="w-8 h-8" />
        </button>
        
        {/* Navigation Buttons */}
        {onPrev && (
          <button
            onClick={onPrev}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
        )}
        
        {onNext && (
          <button
            onClick={onNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        )}
        
        {/* Preview Content */}
        <div className="flex-1 flex items-center justify-center">
          {renderPreview()}
        </div>
        
        {/* Info Panel */}
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4 sm:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                {isRenaming ? (
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onBlur={handleRename}
                    onKeyPress={(e) => e.key === 'Enter' && handleRename()}
                    className="text-xl font-semibold mb-2 bg-white bg-opacity-20 text-white border border-white border-opacity-30 rounded px-2 py-1 w-full"
                    autoFocus
                  />
                ) : (
                  <h2 
                    className="text-xl font-semibold mb-2 cursor-pointer"
                    onDoubleClick={() => setIsRenaming(true)}
                  >
                    {file.title || file.filename}
                  </h2>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-300 mb-2 flex-wrap">
                  <span>{file.format?.toUpperCase()}</span>
                  <span>{file.size ? `${Math.round(file.size / 1024)} KB` : ''}</span>
                  <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                  <span>{file.tenantName || 'System'}</span>
                </div>
                <div className="text-xs text-gray-400 mb-2">
                  <span className="font-medium">ID:</span> 
                  <span className="font-mono text-blue-300 ml-1">{file._id}</span>
                </div>
                <div className="text-xs text-gray-400 mb-2">
                  <span className="font-medium">Public URL:</span> 
                  <a 
                    href={(() => {
                      const url = file.publicUrl || file.fileUrl || file.fullUrl;
                      return url && url.startsWith('/') ? `http://localhost:5000${url}` : url;
                    })()} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="break-all text-blue-300 hover:text-blue-200 underline ml-1"
                  >
                    {(() => {
                      const url = file.publicUrl || file.fileUrl || file.fullUrl;
                      return url && url.startsWith('/') ? `http://localhost:5000${url}` : url;
                    })()}
                  </a>
                </div>
                {(file.notes?.description || file.notes) && (
                  <p className="text-sm text-gray-300 italic">
                    {file.notes?.description || file.notes}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <button
                  onClick={onClose}
                  className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
                {file.type === 'image' ? (
                  <div className="relative">
                    <button
                      className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg"
                      onMouseEnter={() => {
                        if (dropdownTimeout) clearTimeout(dropdownTimeout);
                        setShowDownloadDropdown(true);
                      }}
                      onMouseLeave={() => {
                        const timeout = setTimeout(() => setShowDownloadDropdown(false), 300);
                        setDropdownTimeout(timeout);
                      }}
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    {showDownloadDropdown && (
                      <div 
                        className="absolute bottom-full left-0 mb-2 bg-white border rounded-lg shadow-lg p-2 z-10 min-w-max"
                        onMouseEnter={() => {
                          if (dropdownTimeout) clearTimeout(dropdownTimeout);
                        }}
                        onMouseLeave={() => {
                          const timeout = setTimeout(() => setShowDownloadDropdown(false), 200);
                          setDropdownTimeout(timeout);
                        }}
                      >
                        <button
                          onClick={() => handleImageDownload(file._id, 'thumbnail')}
                          className="block w-full text-left px-3 py-1 text-xs hover:bg-gray-100 rounded whitespace-nowrap text-black"
                        >
                          Thumbnail (150x150)
                        </button>
                        <button
                          onClick={() => handleImageDownload(file._id, 'medium')}
                          className="block w-full text-left px-3 py-1 text-xs hover:bg-gray-100 rounded whitespace-nowrap text-black"
                        >
                          Medium (800x600)
                        </button>
                        <button
                          onClick={() => handleImageDownload(file._id, 'large')}
                          className="block w-full text-left px-3 py-1 text-xs hover:bg-gray-100 rounded whitespace-nowrap text-black"
                        >
                          Large (1920x1080)
                        </button>
                        <button
                          onClick={() => handleRegularDownload(file)}
                          className="block w-full text-left px-3 py-1 text-xs hover:bg-gray-100 rounded whitespace-nowrap text-black"
                        >
                          Original
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button 
                    onClick={() => handleRegularDownload(file)}
                    className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                )}
                <button 
                  onClick={() => setIsRenaming(true)}
                  className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => onDelete?.(file)}
                  className="p-2 bg-red-600 bg-opacity-75 hover:bg-opacity-100 rounded-lg"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;