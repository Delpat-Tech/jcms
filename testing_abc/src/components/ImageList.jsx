import React, { useEffect, useState } from "react";

function ImageList() {
  const [images, setImages] = useState([]);

  // Indices you want to display (1-based)
  const selectedIndices = [1,2,3,4];

  useEffect(() => {
    fetch(
      "http://localhost:5000/api/image-management/collections/68d56b74a918efc9d7329c8e"
    )
      .then((res) => res.json())
      .then((data) => {
        // Filter only the selected indices from the images array
        const filtered = data.data.images.filter((item) =>
          selectedIndices.includes(item.index)
        );

        setImages(filtered);
      })
      .catch((err) => console.error("Error fetching images:", err));
  }, []);

  return (
    <div>
      {images.map((img, idx) => (
        <div key={idx} style={{ marginBottom: "20px" }}>
          <h3>{img.title}</h3>
          <p>{img.notes}</p>
          <img src={img.fileUrl} alt={img.title} width="200" />
        </div>
      ))}
    </div>
  );
}

export default ImageList;
