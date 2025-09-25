import React, { useEffect, useState } from "react";
import Layout from "../../components/shared/Layout.jsx";
import RichTextEditor from "../../components/content/RichTextEditor.jsx";
import Button from "../../components/ui/Button.jsx";
import { contentApi } from "../../api";

function ContentList({ contents, onSelect, selectedId, onDelete, onFilter, filter }) {
  return (
    <div className="w-full md:w-80 bg-white border-r h-full flex flex-col">
      <div className="p-4 border-b flex flex-col gap-2">
        <input
          type="text"
          placeholder="Search..."
          className="w-full px-2 py-1 border rounded"
          onChange={e => onFilter({ ...filter, search: e.target.value })}
          value={filter.search || ''}
        />
        <select
          className="w-full px-2 py-1 border rounded"
          value={filter.status || ''}
          onChange={e => onFilter({ ...filter, status: e.target.value })}
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="scheduled">Scheduled</option>
        </select>
        <Button size="sm" onClick={() => onSelect(null)}>+ New Content</Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {contents.length === 0 ? (
          <div className="p-4 text-gray-500">No content found.</div>
        ) : (
          <ul>
            {contents.map(c => (
              <li
                key={c._id}
                className={`p-4 border-b cursor-pointer ${selectedId === c._id ? 'bg-indigo-50' : ''}`}
                onClick={() => onSelect(c._id)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-sm">{c.title || '(Untitled)'}</div>
                    <div className="text-xs text-gray-500">{c.status} • {new Date(c.updatedAt).toLocaleString()}</div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); onDelete(c._id); }}>Delete</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ContentEditor({ content, onChange, onSave, onPreview, saving }) {
  if (!content) return null;
  return (
    <form className="p-6 space-y-4" onSubmit={e => { e.preventDefault(); onSave(); }}>
      <div>
        <input
          className="w-full border px-3 py-2 rounded mb-2"
          placeholder="Title"
          value={content.title}
          onChange={e => onChange({ ...content, title: e.target.value })}
          required
        />
        <input
          className="w-full border px-3 py-2 rounded mb-2"
          placeholder="Excerpt"
          value={content.excerpt || ''}
          onChange={e => onChange({ ...content, excerpt: e.target.value })}
        />
        <input
          className="w-full border px-3 py-2 rounded mb-2"
          placeholder="Tags (comma separated)"
          value={content.tags?.join(', ') || ''}
          onChange={e => onChange({ ...content, tags: e.target.value.split(',').map(t => t.trim()) })}
        />
        <select
          className="w-full border px-3 py-2 rounded mb-2"
          value={content.status}
          onChange={e => onChange({ ...content, status: e.target.value })}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="scheduled">Scheduled</option>
        </select>
      </div>
      <RichTextEditor value={content.content} onChange={val => onChange({ ...content, content: val })} />
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="secondary" onClick={onPreview}>Preview</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
      </div>
    </form>
  );
}

function PreviewModal({ open, content, onClose }) {
  if (!open) return null;
  
  // Process content to ensure images are properly displayed
  const processContent = (htmlContent) => {
    if (!htmlContent) return '';
    
    let processedContent = htmlContent;
    const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    
    // Debug: Log the original content to see what image URLs look like
    console.log('Original content:', htmlContent);
    
    // Handle different image URL patterns
    // 1. Images with fileUrl paths (from database)
    processedContent = processedContent.replace(
      /src="([^"]*fileUrl[^"]*)"/g,
      (match, url) => {
        console.log('Found fileUrl image:', url);
        if (!url.startsWith('http')) {
          const newUrl = `${apiBase}${url.startsWith('/') ? '' : '/'}${url}`;
          console.log('Converted to:', newUrl);
          return `src="${newUrl}"`;
        }
        return match;
      }
    );
    
    // 2. Images with /api/images/ paths
    processedContent = processedContent.replace(
      /src="\/api\/images\/([^"]*)"/g,
      (match, imageId) => {
        console.log('Found /api/images/ image:', imageId);
        const newUrl = `${apiBase}/api/images/${imageId}`;
        console.log('Converted to:', newUrl);
        return `src="${newUrl}"`;
      }
    );
    
    // 3. Images that might be using relative paths
    processedContent = processedContent.replace(
      /src="(?!http)([^"]*\.(jpg|jpeg|png|gif|webp|avif)[^"]*)"/g,
      (match, url) => {
        console.log('Found relative image:', url);
        if (!url.startsWith('http') && !url.startsWith('/api/')) {
          const newUrl = `${apiBase}${url.startsWith('/') ? '' : '/'}${url}`;
          console.log('Converted to:', newUrl);
          return `src="${newUrl}"`;
        }
        return match;
      }
    );
    
    console.log('Processed content:', processedContent);
    return processedContent;
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button className="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-xl" onClick={onClose}>✕</button>
        <h2 className="text-2xl font-bold mb-2">{content.title}</h2>
        <div className="mb-4 text-gray-500 text-sm">{content.excerpt}</div>
        <div className="prose max-w-none prose-img:max-w-full prose-img:h-auto" 
             dangerouslySetInnerHTML={{ __html: processContent(content.content) }} />
      </div>
    </div>
  );
}

export default function ContentPage() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const [contents, setContents] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [editorContent, setEditorContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState({ status: '', search: '' });
  const [previewOpen, setPreviewOpen] = useState(false);

  // Fetch content list
  useEffect(() => {
    const fetchContents = async () => {
      setLoading(true);
      try {
        let res = await contentApi.getAll();
        let data = await res.json();
        if (data.success) {
          let filtered = data.data;
          if (filter.status) filtered = filtered.filter(c => c.status === filter.status);
          if (filter.search) filtered = filtered.filter(c => (c.title || '').toLowerCase().includes(filter.search.toLowerCase()));
          setContents(filtered);
        }
      } catch (e) {
        setContents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchContents();
  }, [filter]);

  // Load content into editor
  useEffect(() => {
    if (selectedId) {
      (async () => {
        const res = await contentApi.getById(selectedId);
        const data = await res.json();
        if (data.success) setEditorContent(data.data);
      })();
    } else {
      setEditorContent({ title: '', content: '', excerpt: '', tags: [], status: 'draft' });
    }
  }, [selectedId]);

  // CRUD handlers
  const handleSave = async () => {
    setSaving(true);
    try {
      if (editorContent._id) {
        await contentApi.update(editorContent._id, editorContent);
      } else {
        await contentApi.create(editorContent);
      }
      setSelectedId(null);
      setEditorContent({ title: '', content: '', excerpt: '', tags: [], status: 'draft' });
      // Refresh list
      const res = await contentApi.getAll();
      const data = await res.json();
      if (data.success) setContents(data.data);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this content?')) return;
    await contentApi.delete(id);
    setSelectedId(null);
    // Refresh list
    const res = await contentApi.getAll();
    const data = await res.json();
    if (data.success) setContents(data.data);
  };

  return (
    <Layout title="Content Management" user={user}>
      <div className="flex flex-col md:flex-row h-[80vh] bg-gray-50 rounded-lg overflow-hidden border">
        <div className="md:w-1/3 w-full h-1/2 md:h-full border-r bg-white">
          <ContentList
            contents={contents}
            onSelect={setSelectedId}
            selectedId={selectedId}
            onDelete={handleDelete}
            onFilter={setFilter}
            filter={filter}
          />
        </div>
        <div className="flex-1 h-1/2 md:h-full overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">Loading...</div>
          ) : (
            <ContentEditor
              content={editorContent}
              onChange={setEditorContent}
              onSave={handleSave}
              onPreview={() => setPreviewOpen(true)}
              saving={saving}
            />
          )}
        </div>
        <PreviewModal open={previewOpen} content={editorContent || {}} onClose={() => setPreviewOpen(false)} />
      </div>
    </Layout>
  );
}
