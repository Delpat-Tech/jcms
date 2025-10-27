import React, { useEffect, useState } from "react";

const JsonDocumentViewer = ({ fileId }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!fileId) return;

    const fetchDocuments = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/json-documents/file/${fileId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch documents');
        }
        
        const data = await response.json();
        setDocuments(data.data || []);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [fileId]);

  if (loading) {
    return <div className="text-gray-500">Loading JSON documents...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!documents || documents.length === 0) {
    return <div className="text-gray-500">No documents found.</div>;
  }

  return (
    <div className="grid gap-4">
      <div className="text-sm text-gray-600 mb-2">
        Found {documents.length} document(s) from JSON file
      </div>
      {documents.map((doc, index) => (
        <div
          key={index}
          className="border rounded-lg p-3 bg-gray-50 shadow-sm hover:shadow-md transition-all"
        >
          {/* Display image if available */}
          {doc.pic && doc.pic !== "url" && (
            <img
              src={doc.pic}
              alt={doc.name || "Document"}
              className="w-full h-36 object-cover rounded-md mb-3"
              onError={(e) => (e.target.style.display = "none")}
            />
          )}

          {/* Display name and bio prominently */}
          <div className="mb-2">
            {doc.name && (
              <h4 className="text-lg font-semibold text-gray-800">
                {doc.name}
              </h4>
            )}
            {doc.bio && (
              <p className="text-sm text-gray-600 mb-1">{doc.bio}</p>
            )}
          </div>

          {/* Display other properties */}
          <div className="mt-1 text-xs text-gray-500 space-y-1">
            {Object.entries(doc).map(([key, value]) => {
              if (["name", "bio", "pic"].includes(key)) return null;
              return (
                <div key={key}>
                  <strong>{key}:</strong> {String(value)}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default JsonDocumentViewer;