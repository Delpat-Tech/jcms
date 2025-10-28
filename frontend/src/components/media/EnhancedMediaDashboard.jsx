// components/media/EnhancedMediaDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Grid, List, Upload } from 'lucide-react';
import UploadPanel from './UploadPanel';
import FileCard from './FileCard';
import PreviewModal from './PreviewModal';
import TrioLoader from '../ui/TrioLoader.jsx';
import { imageApi, fileApi, contentApi, imageManagementApi } from '../../api';
import BulkActions from './BulkActions.jsx';
import { useToasts } from '../util/Toasts.jsx';
import { TriangleAlert } from 'lucide-react';
import CollectionSelectorModal from '../CollectionSelectorModal.jsx';

const EnhancedMediaDashboard = () => {
  const { addNotification } = useToasts() || { addNotification: () => {} };
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('uploaded');
  const [filterType, setFilterType] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [previewFile, setPreviewFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [idFilter, setIdFilter] = useState('');
  const [showCollectionSelector, setShowCollectionSelector] = useState(false);

  const toAbsoluteUrl = (maybeRelative) => {
    if (!maybeRelative) return '';
    if (/^https?:\/\//i.test(maybeRelative)) {
      // Replace old tunnel URLs with current one
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      return maybeRelative.replace(/https:\/\/[^.]+\.trycloudflare\.com/, API_URL);
    }
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    return `${API_URL}${maybeRelative.startsWith('/') ? maybeRelative : '/' + maybeRelative}`;
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
        if (imageResult?.success && Array.isArray(imageResult.data)) {
          const images = imageResult.data.map(img => ({
            ...img,
            type: 'image',
            fullUrl: toAbsoluteUrl(img.fileUrl || img.publicUrl),
            filename: img.title || img.filename || 'Untitled'
          }));
          allFiles = [...allFiles, ...images];
        }
      }
      
      if (filterType === 'all' || filterType !== 'image') {
        const fileResponse = await fileApi.getAll(ownerFilter === 'mine');
        const fileResult = await fileResponse.json();
        if (fileResult?.success && Array.isArray(fileResult.files)) {
          const otherFiles = fileResult.files.map(file => ({
            ...file,
            type: getFileType(file.filename),
            fullUrl: toAbsoluteUrl(file.fileUrl || file.publicUrl)
          }));
          allFiles = [...allFiles, ...otherFiles];
        }
      }
      
      setFiles(allFiles);
    } catch (error) {
      console.error('Error fetching files:', error);
      addNotification && addNotification('error', 'Failed to load files', error.message, true, 3000);
    } finally {
      setLoading(false);
    }
  }, [filterType, ownerFilter, addNotification]);

  useEffect(() => {
    fetchFiles();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
  }, [fetchFiles]);

  const filteredAndSortedFiles = files
    .filter(file => {
      if (searchQuery && !file.filename?.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !file.title?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (idFilter && !file._id?.includes(idFilter)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.filename || a.title || '').localeCompare(b.filename || b.title || '');
        case 'size':
          return (b.fileSize || 0) - (a.fileSize || 0);
        case 'uploaded':
        default:
          return new Date(b.createdAt || b.uploadDate || 0) - new Date(a.createdAt || a.uploadDate || 0);
      }
    });

  const handleFileSelect = (fileId) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  const handleBulkDownload = async () => {
    const selected = filteredAndSortedFiles.filter(f => selectedFiles.has(f._id));
    
    if (selected.length === 0) {
      addNotification && addNotification('warning', 'No files selected', 'Please select files to download', true, 2000);
      return;
    }

    addNotification && addNotification('info', 'Download started', `Starting download of ${selected.length} file(s)`, true, 2000);

    for (const file of selected) {
      try {
        const url = file.fullUrl;
        if (!url) {
          console.warn('No download URL for file:', file.filename || file.title);
          continue;
        }

        // Add a small delay between downloads to avoid overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 100));

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${file.filename}: ${response.status}`);
        }

        const blob = await response.blob();
        const downloadUrl = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = file.filename || file.title || `download_${file._id}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the blob URL
        URL.revokeObjectURL(downloadUrl);
        
      } catch (error) {
        console.error(`Download failed for ${file.filename}:`, error);
        // Fallback to direct link
        const link = document.createElement('a');
        link.href = file.fullUrl;
        link.download = file.filename || file.title || 'download';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }

    addNotification && addNotification('success', 'Downloads completed', `${selected.length} file(s) downloaded`, true, 3000);
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedFiles.size} selected file(s)?`)) return;
    
    try {
      const selected = filteredAndSortedFiles.filter(f => selectedFiles.has(f._id));
      const images = selected.filter(f => f.type === 'image');
      const otherFiles = selected.filter(f => f.type !== 'image');
      
      for (const img of images) {
        await imageApi.delete(img._id);
      }
      
      for (const file of otherFiles) {
        await fileApi.delete(file._id);
      }
      
      addNotification && addNotification('success', 'Files deleted', `${selected.length} file(s) deleted successfully`, true, 2500);
      setSelectedFiles(new Set());
      fetchFiles();
    } catch (error) {
      addNotification && addNotification('error', 'Delete failed', error.message, true, 3000);
    }
  };

  const handleSingleDelete = async (file) => {
    if (!window.confirm(`Delete "${file.filename || file.title}"?`)) return;
    
    try {
      if (file.type === 'image') {
        await imageApi.delete(file._id);
      } else {
        await fileApi.delete(file._id);
      }
      
      addNotification && addNotification('success', 'File deleted', 'File deleted successfully', true, 2500);
      fetchFiles();
    } catch (error) {
      addNotification && addNotification('error', 'Delete failed', error.message, true, 3000);
    }
  };

  const handleBulkClear = () => {
    setSelectedFiles(new Set());
  };

  // NEW: Enhanced Group to Content with Collection Selector
  const handleGroupToContent = async () => {
    try {
      const selected = filteredAndSortedFiles.filter(f => selectedFiles.has(f._id));
      if (selected.length === 0) return;
      
      const images = selected.filter(f => f.type === 'image');
      const files = selected.filter(f => f.type !== 'image');
      
      if (images.length === 0 && files.length === 0) {
        addNotification && addNotification('warning', 'No files selected', 'Select images or files to group into Content', true, 2500);
        return;
      }
      
      // Show collection selector modal
      setShowCollectionSelector(true);
    } catch (e) {
      addNotification && addNotification('error', 'Error opening collection selector', e.message || '', true, 3000);
    }
  };

  const handleCollectionSelected = (collection, result) => {
    const totalItems = result.data?.modifiedCount || 0;
    addNotification && addNotification('success', 'Items added to collection', 
      `${totalItems} item(s) added to "${collection.name}"`, true, 3000);
    setSelectedFiles(new Set());
    setShowCollectionSelector(false);
  };

  const getSelectedImageIds = () => {
    const selected = filteredAndSortedFiles.filter(f => selectedFiles.has(f._id));
    const images = selected.filter(f => f.type === 'image');
    return images.map(img => img._id);
  };

  const getSelectedFileIds = () => {
    const selected = filteredAndSortedFiles.filter(f => selectedFiles.has(f._id));
    const files = selected.filter(f => f.type !== 'image');
    return files.map(file => file._id);
  };

  return (
    <div className="flex h-full bg-gray-50 flex-col md:flex-row">
      {/* Left Panel */}
      <div className="w-full md:w-72 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900 mb-3">Media</h1>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filters Section */}
        <div className="p-4 space-y-4 border-b border-gray-200">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">View</label>
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Files</option>
              <option value="mine">My Files</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="audio">Audio</option>
              <option value="pdf">PDFs</option>
              <option value="json">JSON</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Sort</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="uploaded">Recent</option>
              <option value="name">Name</option>
              <option value="size">Size</option>
            </select>
          </div>

          {/* ID Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Filter by ID</label>
            <input
              type="text"
              placeholder="Enter file ID..."
              value={idFilter}
              onChange={(e) => setIdFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        {/* Upload Panel */}
        <div className="flex-1">
          <UploadPanel onUploadComplete={fetchFiles} currentFilter={filterType} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Bulk Actions */}
        {selectedFiles.size > 0 && (
          <BulkActions
            selectedCount={selectedFiles.size}
            onDownload={handleBulkDownload}
            onDelete={handleBulkDelete}
            onMove={() => {}}
            onClear={handleBulkClear}
            onGroup={handleGroupToContent}
          />
        )}

        {/* View Toggle */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-700">
                {filteredAndSortedFiles.length} {filteredAndSortedFiles.length === 1 ? 'file' : 'files'}
              </span>
              {selectedFiles.size > 0 && (
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  {selectedFiles.size} selected
                </span>
              )}
              <button
                onClick={fetchFiles}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                title="Refresh files"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                title="Grid view"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* File Grid */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <TrioLoader />
            </div>
          ) : filteredAndSortedFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Upload className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg font-medium text-gray-700">No files found</p>
              <p className="text-sm text-gray-500 mt-1">
                {searchQuery || idFilter ? 'Try adjusting your filters' : 'Upload files to get started'}
              </p>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
              : "space-y-2"
            }>
              {filteredAndSortedFiles.map(file => (
                <FileCard
                  key={file._id}
                  file={file}
                  viewMode={viewMode}
                  isSelected={selectedFiles.has(file._id)}
                  onSelect={handleFileSelect}
                  onPreview={setPreviewFile}
                  onDelete={handleSingleDelete}
                  currentUser={currentUser}
                  onUpdate={fetchFiles}
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
          onUpdate={fetchFiles}
        />
      )}

      {/* Collection Selector Modal */}
      <CollectionSelectorModal
        isOpen={showCollectionSelector}
        onClose={() => setShowCollectionSelector(false)}
        onSelectCollection={handleCollectionSelected}
        selectedImageIds={getSelectedImageIds()}
        selectedFileIds={getSelectedFileIds()}
        title="Add Items to Collection"
      />
    </div>
  );
};

export default EnhancedMediaDashboard;
