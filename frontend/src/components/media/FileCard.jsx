import React, { useState, useEffect } from 'react';
import { Eye, Download, Edit3, Trash2, Play, FileText, Music, Archive, Clock, AlertTriangle } from 'lucide-react';
import { getDaysUntilExpiration, getExpirationStatus } from '../../utils/subscriptionLimits';

const FileCard = ({ file, viewMode, selected, onSelect, onPreview, onDelete, onDownload, subscriptionStatus }) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(file.title || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownTimeout, setDropdownTimeout] = useState(null);
  const [expirationInfo, setExpirationInfo] = useState(null);

  useEffect(() => {
    // Show expiration info for free users or if no subscription status yet
    if (file.expiresAt && (!subscriptionStatus || !subscriptionStatus.hasActiveSubscription)) {
      const info = getExpirationStatus(file.expiresAt);
      setExpirationInfo(info);
    } else {
      setExpirationInfo(null);
    }
  }, [file.expiresAt, subscriptionStatus]);

  // Determine if we should show expiration info
  const shouldShowExpirationInfo = () => {
    // Check if user is superadmin (always premium)
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role === 'superadmin') {
      return false;
    }
    
    // Only show expiration info if file has expiration date and user is not premium
    const isPremiumUser = subscriptionStatus?.hasActiveSubscription === true;
    return file.expiresAt && !isPremiumUser;
  };

  // Get expiration display text
  const getExpirationText = () => {
    if (!file.expiresAt) {
      return 'Expires in 15 days (Free Plan)';
    }
    
    const daysLeft = getDaysUntilExpiration(file.expiresAt);
    if (daysLeft <= 0) {
      return 'Expired';
    }
    return `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`;
  };

  // Get expiration color based on days left
  const getExpirationColor = () => {
    if (!file.expiresAt) return 'bg-blue-50 text-blue-700';
    
    const daysLeft = getDaysUntilExpiration(file.expiresAt);
    if (daysLeft <= 0) return 'bg-red-50 text-red-700';
    if (daysLeft <= 3) return 'bg-orange-50 text-orange-700';
    if (daysLeft <= 7) return 'bg-yellow-50 text-yellow-700';
    return 'bg-blue-50 text-blue-700';
  };

  const handleDelete = async (file) => {
    onDelete?.(file);
  };

  const handleDownload = async (file) => {
    const url = file.publicUrl || file.fileUrl || file.fullUrl;
    if (!url) {
      console.error('No download URL available for file:', file);
      return;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status}`);
      }
      
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.originalName || file.filename || file.title || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
      
      console.log('Download completed:', file.filename || file.title);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback to direct link
      const link = document.createElement('a');
      link.href = url;
      link.download = file.originalName || file.filename || file.title || 'download';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleImageDownload = (imageId, size) => {
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    window.open(`${API_URL}/api/images/${imageId}/${size}`, '_blank');
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'video': return <Play className="w-8 h-8 text-blue-500" />;
      case 'audio': return <Music className="w-8 h-8 text-purple-500" />;
      case 'pdf': return <FileText className="w-8 h-8 text-red-500" />;
      case 'archive': return <Archive className="w-8 h-8 text-yellow-500" />;
      default: return <FileText className="w-8 h-8 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleRename = async () => {
    // TODO: Implement rename API call
    setIsRenaming(false);
  };

  if (viewMode === 'list') {
    return (
      <div className={`
        flex items-center p-4 bg-white rounded-lg border hover:shadow-md transition-shadow
        ${selected ? 'ring-2 ring-blue-500' : ''}
      `}>
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect(file._id);
          }}
          className="w-4 h-4 text-blue-600 mr-4"
        />
        
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
          {(file.publicUrl || file.fileUrl || file.fullUrl) && file.type === 'image' ? (
            <img src={(() => {
              const url = file.publicUrl || file.fileUrl || file.fullUrl;
              return url?.startsWith('/') ? `http://localhost:5000${url}` : url;
            })()} alt={file.title || file.filename} className="w-full h-full object-cover rounded-lg" onError={(e) => { console.log('List view image failed to load:', e.target.src); }} />
          ) : (
            getFileIcon(file.type)
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 truncate">{file.title || file.filename}</h3>
          <p className="text-xs text-gray-500">
            {file.format?.toUpperCase()} • {formatFileSize(file.size)} • {formatDate(file.createdAt)}
          </p>

          {(file.notes?.description || file.notes) && (
            <p className="text-xs text-gray-600 italic truncate" title={file.notes?.description || file.notes}>
              {file.notes?.description || file.notes}
            </p>
          )}
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className="grid grid-cols-2 gap-2 justify-items-center">
            <button
              onClick={() => onPreview(file)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button 
              onClick={() => handleDownload(file)}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
            >
              <Download className="w-4 h-4" />
            </button>
            <button 
              onClick={() => handleDelete(file)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          
          {/* Expiration Info - Only show for free users */}
          {shouldShowExpirationInfo() && (
            <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${getExpirationColor()}`}>
              <Clock className="w-3 h-3" />
              <span className="font-medium text-xs">
                {getExpirationText()}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={
      `bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow
      ${selected ? 'ring-2 ring-blue-500' : ''}
    `}>
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-100 rounded-t-xl overflow-hidden">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect(file._id);
          }}
          className="absolute top-3 left-3 w-4 h-4 text-blue-600 z-10"
        />
        
        {(file.publicUrl || file.fileUrl || file.fullUrl) && file.type === 'image' ? (
          <img 
            src={(() => {
              const url = file.publicUrl || file.fileUrl || file.fullUrl;
              return url?.startsWith('/') ? `http://localhost:5000${url}` : url;
            })()} 
            alt={file.title || file.filename}
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => onPreview(file)}
            onError={(e) => { console.log('Image failed to load:', e.target.src); }}
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center cursor-pointer"
            onClick={() => onPreview(file)}
          >
            {getFileIcon(file.type)}
          </div>
        )}
        
        {/* File type badge */}
        {file.format && (
          <div className="absolute top-3 right-3 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
            {file.format.toUpperCase()}
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-4">
        {/* Title */}
        {isRenaming ? (
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onBlur={handleRename}
            onKeyPress={(e) => e.key === 'Enter' && handleRename()}
            className="w-full text-sm font-medium border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
            autoFocus
          />
        ) : (
          <h3 
            className="text-sm font-medium text-gray-900 mb-2 truncate cursor-pointer"
            onDoubleClick={() => setIsRenaming(true)}
            title={file.title || file.filename}
          >
            {file.title || file.filename || 'Untitled'}
          </h3>
        )}
        
        {/* Metadata */}
        <p className="text-xs text-gray-500 mb-2">
          {formatFileSize(file.size)} • {formatDate(file.createdAt)}
        </p>
        
        {/* Notes */}
        {(file.notes?.description || file.notes) && (
          <p className="text-xs text-gray-600 mb-3 italic line-clamp-2" title={file.notes?.description || file.notes}>
            {file.notes?.description || file.notes}
          </p>
        )}
        
        {/* Owner & Creator */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
              {file.tenantName || 'System'}
            </span>
          </div>
          {file.userInfo && (
            <div className="text-xs text-gray-500">
              <span className="font-medium">Created by:</span> {file.userInfo.username}
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 justify-items-center">
          <button
            onClick={() => onPreview(file)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
            title="Preview"
          >
            <Eye className="w-4 h-4" />
          </button>
          {file.type === 'image' ? (
            <div className="relative">
              <button
                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                title="Download Options"
                onMouseEnter={() => {
                  if (dropdownTimeout) clearTimeout(dropdownTimeout);
                  setShowDropdown(true);
                }}
                onMouseLeave={() => {
                  const timeout = setTimeout(() => setShowDropdown(false), 300);
                  setDropdownTimeout(timeout);
                }}
              >
                <Download className="w-4 h-4" />
              </button>
              {showDropdown && (
                <div 
                  className="absolute bottom-full left-0 mb-2 bg-white border rounded-lg shadow-lg p-2 z-10 min-w-max"
                  onMouseEnter={() => {
                    if (dropdownTimeout) clearTimeout(dropdownTimeout);
                  }}
                  onMouseLeave={() => {
                    const timeout = setTimeout(() => setShowDropdown(false), 200);
                    setDropdownTimeout(timeout);
                  }}
                >
                  <button
                    onClick={() => handleImageDownload(file._id, 'thumbnail')}
                    className="block w-full text-left px-3 py-1 text-xs hover:bg-gray-100 rounded whitespace-nowrap"
                  >
                    Thumbnail (150x150)
                  </button>
                  <button
                    onClick={() => handleImageDownload(file._id, 'medium')}
                    className="block w-full text-left px-3 py-1 text-xs hover:bg-gray-100 rounded whitespace-nowrap"
                  >
                    Medium (800x600)
                  </button>
                  <button
                    onClick={() => handleImageDownload(file._id, 'large')}
                    className="block w-full text-left px-3 py-1 text-xs hover:bg-gray-100 rounded whitespace-nowrap"
                  >
                    Large (1920x1080)
                  </button>
                  <button
                    onClick={() => handleDownload(file)}
                    className="block w-full text-left px-3 py-1 text-xs hover:bg-gray-100 rounded whitespace-nowrap"
                  >
                    Original
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => handleDownload(file)}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsRenaming(true)}
            className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg"
            title="Rename"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(file)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        
        {/* Expiration Info - Only show for free users */}
        {shouldShowExpirationInfo() && (
          <div className={`flex items-center justify-center gap-1 text-xs mt-2 p-2 rounded ${getExpirationColor()}`}>
            <Clock className="w-3 h-3" />
            <span className="font-medium">
              {getExpirationText()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileCard;
