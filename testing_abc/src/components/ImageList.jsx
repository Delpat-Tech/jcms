import React, { useEffect, useState } from "react";
import { API_BASE_URL } from '../config.js';

function ImageList() {
  const [jsonData, setJsonData] = useState([]);

  // JSON file path
  const jsonFileUrl = "uploads/system/general/1758967622926.json";
  
  // Specify the indices you want to display (null = show all)
  const selectedIndices = null// Use null for all, or [1,2,4] for specific indices

  useEffect(() => {
    console.log('Using API URL:', process.env.REACT_APP_API_URL || 'http://localhost:5000');
    // Fetch JSON data
    fetch(`${API_BASE_URL}/${jsonFileUrl}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setJsonData(data);
      })
      .catch((err) => {
        console.error("Error fetching JSON:", err);
      });
  }, []);

  // Filter data based on selected indices
  const filteredData = selectedIndices ? jsonData.filter((item) => selectedIndices.includes(item.index)) : jsonData;

  return (
    <div style={{ padding: "20px" }}>
      <h2>📋 JSON Data Display</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "15px" }}>
        {filteredData.map((item) => (
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
            <h3>{item.name}</h3>
            <p>{item.bio}</p>
            <img
              src={item.pic}
              alt={item.name}
              style={{ width: "100%", borderRadius: "6px", objectFit: "cover" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default ImageList;
