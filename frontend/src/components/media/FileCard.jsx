import React, { useState } from 'react';
import { Eye, Download, Edit3, Trash2, Play, FileText, Music, Archive } from 'lucide-react';

const FileCard = ({ file, viewMode, selected, onSelect, onPreview, onDelete, onDownload }) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(file.title || '');

  const handleDelete = async (file) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      onDelete?.(file);
    }
  };

  const handleDownload = (file) => {
    const url = file.fileUrl || file.fullUrl;
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = file.filename || file.title || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
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
    if (!bytes) return '0 B';
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
          onChange={(e) => onSelect(e.target.checked)}
          className="w-4 h-4 text-blue-600 mr-4"
        />
        
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
          {(file.fileUrl || file.fullUrl) && file.type === 'image' ? (
            <img src={file.fileUrl || file.fullUrl} alt={file.title || file.filename} className="w-full h-full object-cover rounded-lg" />
          ) : (
            getFileIcon(file.type)
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 truncate">{file.title || file.filename}</h3>
          <p className="text-xs text-gray-500">
            {file.format?.toUpperCase()} • {formatFileSize(file.size)} • {formatDate(file.createdAt)}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={onPreview}
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
      </div>
    );
  }

  return (
    <div className={`
      bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow
      ${selected ? 'ring-2 ring-blue-500' : ''}
    `}>
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-100 rounded-t-xl overflow-hidden">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelect(e.target.checked)}
          className="absolute top-3 left-3 w-4 h-4 text-blue-600 z-10"
        />
        
        {(file.fileUrl || file.fullUrl) && file.type === 'image' ? (
          <img 
            src={file.fileUrl || file.fullUrl} 
            alt={file.title || file.filename}
            className="w-full h-full object-cover cursor-pointer"
            onClick={onPreview}
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center cursor-pointer"
            onClick={onPreview}
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
        <p className="text-xs text-gray-500 mb-3">
          {formatFileSize(file.size)} • {formatDate(file.createdAt)}
        </p>
        
        {/* Owner */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
            {file.tenantName || 'System'}
          </span>
        </div>
        
        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            <button
              onClick={onPreview}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
              title="Preview"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDownload(file)}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsRenaming(true)}
              className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg"
              title="Rename"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
          
          <button
            onClick={() => handleDelete(file)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileCard;