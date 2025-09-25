import React, { useEffect, useState } from "react";
import Layout from "../../components/shared/Layout.jsx";
import Button from "../../components/ui/Button.jsx";
import { contentApi } from "../../api";

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function AdminGalleriesPage() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await contentApi.getAll();
      const json = await res.json();
      const rows = (json?.data || []).filter((c: any) => Array.isArray(c.tags) && c.tags.includes('gallery'));
      setItems(rows);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const publish = async (id: string) => {
    await contentApi.publish(id);
    await load();
  };

  const copyLink = async (row: any) => {
    const slugOrId = row.slug || row._id;
    const url = `${window.location.origin}/g/${slugOrId}`;
    try { await navigator.clipboard.writeText(url); } catch {}
    alert(`Link copied: ${url}`);
  };

  return (
    <Layout title="Galleries" user={user}>
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Gallery Collections</h2>
          <Button size="sm" onClick={load}>Refresh</Button>
        </div>
        {loading ? (
          <div>Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-gray-500">No galleries found.</div>
        ) : (
          <div className="space-y-3">
            {items.map(row => (
              <div key={row._id} className="p-3 border rounded-md flex items-center justify-between">
                <div>
                  <div className="font-medium">{row.title}</div>
                  <div className="text-xs text-gray-500">Status: {row.status} • Updated: {new Date(row.updatedAt).toLocaleString()}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => copyLink(row)}>Copy Public Link</Button>
                  {row.status !== 'published' && (
                    <Button size="sm" onClick={() => publish(row._id)}>Publish</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
