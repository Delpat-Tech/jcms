import React, { useEffect, useState } from "react";

const CollectionViewer = () => {
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Define which indexes to show (empty array means show all)
  const showIndexes = [];// Example: [1, 4] → only show index 1 and 4

  const COLLECTION_URL =
    "http://localhost:5000/api/public/collection/mycollection-7maf";

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        const res = await fetch(COLLECTION_URL);
        const data = await res.json();
        setCollection(data.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching collection:", error);
        setLoading(false);
      }
    };

    fetchCollection();
  }, []);

  if (loading) {
    return (
      <div className="text-center text-lg mt-10 animate-pulse">
        Loading collection...
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="text-center text-lg mt-10 text-red-500">
        Failed to load collection.
      </div>
    );
  }

  // 🔹 Filter items based on index array
  const filteredItems =
    showIndexes.length > 0
      ? collection.items.filter((item) => showIndexes.includes(item.index))
      : collection.items;

  return (
    <div className="p-6 bg-gray-50 min-h-screen w-full overflow-x-hidden">
      <h1 className="text-3xl font-bold mb-2 text-gray-800">
        Collection: {collection.name}
      </h1>
      <p className="text-gray-600 mb-6">{collection.description}</p>

      {filteredItems.length === 0 ? (
        <p className="text-center text-gray-500 text-lg">
          No items found for selected indexes.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-6 place-items-center">
          {filteredItems.map((item, idx) => {
            const imageSrc = item.pic || item.fileUrl;
            const title = item.title || item.name || "Untitled";

            return (
              <div
                key={`${item.index}-${item.type}-${idx}`}
                className="w-48 h-56 border-2 rounded-lg shadow-md bg-white overflow-hidden hover:shadow-lg transition-all"
              >
                <div className="flex flex-col items-center p-4">
                  {imageSrc && (
                    <img
                      src={imageSrc}
                      alt={title}
                      className="w-32 h-32 object-cover rounded mb-3"
                      style={{ width: '128px', height: '128px', maxWidth: '128px', maxHeight: '128px' }}
                      onError={(e) => (e.target.style.display = "none")}
                    />
                  )}

                  <h3 className="text-sm font-semibold text-gray-800 mb-2 truncate text-center">
                    {title}
                  </h3>

                  <p className="text-xs text-gray-400 text-center">
                    Index: {item.index}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CollectionViewer;
