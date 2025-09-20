import React, { useState, useRef } from 'react';
import { Upload, X, Check } from 'lucide-react';
import { tenantApi } from '../api';
import TrioLoader from './ui/TrioLoader.jsx';

const TenantLogoEditor = ({ tenantId, currentLogo, onLogoUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('logo', file);

      const response = await tenantApi.uploadLogo(tenantId, formData);

      const result = await response.json();
      if (result.success) {
        onLogoUpdate?.(result.logo);
      } else {
        alert('Failed to upload logo: ' + result.message);
      }
    } catch (error) {
      alert('Error uploading logo: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) handleFileUpload(file);
  };

  return (
    <div className="tenant-logo-editor">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tenant Logo
        </label>
        
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {currentLogo?.url ? (
            <div className="space-y-4">
              <img 
                src={currentLogo.url} 
                alt="Current logo" 
                className="mx-auto h-20 w-auto object-contain"
              />
              <p className="text-sm text-gray-500">
                Current logo • Click or drag to replace
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-sm text-gray-600">
                Drop logo here or click to browse
              </p>
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading}
          />
          
          {uploading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
              <TrioLoader size="35" color="#3b82f6" />
            </div>
          )}
        </div>
        
        <p className="mt-2 text-xs text-gray-500">
          PNG, JPG, or SVG. Max 5MB. Recommended size: 200x200px
        </p>
      </div>
    </div>
  );
};

export default TenantLogoEditor;