import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import { imageApi, fileApi } from '../../api';

const UploadPanel = ({ onUploadSuccess, currentFilter }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [format, setFormat] = useState('webp');
  const [isUploading, setIsUploading] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    const newFiles = Array.from(files).map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      type: file.type
    }));
    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const uploadFiles = async () => {
    if (!title.trim()) {
      alert('Title is required');
      return;
    }
    // If JSON filter is active and textarea has content, create a virtual .json file
    let filesToUpload = selectedFiles;
    if ((currentFilter === 'json') && jsonText.trim()) {
      try {
        // Validate JSON
        JSON.parse(jsonText);
      } catch (e) {
        alert('Invalid JSON. Please fix the syntax.');
        return;
      }
      const blob = new Blob([jsonText], { type: 'application/json' });
      const filename = `${title.trim().replace(/\s+/g, '_')}.json`;
      const virtualFile = new File([blob], filename, { type: 'application/json' });
      const vf = {
        id: Date.now() + Math.random(),
        file: virtualFile,
        name: virtualFile.name,
        size: virtualFile.size,
        type: virtualFile.type
      };
      filesToUpload = [...selectedFiles, vf];
      setSelectedFiles(filesToUpload);
    }

    if (filesToUpload.length === 0) {
      alert('Please select files to upload');
      return;
    }
    
    setIsUploading(true);
    
    // Convert selected files to upload objects
    const newUploads = filesToUpload.map(file => ({
      id: file.id,
      file: file.file,
      progress: 0,
      status: 'uploading',
      error: null
    }));
    
    setUploads(newUploads);
    
    // Upload each file
    for (const upload of newUploads) {
      await uploadFile(upload);
    }
    
    setIsUploading(false);
    setSelectedFiles([]);
    setJsonText('');
  };
  
  const uploadFile = async (upload) => {
    try {
      const formData = new FormData();
      const isImage = upload.file.type.startsWith('image/');
      
      if (isImage) {
        formData.append('image', upload.file);
        formData.append('title', title.trim());
        formData.append('format', format);
        if (notes.trim()) {
          formData.append('notes', JSON.stringify({ description: notes.trim() }));
        }
      } else {
        formData.append('files', upload.file);
        formData.append('title', title.trim());
        if (notes.trim()) {
          formData.append('notes', notes.trim());
        }
      }

      const response = isImage 
        ? await imageApi.upload(formData)
        : await fileApi.upload(formData);

      const result = await response.json();
      
      if (result.success) {
        setUploads(prev => prev.map(u => 
          u.id === upload.id 
            ? { ...u, status: 'success', progress: 100 }
            : u
        ));
        onUploadSuccess?.();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      setUploads(prev => prev.map(u => 
        u.id === upload.id 
          ? { ...u, status: 'error', error: error.message }
          : u
      ));
    }
  };

  const removeSelectedFile = (fileId) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
  };
  
  const removeUpload = (uploadId) => {
    setUploads(prev => prev.filter(u => u.id !== uploadId));
  };
  
  const clearAll = () => {
    setSelectedFiles([]);
    setUploads([]);
    setTitle('');
    setNotes('');
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl p-6 text-center transition-colors
          ${isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300'
          }
        `}
      >
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-900 mb-1">
          Drop files here
        </p>
        <p className="text-xs text-gray-500 mb-4">
          Images go to /api/images, other files to /api/files
        </p>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Choose Files
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.json,application/json"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Title, Notes and Format Controls */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter title for uploaded files"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add description or notes about the files"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {currentFilter === 'json' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                JSON Content
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const template = [
                      { name: "Akash", bio: "Hello", pic: "url" },
                      { name: "Akash", bio: "Hello", pic: "url" },
                      { name: "Akash", bio: "Hello", pic: "url" },
                      { name: "Akash", bio: "Hello", pic: "url" },
                      { name: "Akash", bio: "Hello", pic: "url" },
                      { name: "Akash", bio: "Hello", pic: "url" },
                      { name: "Akash", bio: "Hello", pic: "url" }
                    ];
                    setJsonText(JSON.stringify(template, null, 2));
                  }}
                  className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  Use Template
                </button>
                <button
                  type="button"
                  onClick={() => setJsonText('')}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Clear
                </button>
              </div>
            </div>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder={`[\n  { "name": "Akash", "bio": "Hello", "pic": "url" },\n  { "name": "John", "bio": "World", "pic": "url2" }\n]`}
              rows={12}
              className="w-full font-mono text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">If provided, this will be uploaded as a .json file named after the title.</p>
              <div className="text-xs text-gray-400">
                {jsonText.trim() && (
                  <span>Characters: {jsonText.length}</span>
                )}
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Format
          </label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="webp">WebP</option>
            <option value="jpeg">JPEG</option>
            <option value="png">PNG</option>
            <option value="avif">AVIF</option>
          </select>
        </div>
        
        {/* Upload Button */}
        {(selectedFiles.length > 0 || (currentFilter === 'json' && jsonText.trim())) && (
          <div className="flex items-center space-x-2">
            <button
              onClick={uploadFiles}
              disabled={isUploading || !title.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
            <button
              onClick={clearAll}
              disabled={isUploading}
              className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 rounded-lg transition-colors"
            >
              Clear
            </button>
          </div>
        )}
      </div>
      
      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Selected Files</h4>
          {selectedFiles.map(file => (
            <div key={file.id} className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </span>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  onClick={() => removeSelectedFile(file.id)}
                  disabled={isUploading}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Uploads</h4>
          {uploads.map(upload => (
            <div key={upload.id} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 truncate">
                  {upload.file.name}
                </span>
                <button
                  onClick={() => removeUpload(upload.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                {upload.status === 'uploading' && (
                  <>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${upload.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{upload.progress}%</span>
                  </>
                )}
                
                {upload.status === 'success' && (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    <span className="text-xs">Complete</span>
                  </div>
                )}
                
                {upload.status === 'error' && (
                  <div className="flex items-center text-red-600">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    <span className="text-xs">{upload.error}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UploadPanel;