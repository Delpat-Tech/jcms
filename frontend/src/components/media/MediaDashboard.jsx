import React, { useState, useEffect, useCallback } from 'react';
import { Search, Grid, List, Upload } from 'lucide-react';
import UploadPanel from './UploadPanel';
import FileCard from './FileCard';
import PreviewModal from './PreviewModal';
import TrioLoader from '../ui/TrioLoader.jsx';
import { imageApi, fileApi } from '../../api';
import { useToasts } from '../util/Toasts.jsx';
import { TriangleAlert } from 'lucide-react';

const MediaDashboard = () => {
  const { addNotification } = useToasts() || { addNotification: () => {} };
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('uploaded');
  const [filterType, setFilterType] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all'); // 'all' or 'mine'
  const [previewFile, setPreviewFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  const toAbsoluteUrl = (maybeRelative) => {
    if (!maybeRelative) return '';
    if (/^https?:\/\//i.test(maybeRelative)) return maybeRelative;
    return `http://localhost:5000${maybeRelative}`;
  };

  const getFileType = (filename) => {
    if (!filename) return 'document';
    const ext = filename.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'].includes(ext)) return 'image';
    if (['mp4', 'avi', 'mov', 'wmv', 'webm'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(ext)) return 'audio';
    if (['pdf'].includes(ext)) return 'pdf';
    if (['json'].includes(ext)) return 'json';
    return 'document';
  };

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      let allFiles = [];
      
      if (filterType === 'all' || filterType === 'image') {
        const imageResponse = await imageApi.getAll(ownerFilter === 'mine');
        const imageResult = await imageResponse.json();
        if (imageResult.success) {
          allFiles = [...allFiles, ...(imageResult.data || []).map(file => ({ 
            ...file, 
            type: 'image',
            filename: file.title,
            size: file.fileSize || file.size || 0,
            fullUrl: toAbsoluteUrl(file.fileUrl),
            userInfo: file.user
          }))];
        }
      }
      
      if (filterType === 'all' || filterType !== 'image') {
        const fileResponse = await fileApi.getAll();
        const fileResult = await fileResponse.json();
        if (fileResult.success) {
          allFiles = [...allFiles, ...(fileResult.files || []).map(file => ({ 
            ...file, 
            type: getFileType(file.originalName || file.filename),
            filename: file.originalName || file.filename,
            title: file.title,
            size: file.fileSize || file.size || 0,
            fullUrl: toAbsoluteUrl(file.fileUrl || file.fullUrl)
          }))];
        }
      }
      
      setFiles(allFiles);
    } catch (error) {
      console.error('Error fetching files:', error);
      addNotification && addNotification('error', 'Failed to load files', error.message || '', true, 3000);
    } finally {
      setLoading(false);
    }
  }, [filterType, ownerFilter]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
    fetchFiles();
  }, [fetchFiles]);

  const filteredAndSortedFiles = files.filter(file => {
    const searchText = file.title || file.filename || '';
    const matchesSearch = searchText.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || file.type === filterType;
    return matchesSearch && matchesType;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.title || a.filename || '').localeCompare(b.title || b.filename || '');
      case 'size':
        return (b.size || 0) - (a.size || 0);
      case 'uploaded':
      case 'date':
      default:
        return new Date(b.createdAt || b.updatedAt) - new Date(a.createdAt || a.updatedAt);
    }
  });

  const handleFileSelect = (fileId, selected) => {
    const newSelected = new Set(selectedFiles);
    if (selected) {
      newSelected.add(fileId);
    } else {
      newSelected.delete(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const handleDeleteFile = async (file) => {
    const confirm = async () => {
      try {
        const response = file.type === 'image' 
          ? await imageApi.delete(file._id)
          : await fileApi.delete(file._id);
        const result = await response.json();
        if (result.success) {
          addNotification && addNotification('success', 'File deleted', '', true, 2000);
          fetchFiles();
        } else {
          addNotification && addNotification('error', 'Failed to delete file', result.message || '', true, 3000);
        }
      } catch (error) {
        addNotification && addNotification('error', 'Error deleting file', error.message || '', true, 3000);
      }
    };
    addNotification && addNotification(
      'warning',
      'Confirm delete',
      `Delete "${file.filename || file.title || 'file'}"?`,
      true,
      undefined,
      [
        { label: 'Cancel' },
        { label: 'Delete', variant: 'destructive', onClick: confirm }
      ],
      <TriangleAlert className="w-5 h-5 text-yellow-500" />
    );
  };

  const handleDownloadFile = (file) => {
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

  return (
    <div className="flex h-full bg-gray-50 flex-col md:flex-row">
      {/* Left Panel */}
      <div className="w-full md:w-80 bg-white border-b md:border-b-0 md:border-r border-gray-200 flex flex-col">
        <div className="p-6 space-y-6">
          <UploadPanel onUploadSuccess={fetchFiles} currentFilter={filterType} />
          
          {/* Owner Filter - Only show for admin/superadmin */}
          {currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin') && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">View</h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="ownerFilter"
                    value="all"
                    checked={ownerFilter === 'all'}
                    onChange={(e) => setOwnerFilter(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">All Files</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="ownerFilter"
                    value="mine"
                    checked={ownerFilter === 'mine'}
                    onChange={(e) => setOwnerFilter(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">My Files</span>
                </label>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">File Type</h3>
            <div className="space-y-2">
              {['all', 'image', 'video', 'audio', 'pdf', 'json'].map(type => (
                <label key={type} className="flex items-center">
                  <input
                    type="radio"
                    name="fileType"
                    value={type}
                    checked={filterType === type}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm text-gray-700 capitalize">
                    {type === 'all' ? 'All Files' : type === 'json' ? 'JSON' : `${type}s`}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Stats</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <div>Total: {files.length} files</div>
              <div>Selected: {selectedFiles.size} files</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
                />
              </div>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="uploaded">Recently Uploaded</option>
                <option value="name">Name</option>
                <option value="size">Size</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* File Grid/List */}
        <div className="flex-1 p-4 sm:p-6 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <TrioLoader size="48" color="#3b82f6" />
            </div>
          ) : filteredAndSortedFiles.length === 0 ? (
            <div className="text-center py-12">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No files</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery ? 'No files match your search.' : 'Get started by uploading a file.'}
              </p>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4' : 'space-y-2'}>
              {filteredAndSortedFiles.map((file) => (
                <FileCard
                  key={file._id}
                  file={file}
                  viewMode={viewMode}
                  selected={selectedFiles.has(file._id)}
                  onSelect={handleFileSelect}
                  onDelete={handleDeleteFile}
                  onDownload={handleDownloadFile}
                  onPreview={setPreviewFile}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewFile && (
        <PreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
};

export default MediaDashboard;