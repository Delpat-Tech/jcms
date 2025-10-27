import React, { useEffect, useState } from "react";

const CollectionViewer = () => {
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);

  const COLLECTION_URL =
    "http://localhost:5000/api/public/collection/catcollection-qxxc";

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

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-2 text-gray-800">
        Collection: {collection.name}
      </h1>
      <p className="text-gray-600 mb-6">{collection.description}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {collection.items.map((item, idx) => (
          <div
            key={idx}
            className="border rounded-xl shadow-sm bg-white overflow-hidden transition-all hover:shadow-lg hover:scale-[1.01]"
          >
            {/* For Image Type */}
            {item.type === "image" && (
              <div>
                <img
                  src={item.fileUrl}
                  alt={item.title}
                  className="w-full h-44 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-1 text-gray-800">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Index: {item.index} | Type: {item.type}
                  </p>
                </div>
              </div>
            )}

            {/* For JSON Type */}
            {item.type === "json" && (
              <div className="p-4">
                {/* Display picture */}
                {item.pic && item.pic !== "url" && (
                  <img
                    src={item.pic}
                    alt={item.name || "User"}
                    className="w-full h-36 object-cover rounded-md mb-3"
                    onError={(e) => (e.target.style.display = "none")}
                  />
                )}

                {/* Name & Bio */}
                <div className="mb-2">
                  {item.name && (
                    <h4 className="text-lg font-semibold text-gray-800">
                      {item.name}
                    </h4>
                  )}
                  {item.bio && (
                    <p className="text-sm text-gray-600 mb-1">{item.bio}</p>
                  )}
                </div>

                {/* Other key-value data */}
                <div className="mt-1 text-xs text-gray-500 space-y-1">
                  {Object.entries(item).map(([key, value]) => {
                    if (["name", "bio", "pic", "index", "type"].includes(key)) return null;
                    return (
                      <div key={key}>
                        <strong>{key}:</strong> {String(value)}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CollectionViewer;