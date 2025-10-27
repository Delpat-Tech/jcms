import React, { useState } from 'react';

const JsonUploadTest = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a JSON file');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Login first
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const loginRes = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'superadmin',
          password: 'admin123'
        })
      });

      const loginResult = await loginRes.json();
      if (!loginResult.success) {
        throw new Error('Login failed');
      }

      // Upload file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name);
      formData.append('notes', 'Test JSON upload with automatic processing');

      const uploadRes = await fetch(`${API_URL}/api/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${loginResult.token}`
        },
        body: formData
      });

      const uploadResult = await uploadRes.json();
      if (!uploadResult.success) {
        throw new Error(uploadResult.message);
      }

      setResult(uploadResult);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const createSampleJson = () => {
    const sampleData = [
      {
        name: "John Doe",
        age: 30,
        email: "john@example.com",
        bio: "Software developer with 5 years experience",
        pic: "https://via.placeholder.com/150"
      },
      {
        name: "Jane Smith", 
        age: 25,
        email: "jane@example.com",
        bio: "UI/UX designer passionate about user experience",
        pic: "https://via.placeholder.com/150"
      },
      {
        name: "Bob Johnson",
        age: 35,
        email: "bob@example.com", 
        bio: "Project manager with expertise in agile methodologies",
        pic: "https://via.placeholder.com/150"
      }
    ];

    const blob = new Blob([JSON.stringify(sampleData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-users.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>JSON Upload Test</h2>
      <p>Upload a JSON file to test automatic parsing and MongoDB document storage.</p>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={createSampleJson}
          style={{
            padding: '10px 15px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '10px'
          }}
        >
          Download Sample JSON
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="file"
          accept=".json"
          onChange={handleFileChange}
          style={{ marginBottom: '10px' }}
        />
        <br />
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          style={{
            padding: '10px 20px',
            backgroundColor: uploading ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: uploading ? 'not-allowed' : 'pointer'
          }}
        >
          {uploading ? 'Uploading...' : 'Upload JSON'}
        </button>
      </div>

      {error && (
        <div style={{
          padding: '10px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          Error: {error}
        </div>
      )}

      {result && (
        <div style={{
          padding: '15px',
          backgroundColor: '#d4edda',
          color: '#155724',
          border: '1px solid #c3e6cb',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <h3>Upload Successful!</h3>
          <p><strong>Files uploaded:</strong> {result.summary.totalFiles}</p>
          <p><strong>File types:</strong> {result.summary.fileTypes.join(', ')}</p>
          
          {result.files.map((file, index) => (
            <div key={index} style={{ marginTop: '10px', padding: '10px', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '4px' }}>
              <p><strong>File:</strong> {file.title}</p>
              <p><strong>Format:</strong> {file.format}</p>
              <p><strong>Size:</strong> {file.fileSizeFormatted}</p>
              {file.jsonProcessing && (
                <div style={{ marginTop: '10px' }}>
                  <p><strong>JSON Processing:</strong></p>
                  {file.jsonProcessing.success ? (
                    <p style={{ color: '#155724' }}>
                      ✅ Successfully created {file.jsonProcessing.documentsCreated} MongoDB documents
                    </p>
                  ) : (
                    <p style={{ color: '#721c24' }}>
                      ❌ Processing failed: {file.jsonProcessing.error}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{
        padding: '15px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '4px'
      }}>
        <h4>How it works:</h4>
        <ol>
          <li>Upload a JSON file containing an array of objects</li>
          <li>The system automatically parses the JSON content</li>
          <li>Each object in the array is stored as a separate MongoDB document</li>
          <li>Documents can be retrieved via API endpoints</li>
          <li>The CollectionViewer component displays the parsed data</li>
        </ol>
      </div>
    </div>
  );
};

export default JsonUploadTest;