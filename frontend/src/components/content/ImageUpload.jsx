import React, { useState } from 'react';
import { imageApi } from '../../api';

function ImageUpload({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [format, setFormat] = useState('webp');
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setTitle(selectedFile.name.split('.')[0]);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('title', title);
    formData.append('format', format);

    try {
      const response = await imageApi.upload(formData);
      const result = await response.json();
      
      if (result.success) {
        setFile(null);
        setTitle('');
        setPreview(null);
        document.getElementById('file-input').value = '';
        onUploadSuccess && onUploadSuccess(result.data);
      } else {
        alert('Upload failed: ' + result.message);
      }
    } catch (error) {
      alert('Upload error: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Upload Image</h3>
      
      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Image
          </label>
          <input
            id="file-input"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            required
          />
        </div>

        {preview && (
          <div className="mt-4">
            <img 
              src={preview} 
              alt="Preview" 
              className="max-w-xs max-h-48 object-contain border rounded"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Format
          </label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="webp">WebP</option>
            <option value="jpeg">JPEG</option>
            <option value="png">PNG</option>
            <option value="avif">AVIF</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={!file || uploading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : 'Upload Image'}
        </button>
      </form>
    </div>
  );
}

export default ImageUpload;