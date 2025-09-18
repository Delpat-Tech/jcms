import React from 'react';
import { X, ChevronLeft, ChevronRight, Download, Edit3, Trash2 } from 'lucide-react';

const PreviewModal = ({ file, onClose, onNext, onPrev, onDelete, onDownload }) => {
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
    if ((file.fileUrl || file.fullUrl) && file.type === 'image') {
      return (
        <img 
          src={file.fileUrl || file.fullUrl} 
          alt={file.title || file.filename}
          className="max-w-full max-h-full object-contain"
        />
      );
    }
    
    if (file.type === 'video') {
      return (
        <video 
          controls 
          className="max-w-full max-h-full"
          src={file.fileUrl || file.fullUrl}
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
            <source src={file.fileUrl || file.fullUrl} />
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
          onClick={() => onDownload?.(file)}
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
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-2">{file.title || file.filename}</h2>
                <div className="flex items-center space-x-4 text-sm text-gray-300 mb-2">
                  <span>{file.format?.toUpperCase()}</span>
                  <span>{file.size ? `${Math.round(file.size / 1024)} KB` : ''}</span>
                  <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                  <span>{file.tenantName || 'System'}</span>
                </div>
                {(file.notes?.description || file.notes) && (
                  <p className="text-sm text-gray-300 italic">
                    {file.notes?.description || file.notes}
                  </p>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => onDownload?.(file)}
                  className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg">
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