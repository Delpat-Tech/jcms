import React, { useEffect, useState } from "react";

function CollectionViewer() {
  const [collectionData, setCollectionData] = useState(null);
  const [loading, setLoading] = useState(true);


  // Collection ID from content dashboard
  const collectionId = "68d66d7e5538825f8ecb25d2";
  
  // Specify the indices you want to display (null = show all)
  const selectedIndices = null; // Use null for all, or [1,2,3] for specific indices

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Login first to get token
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const loginRes = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: 'superadmin',
            password: 'admin123'
          })
        });
        
        const loginResult = await loginRes.json();
        if (!loginResult.success) {
          throw new Error('Login failed: ' + loginResult.message);
        }
        
        const token = loginResult.token;
        
        // Fetch collection data
        const collectionRes = await fetch(`${API_URL}/api/image-management/collections/${collectionId}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!collectionRes.ok) {
          throw new Error(`HTTP ${collectionRes.status}`);
        }
        
        const result = await collectionRes.json();
        console.log('Collection result:', result);
        
        // Transform to match expected structure and fix URLs
        const transformedData = {
          name: result.data.collection.name,
          description: result.data.collection.description,
          items: result.data.images.map(item => ({
            ...item,
            fileUrl: item.fileUrl?.startsWith('/') 
              ? `${API_URL}${item.fileUrl}`
              : item.fileUrl?.replace(/https?:\/\/[^/]+/, API_URL) || item.fileUrl
          }))
        };
        
        setCollectionData(transformedData);
        setLoading(false);
        
      } catch (err) {
        console.error("Error:", err);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) {
    return <div style={{ padding: "20px" }}>Loading collection...</div>;
  }

  if (!collectionData) {
    return <div style={{ padding: "20px" }}>Failed to load collection</div>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>📁 Collection: {collectionData.name}</h2>
      <p>{collectionData.description}</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px", marginTop: "20px" }}>
        {(selectedIndices ? collectionData.items.filter(item => selectedIndices.includes(item.index)) : collectionData.items).map((item) => (
          <div
            key={item.index}
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "15px",
              backgroundColor: "#fff",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            }}
          >
            <h3>{item.title}</h3>
            <p style={{ color: "#666", fontSize: "14px" }}>{item.notes}</p>
            
            {item.type === 'image' ? (
              <>
                <img
                  src={item.fileUrl?.startsWith('/') 
                    ? `${API_URL}${item.fileUrl}`
                    : item.fileUrl?.replace(/https?:\/\/[^/]+/, API_URL) || item.fileUrl}
                  alt={item.title}
                  style={{ 
                    width: "100%", 
                    height: "200px", 
                    borderRadius: "6px", 
                    objectFit: "cover",
                    marginTop: "10px"
                  }}
                  onError={(e) => {
                    const fallbacks = [
                      `${API_URL}/api/files/${item.fileUrl.split('/').pop()}`,
                      `${API_URL}/uploads/${item.fileUrl.split('/').pop()}`,
                      `${API_URL}/api/public/files/${item.fileUrl.split('/').pop()}`,
                      `${API_URL}/static/${item.fileUrl.split('/').pop()}`
                    ];
                    
                    const currentIndex = fallbacks.indexOf(e.target.src);
                    if (currentIndex < fallbacks.length - 1) {
                      e.target.src = fallbacks[currentIndex + 1];
                    } else {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }
                  }}
                />
                <div style={{
                  display: 'none',
                  padding: '20px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  textAlign: 'center',
                  marginTop: '10px'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '10px' }}>🖼️</div>
                  <p>Image not available</p>
                </div>
              </>
            ) : (
              <div style={{ 
                padding: '20px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '6px', 
                textAlign: 'center',
                marginTop: "10px"
              }}>
                <div style={{ fontSize: "48px", marginBottom: "10px" }}>📄</div>
                <p><strong>{item.format?.toUpperCase()} File</strong></p>
                <a 
                  href={item.fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    color: '#007bff', 
                    textDecoration: 'underline',
                    fontSize: "14px"
                  }}
                >
                  Open {item.format} file
                </a>
              </div>
            )}
            
            <div style={{ 
              marginTop: "10px", 
              padding: "8px", 
              backgroundColor: "#f0f0f0", 
              borderRadius: "4px",
              fontSize: "12px"
            }}>
              <strong>Index:</strong> {item.index} | <strong>Type:</strong> {item.type || 'file'}
              {item.format && <span> | <strong>Format:</strong> {item.format}</span>}
            </div>
          </div>
        ))}
      </div>

      {collectionData.items.length === 0 && (
        <div style={{ 
          textAlign: "center", 
          padding: "40px", 
          color: "#666",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          marginTop: "20px"
        }}>
          No items found in this collection
        </div>
      )}
    </div>
  );
}

export default CollectionViewer;