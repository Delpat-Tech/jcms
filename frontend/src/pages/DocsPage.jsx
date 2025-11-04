import React, { useEffect } from 'react';

const DocsPage = () => {
  useEffect(() => {
    // Redirect to backend API documentation
    window.location.href = 'http://localhost:5000/docs/api-part1.html';
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2>Redirecting to API Documentation...</h2>
        <p style={{ marginTop: '10px', color: '#666' }}>If not redirected, <a href="http://localhost:5000/docs/api-part1.html" style={{ color: '#3b82f6' }}>click here</a></p>
      </div>
    </div>
  );
};

export default DocsPage;
