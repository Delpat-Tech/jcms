// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
import UserLayout from '../layout.tsx';
import Button from '../../components/ui/Button.jsx';
import DashboardWidget from '../../components/common/DashboardWidget.jsx';
import Modal from '../../components/ui/Modal.jsx';

export default function UserMediaPage() {
  const [tab, setTab] = useState('images'); // images | files

  const [images, setImages] = useState([]);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [imagesError, setImagesError] = useState(null);

  const [files, setFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [filesError, setFilesError] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);

  const apiBase = useMemo(() => (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) ? process.env.REACT_APP_API_URL : '', []);
  const authHeaders = () => ({ 'Authorization': `Bearer ${localStorage.getItem('token')}` });

  const fetchImages = async () => {
    setImagesLoading(true);
    setImagesError(null);
    try {
      const res = await fetch(`${apiBase}/api/images`, { headers: authHeaders() });
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.images || []);
      setImages(list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)));
    } catch (e) {
      setImagesError('Failed to load images');
    } finally {
      setImagesLoading(false);
    }
  };

  const fetchFiles = async () => {
    setFilesLoading(true);
    setFilesError(null);
    try {
      const res = await fetch(`${apiBase}/api/files`, { headers: authHeaders() });
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.files || []);
      setFiles(list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)));
    } catch (e) {
      setFilesError('Failed to load files');
    } finally {
      setFilesLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
    fetchFiles();
  }, []);

  const handleUploadImages = async (e) => {
    const selected = e.target.files;
    if (!selected || selected.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      // use single or multiple depending on endpoint availability; imageRoutes supports single under 'image'
      // Upload each image individually for reliability
      for (let i = 0; i < selected.length; i++) {
        const fd = new FormData();
        fd.append('image', selected[i]);
        await fetch(`${apiBase}/api/images`, { method: 'POST', headers: authHeaders(), body: fd });
      }
      await fetchImages();
    } catch (e) {
      // ignore
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleUploadFiles = async (e) => {
    const selected = e.target.files;
    if (!selected || selected.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      // backend supports /upload-multiple with field 'files' up to 10
      for (let i = 0; i < selected.length; i++) {
        formData.append('files', selected[i]);
      }
      await fetch(`${apiBase}/api/files/upload-multiple`, { method: 'POST', headers: authHeaders(), body: formData });
      await fetchFiles();
    } catch (e) {
      // ignore
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteImage = async (id) => {
    try {
      await fetch(`${apiBase}/api/images/${id}`, { method: 'DELETE', headers: authHeaders() });
      await fetchImages();
    } catch (e) {
      // ignore
    }
  };

  const handleDeleteFile = async (id) => {
    try {
      await fetch(`${apiBase}/api/files/${id}`, { method: 'DELETE', headers: authHeaders() });
      await fetchFiles();
    } catch (e) {
      // ignore
    }
  };

  const openPreview = (item) => { setPreviewItem(item); setPreviewOpen(true); };

  return (
    <UserLayout title="Media Library">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Media Library</h1>
          <div className="flex gap-2 items-center">
            <div className="inline-flex rounded-md border bg-white">
              <button onClick={() => setTab('images')} className={`px-3 py-1.5 text-sm ${tab==='images' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'}`}>Images</button>
              <button onClick={() => setTab('files')} className={`px-3 py-1.5 text-sm ${tab==='files' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'}`}>Files</button>
            </div>
            {tab === 'images' ? (
              <label className="text-sm text-indigo-700 cursor-pointer">
                <input type="file" accept="image/*" multiple onChange={handleUploadImages} className="hidden" />
                Upload Images
              </label>
            ) : (
              <label className="text-sm text-indigo-700 cursor-pointer">
                <input type="file" multiple onChange={handleUploadFiles} className="hidden" />
                Upload Files
              </label>
            )}
          </div>
        </div>

        {tab === 'images' ? (
          <DashboardWidget title="Images" loading={imagesLoading} error={imagesError} onRefresh={fetchImages}>
            {uploading && <div className="text-xs text-gray-500 mb-2">Uploading...</div>}
            {images.length === 0 ? (
              <div className="text-sm text-gray-500">No images uploaded yet.</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {images.map(img => (
                  <div key={img._id || img.id} className="group border rounded-md overflow-hidden bg-white">
                    <div className="aspect-square bg-gray-50 overflow-hidden">
                      {img.url || img.path ? (
                        <img src={img.url || img.path} alt={img.originalName || 'image'} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No preview</div>
                      )}
                    </div>
                    <div className="p-2 text-xs flex items-center justify-between">
                      <button className="text-indigo-600" onClick={() => openPreview(img)}>Preview</button>
                      <button className="text-red-600" onClick={() => handleDeleteImage(img._id || img.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DashboardWidget>
        ) : (
          <DashboardWidget title="Files" loading={filesLoading} error={filesError} onRefresh={fetchFiles}>
            {uploading && <div className="text-xs text-gray-500 mb-2">Uploading...</div>}
            {files.length === 0 ? (
              <div className="text-sm text-gray-500">No files uploaded yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="py-2 pr-4">Name</th>
                      <th className="py-2 pr-4">Type</th>
                      <th className="py-2 pr-4">Uploaded</th>
                      <th className="py-2 pr-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map(f => (
                      <tr key={f._id || f.id} className="border-t">
                        <td className="py-2 pr-4 max-w-xs truncate">{f.originalName || f.name}</td>
                        <td className="py-2 pr-4">{f.mimetype || f.mimeType || '-'}</td>
                        <td className="py-2 pr-4">{f.createdAt ? new Date(f.createdAt).toLocaleString() : '-'}</td>
                        <td className="py-2 pr-4 text-right">
                          {f.url && (
                            <a className="text-indigo-600 mr-3" href={f.url} target="_blank" rel="noreferrer">Open</a>
                          )}
                          <button className="text-red-600" onClick={() => handleDeleteFile(f._id || f.id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DashboardWidget>
        )}

        <Modal isOpen={previewOpen} onClose={() => setPreviewOpen(false)} title="Preview">
          {previewItem ? (
            <div className="space-y-3">
              <div className="text-sm text-gray-600">{previewItem.originalName || previewItem.name}</div>
              {previewItem.url || previewItem.path ? (
                <img src={previewItem.url || previewItem.path} alt="preview" className="max-h-[70vh] w-auto object-contain rounded border" />
              ) : (
                <div className="text-sm text-gray-500">No preview available</div>
              )}
            </div>
          ) : null}
        </Modal>
      </div>
    </UserLayout>
  );
}