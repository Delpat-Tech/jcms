// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import UserLayout from '../layout.tsx';
import RichTextEditor from "../../components/content/RichTextEditor.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/ui/Modal.jsx";
import DashboardWidget, { ListWidget } from "../../components/common/DashboardWidget.jsx";

export default function UserContentPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("<p>Start writing...</p>");
  const [type, setType] = useState("article"); // article | page | template
  const [status, setStatus] = useState("draft"); // draft | published | scheduled
  const [scheduleAt, setScheduleAt] = useState("");
  const [coverImage, setCoverImage] = useState(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  // Management lists
  const [allContentFiles, setAllContentFiles] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);

  const apiBase = useMemo(() => (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) ? process.env.REACT_APP_API_URL : '', []);
  const authHeaders = () => ({ 'Authorization': `Bearer ${localStorage.getItem('token')}` });

  const slugify = (text) => (text || "untitled").toString().toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/&/g, '-and-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');

  const buildContentPayload = () => ({
    title,
    type,
    status,
    scheduleAt: status === 'scheduled' ? scheduleAt || null : null,
    coverImageUrl: coverImageUrl || null,
    bodyHtml: content,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  });

  const uploadJsonAsFile = async (payload, filenameBase) => {
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const file = new File([blob], `${filenameBase}.json`, { type: 'application/json' });

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${apiBase}/api/files/upload-single`, {
      method: 'POST',
      headers: authHeaders(),
      body: formData,
    });
    return res.json();
  };

  const handleUploadCover = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setCoverUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`${apiBase}/api/images`, {
        method: 'POST',
        headers: authHeaders(),
        body: formData,
      });
      const data = await res.json();
      if (data && (data.url || data.image?.url)) {
        setCoverImageUrl(data.url || data.image.url);
        setCoverImage(file);
      } else {
        setError('Failed to upload cover image');
      }
    } catch (err) {
      setError('Failed to upload cover image');
    } finally {
      setCoverUploading(false);
    }
  };

  const save = async (nextStatus) => {
    setSaving(true);
    setError(null);
    setSuccess("");
    try {
      const filenameBase = `${slugify(title)}-${nextStatus || status}-${Date.now()}`;
      const payload = buildContentPayload();
      payload.status = nextStatus || status;
      const result = await uploadJsonAsFile(payload, filenameBase);
      if (result && (result.success || result.file || result.id)) {
        setSuccess(nextStatus === 'published' ? 'Published successfully' : nextStatus === 'scheduled' ? 'Scheduled successfully' : 'Draft saved');
        await fetchContentList();
      } else {
        setError('Failed to save content');
      }
    } catch (err) {
      setError('Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    setPreviewOpen(true);
  };

  const handleSaveDraft = () => save('draft');
  const handlePublish = () => save('published');
  const handleSchedule = () => {
    if (!scheduleAt) {
      setError('Please choose a schedule date/time');
      return;
    }
    save('scheduled');
  };

  // Management list: fetch files and pick JSON content files
  const fetchContentList = async () => {
    setListLoading(true);
    setListError(null);
    try {
      const res = await fetch(`${apiBase}/api/files`, { headers: authHeaders() });
      const data = await res.json();
      const files = Array.isArray(data) ? data : (data.files || []);
      // Filter JSON files that look like our content payloads
      const jsonFiles = files.filter(f => (f.mimetype?.includes('json') || f.mimeType?.includes('json') || (f.originalName || f.name || '').endsWith('.json')));
      // Attempt to parse stored metadata if available; fallback to deriving from filename
      // If backend returns file content URLs, we could fetch and parse; to keep efficient, we rely on name pattern
      const items = jsonFiles.map(f => {
        const name = f.originalName || f.name || '';
        const parts = name.replace(/\.json$/i, '').split('-');
        const derivedStatus = parts.length >= 2 ? parts[parts.length - 2] : 'draft';
        return {
          id: f._id || f.id,
          name,
          status: derivedStatus,
          createdAt: f.createdAt,
          url: f.url || f.path || '',
        };
      });
      setAllContentFiles(items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)));
    } catch (e) {
      setListError('Failed to load content list');
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchContentList();
  }, []);

  const drafts = allContentFiles.filter(i => i.status === 'draft');
  const published = allContentFiles.filter(i => i.status === 'published');
  const scheduled = allContentFiles.filter(i => i.status === 'scheduled');

  const handleDelete = async (fileId) => {
    try {
      await fetch(`${apiBase}/api/files/${fileId}`, { method: 'DELETE', headers: authHeaders() });
      await fetchContentList();
    } catch (e) {
      // ignore
    }
  };

  const loadIntoEditor = async (file) => {
    // If a URL is available, attempt to fetch JSON and load
    if (!file.url) return;
    try {
      const res = await fetch(file.url, { headers: authHeaders() });
      const data = await res.json();
      setTitle(data.title || '');
      setContent(data.bodyHtml || '<p></p>');
      setType(data.type || 'article');
      setStatus(data.status || 'draft');
      setScheduleAt(data.scheduleAt || '');
      setCoverImageUrl(data.coverImageUrl || '');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      // ignore
    }
  };

  return (
    <UserLayout title="Content Editor">
      <div className="space-y-8">
        {/* Editor */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-700">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter title"
                  className="w-full border rounded-md px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-700">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                >
                  <option value="article">Article</option>
                  <option value="page">Page</option>
                  <option value="template">Template</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-700">Content</label>
                <RichTextEditor value={content} onChange={setContent} />
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-700">Cover Image</label>
                <input type="file" accept="image/*" onChange={handleUploadCover} />
                {coverUploading && <div className="text-xs text-gray-500">Uploading...</div>}
                {coverImageUrl && (
                  <img src={coverImageUrl} alt="cover" className="mt-2 rounded border max-h-40 object-cover" />
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-700">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>

              {status === 'scheduled' && (
                <div className="space-y-2">
                  <label className="text-sm text-gray-700">Schedule At</label>
                  <input
                    type="datetime-local"
                    value={scheduleAt}
                    onChange={(e) => setScheduleAt(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                </div>
              )}

              {error && <div className="text-sm text-red-600">{error}</div>}
              {success && <div className="text-sm text-green-600">{success}</div>}

              <div className="flex flex-wrap gap-2 justify-end">
                <Button variant="secondary" onClick={handlePreview}>Preview</Button>
                <Button onClick={handleSaveDraft} disabled={saving}>{saving ? 'Saving...' : 'Save Draft'}</Button>
                <Button onClick={handlePublish} disabled={saving}>Publish</Button>
                {status === 'scheduled' && (
                  <Button onClick={handleSchedule} disabled={saving || !scheduleAt}>Schedule</Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Management Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <DashboardWidget title="Drafts" variant="list" onRefresh={fetchContentList} loading={listLoading} error={listError}>
            {drafts.length === 0 && <div className="text-sm text-gray-500">No drafts</div>}
            {drafts.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div className="text-sm text-gray-800 truncate">{item.name}</div>
                <div className="flex items-center gap-2">
                  {item.url && <Button size="sm" variant="secondary" onClick={() => loadIntoEditor(item)}>Load</Button>}
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>Delete</Button>
                </div>
              </div>
            ))}
          </DashboardWidget>

          <DashboardWidget title="Published" variant="list" onRefresh={fetchContentList} loading={listLoading} error={listError}>
            {published.length === 0 && <div className="text-sm text-gray-500">No published items</div>}
            {published.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div className="text-sm text-gray-800 truncate">{item.name}</div>
                <div className="flex items-center gap-2">
                  {item.url && <a className="text-indigo-600 text-sm" href={item.url} target="_blank" rel="noreferrer">View</a>}
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>Delete</Button>
                </div>
              </div>
            ))}
          </DashboardWidget>

          <DashboardWidget title="Scheduled" variant="list" onRefresh={fetchContentList} loading={listLoading} error={listError}>
            {scheduled.length === 0 && <div className="text-sm text-gray-500">No scheduled items</div>}
            {scheduled.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div className="text-sm text-gray-800 truncate">{item.name}</div>
                <div className="flex items-center gap-2">
                  {item.url && <Button size="sm" variant="secondary" onClick={() => loadIntoEditor(item)}>Load</Button>}
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>Delete</Button>
                </div>
              </div>
            ))}
          </DashboardWidget>
        </div>

        <Modal isOpen={previewOpen} onClose={() => setPreviewOpen(false)} title="Preview">
          <div className="space-y-3">
            <div className="text-lg font-semibold">{title || 'Untitled'}</div>
            {coverImageUrl && <img src={coverImageUrl} alt="cover" className="rounded border max-h-64 object-cover" />}
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
          </div>
        </Modal>
      </div>
    </UserLayout>
  );
}
