import React, { useState, useEffect } from 'react';
import { Sparkles, Pencil, FileText, CheckCircle2, CalendarDays, Settings as SettingsIcon, Image as ImageIcon, Tags, Rocket, Eye, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UserLayout from '../layout';
import TrioLoader from '../../components/ui/TrioLoader';
import Modal from '../../components/ui/Modal';

// Simple Rich Text Editor Component
const RichTextEditor = ({ value, onChange, placeholder }) => {
  const editorRef = React.useRef(null);
  
  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  };
 
  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
    handleInput();
  };
  
  React.useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);
  
  return (
    <div className="border-2 border-gray-200 rounded-lg focus-within:border-indigo-500 transition-colors">
      <div className="border-b border-gray-200 p-2 flex flex-wrap gap-2">
        <button 
          type="button"
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          onClick={() => execCommand('bold')}
        >
          <strong>B</strong>
        </button>
        <button 
          type="button"
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          onClick={() => execCommand('italic')}
        >
          <em>I</em>
        </button>
        <button 
          type="button"
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          onClick={() => execCommand('underline')}
        >
          <u>U</u>
        </button>
        <button 
          type="button"
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          onClick={() => execCommand('insertUnorderedList')}
        >
          • List
        </button>
        <button 
          type="button"
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          onClick={() => execCommand('formatBlock', 'h3')}
        >
          H3
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        className="p-4 min-h-[300px] focus:outline-none prose max-w-none text-left"
        onInput={handleInput}
        onBlur={handleInput}
        style={{ 
          minHeight: '300px',
          direction: 'ltr',
          textAlign: 'left',
          unicodeBidi: 'normal'
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />
      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default function ContentEditor() {
  const navigate = useNavigate();
  
  // Tab management
  const [activeTab, setActiveTab] = useState('editor');
  
  // Editor state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [type, setType] = useState('article');
  const [status, setStatus] = useState('draft');
  const [scheduleAt, setScheduleAt] = useState('');
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [autoSave, setAutoSave] = useState(true);
  
  // UI state
  const [saving, setSaving] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [currentEditId, setCurrentEditId] = useState(null);
  
  // Content management state
  const [drafts, setDrafts] = useState([]);
  const [published, setPublished] = useState([]);
  const [scheduled, setScheduled] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState(null);
  
  // Computed values
  const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length;
  
  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !title.trim() || !content.trim()) return;
    
    const autoSaveTimer = setTimeout(() => {
      handleSaveDraft(true); // Silent save
    }, 30000); // Auto-save every 30 seconds
    
    return () => clearTimeout(autoSaveTimer);
  }, [title, content, autoSave]);
  
  // Load content lists when switching tabs
  useEffect(() => {
    if (activeTab !== 'editor') {
      fetchContentList();
    }
  }, [activeTab]);
  
  // API calls
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
  });
  
  // Show message helper
  const showMessage = (message, type = 'info') => {
    setSaveMessage(message);
    setTimeout(() => setSaveMessage(''), 3000);
  };
  
  // Tag management
  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };
  
  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  // Cover image upload
  const handleUploadCover = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setCoverUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const response = await fetch(`${API_BASE}/api/upload/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        setCoverImageUrl(data.url);
        showMessage('Cover image uploaded successfully!', 'success');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showMessage('Failed to upload cover image', 'error');
    } finally {
      setCoverUploading(false);
    }
  };
  
  // Content operations
  const handleSaveDraft = async (silent = false) => {
    if (!title.trim()) {
      if (!silent) showMessage('Please enter a title', 'error');
      return;
    }
    // Ensure there is actual content (strip HTML tags)
    const plainText = (content || '').replace(/<[^>]*>/g, '').trim();
    if (!plainText) {
      if (!silent) showMessage('Please add some content before saving a draft', 'error');
      return;
    }
    
    setSaving(true);
    const contentData = {
      title,
      content,
      excerpt,
      type,
      status: 'draft',
      tags,
      coverImageUrl,
      ...(currentEditId && { id: currentEditId })
    };
    
    try {
      const url = currentEditId 
        ? `${API_BASE}/api/content/${currentEditId}`
        : `${API_BASE}/api/content`;
      const method = currentEditId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(contentData),
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setCurrentEditId(result.id || result.data._id);
          if (!silent) showMessage('Draft saved successfully!', 'success');
          fetchContentList(); // Refresh the list
        } else {
          throw new Error(result.message || 'Save failed');
        }
      } else {
        const errorResult = await response.json();
        throw new Error(errorResult.message || 'Save failed');
      }
    } catch (error) {
      console.error('Save error:', error);
      if (!silent) showMessage('Failed to save draft: ' + error.message, 'error');
    } finally {
      setSaving(false);
    }
  };
  
  const handlePublish = async () => {
    if (!title.trim()) {
      showMessage('Please enter a title', 'error');
      return;
    }
    
    setSaving(true);
    const contentData = {
      title,
      content,
      excerpt,
      type,
      status: 'published',
      tags,
      coverImageUrl,
      publishedAt: new Date().toISOString(),
      ...(currentEditId && { id: currentEditId })
    };
    
    try {
      const url = currentEditId 
        ? `${API_BASE}/api/content/${currentEditId}`
        : `${API_BASE}/api/content`;
      const method = currentEditId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(contentData),
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          showMessage('Content published successfully!', 'success');
          clearForm();
          fetchContentList();
        } else {
          throw new Error(result.message || 'Publish failed');
        }
      } else {
        const errorResult = await response.json();
        throw new Error(errorResult.message || 'Publish failed');
      }
    } catch (error) {
      console.error('Publish error:', error);
      showMessage('Failed to publish content: ' + error.message, 'error');
    } finally {
      setSaving(false);
    }
  };
  
  const handleSchedule = async () => {
    if (!title.trim() || !scheduleAt) {
      showMessage('Please enter a title and schedule date', 'error');
      return;
    }
    // Ensure there is actual content (strip HTML tags)
    const plainText = (content || '').replace(/<[^>]*>/g, '').trim();
    if (!plainText) {
      showMessage('Please add some content before scheduling', 'error');
      return;
    }
    
    setSaving(true);
    const contentData = {
      title,
      content,
      excerpt,
      type,
      status: 'scheduled',
      tags,
      coverImageUrl,
      scheduledAt: scheduleAt,
      ...(currentEditId && { id: currentEditId })
    };
    
    try {
      const url = currentEditId 
        ? `${API_BASE}/api/content/${currentEditId}`
        : `${API_BASE}/api/content`;
      const method = currentEditId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(contentData),
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          showMessage('Content scheduled successfully!', 'success');
          clearForm();
          fetchContentList();
        } else {
          throw new Error(result.message || 'Schedule failed');
        }
      } else {
        const errorResult = await response.json();
        throw new Error(errorResult.message || 'Schedule failed');
      }
    } catch (error) {
      console.error('Schedule error:', error);
      showMessage('Failed to schedule content: ' + error.message, 'error');
    } finally {
      setSaving(false);
    }
  };
  
  const handlePreview = () => {
    setPreviewOpen(true);
  };
  
  const clearForm = () => {
    setTitle('');
    setContent('');
    setExcerpt('');
    setType('article');
    setStatus('draft');
    setScheduleAt('');
    setTags([]);
    setCoverImageUrl('');
    setCurrentEditId(null);
  };
  
  // Content management functions
  const fetchContentList = async () => {
    setListLoading(true);
    setListError(null);
    
    try {
      const response = await fetch(`${API_BASE}/api/content`, {
        headers: getAuthHeaders(),
      });
      
      if (response.ok) {
        const result = await response.json();
        // Check if result has success property
        if (result.success) {
          // Separate content by status
          setDrafts(result.data.filter(item => item.status === 'draft'));
          setPublished(result.data.filter(item => item.status === 'published'));
          setScheduled(result.data.filter(item => item.status === 'scheduled'));
        } else {
          throw new Error(result.message || 'Failed to fetch content');
        }
      } else {
        const errorResult = await response.json();
        throw new Error(errorResult.message || 'Failed to fetch content');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setListError('Failed to load content: ' + error.message);
    } finally {
      setListLoading(false);
    }
  };
  
  const loadIntoEditor = async (item) => {
    try {
      const response = await fetch(`${API_BASE}/api/content/${item.id || item._id}`, {
        headers: getAuthHeaders(),
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const data = result.data;
          setTitle(data.title || '');
          setContent(data.content || '');
          setExcerpt(data.excerpt || '');
          setType(data.type || 'article');
          setStatus(data.status || 'draft');
          setTags(data.tags || []);
          setCoverImageUrl(data.coverImageUrl || '');
          setCurrentEditId(data.id || data._id);
          setActiveTab('editor');
        } else {
          throw new Error(result.message || 'Failed to load content');
        }
      } else {
        const errorResult = await response.json();
        throw new Error(errorResult.message || 'Failed to load content');
      }
    } catch (error) {
      console.error('Load error:', error);
      showMessage('Failed to load content: ' + error.message, 'error');
    }
  };

  // Open a read-only preview of a published item
  const handleViewContent = async (item) => {
    try {
      const id = item._id || item.id;
      if (!id) return;
      const res = await fetch(`${API_BASE}/api/content/${id}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          const data = result.data;
          setTitle(data.title || '');
          setContent(data.content || '');
          setExcerpt(data.excerpt || '');
          setType(data.type || 'article');
          setStatus(data.status || 'published');
          setTags(data.tags || []);
          setCoverImageUrl(data.coverImageUrl || '');
          setCurrentEditId(data._id || data.id);
          setPreviewOpen(true);
        } else {
          throw new Error(result.message || 'Failed to load content for preview');
        }
      } else {
        const err = await res.json();
        throw new Error(err.message || 'Failed to load content for preview');
      }
    } catch (error) {
      console.error('View error:', error);
      showMessage('Failed to open preview: ' + error.message, 'error');
    }
  };

  // Delete content item
  const handleDelete = async (id, name) => {
    if (!id) return;
    if (!window.confirm(`Are you sure you want to delete "${name || 'this item'}"?`)) return;
    try {
      const response = await fetch(`${API_BASE}/api/content/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          showMessage('Content deleted successfully!', 'success');
          fetchContentList();
        } else {
          throw new Error(result.message || 'Delete failed');
        }
      } else {
        const errorResult = await response.json();
        throw new Error(errorResult.message || 'Delete failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      showMessage('Failed to delete content: ' + error.message, 'error');
    }
  };

  return (
    <UserLayout>
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-lg mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 flex items-center gap-3"><Sparkles className="w-6 h-6 sm:w-7 sm:h-7" /><span>Content Editor</span></h1>
            <p className="text-purple-100 text-sm sm:text-base">Create amazing content with our powerful editor</p>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-xs sm:text-sm text-purple-100">Word Count</div>
            <div className="text-xl sm:text-2xl font-bold">{wordCount}</div>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {saveMessage && (
        <div className={`mb-6 p-4 rounded-lg ${saveMessage.includes('success') ? 'bg-green-100 text-green-800 border border-green-200' : saveMessage.includes('error') ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-blue-100 text-blue-800 border border-blue-200'}`}>
          {saveMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 sm:mb-8 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'editor', label: (<span className="inline-flex items-center gap-2"><Pencil className="w-4 h-4" /> Editor</span>), count: null },
          { id: 'drafts', label: (<span className="inline-flex items-center gap-2"><FileText className="w-4 h-4" /> Drafts</span>), count: drafts.length },
          { id: 'published', label: (<span className="inline-flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Published</span>), count: published.length },
          { id: 'scheduled', label: (<span className="inline-flex items-center gap-2"><CalendarDays className="w-4 h-4" /> Scheduled</span>), count: scheduled.length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 basis-full sm:basis-auto py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-white text-indigo-600 shadow-md scale-[1.02]'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            {tab.count !== null && (
              <span className="ml-2 bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full text-xs">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Editor Tab */}
      {activeTab === 'editor' && (
        <div className="space-y-6 sm:space-y-8">
          {/* Main Editor Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Editor Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title Input */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter your amazing title..."
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-lg font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                />
              </div>

              {/* Content Editor */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-medium text-gray-700">Content</label>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm text-gray-500">{wordCount} words</span>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={autoSave}
                        onChange={(e) => setAutoSave(e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-600">Auto-save</span>
                    </label>
                  </div>
                </div>
                <RichTextEditor 
                  value={content} 
                  onChange={setContent}
                  placeholder="Start writing your amazing content..."
                />
              </div>

              {/* Excerpt */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Excerpt (Optional)</label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Brief description of your content..."
                  rows={3}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                />
              </div>
            </div>

            {/* Settings Column */}
            <div className="lg:col-span-1 space-y-6">
              {/* Publishing Settings */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><SettingsIcon className="w-4 h-4 mr-2" />Settings</h3>
                
                <div className="space-y-4">
                  {/* Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                    >
                      <option value="article">Article</option>
                      <option value="page">Page</option>
                      <option value="template">Template</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="scheduled">Scheduled</option>
                    </select>
                  </div>

                  {/* Schedule Date */}
                  {status === 'scheduled' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Schedule Date & Time</label>
                      <input
                        type="datetime-local"
                        value={scheduleAt}
                        onChange={(e) => setScheduleAt(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Cover Image */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><ImageIcon className="w-4 h-4 mr-2" />Cover Image</h3>
                
                <div className="space-y-4">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleUploadCover}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all duration-200"
                  />
                  {coverUploading && (
                    <div className="flex items-center justify-center">
                      <TrioLoader size="20" color="#6366f1" />
                    </div>
                  )}
                  {coverImageUrl && (
                    <div className="relative">
                      <img 
                        src={coverImageUrl} 
                        alt="Cover preview" 
                        className="w-full h-40 object-cover rounded-lg border-2 border-gray-200" 
                      />
                      <button
                        onClick={() => setCoverImageUrl('')}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><Tags className="w-4 h-4 mr-2" />Tags</h3>
                
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
                    <input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                      placeholder="Add a tag..."
                      className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                    />
                    <button
                      onClick={addTag}
                      className="px-3 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-2 text-indigo-600 hover:text-indigo-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><Rocket className="w-4 h-4 mr-2" />Actions</h3>
                
                <div className="space-y-3">
                  <button
                    onClick={handlePreview}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-lg transition-all duration-200 hover:scale-[1.02]"
                  >
                    <span className="inline-flex items-center gap-2"><Eye className="w-4 h-4" /> Preview</span>
                  </button>
                  <button
                    onClick={() => handleSaveDraft(false)}
                    disabled={saving}
                    className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 hover:scale-[1.02] disabled:scale-100"
                  >
                    {saving ? <TrioLoader size="16" color="white" /> : <span className="inline-flex items-center gap-2"><FileText className="w-4 h-4" /> Save Draft</span>}
                  </button>
                  <button
                    onClick={handlePublish}
                    disabled={saving || !title.trim()}
                    className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 hover:scale-[1.02] disabled:scale-100"
                  >
                    <span className="inline-flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Publish Now</span>
                  </button>
                  {status === 'scheduled' && (
                      <button
                      onClick={handleSchedule}
                      disabled={saving || !scheduleAt}
                      className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 hover:scale-[1.02] disabled:scale-100"
                    >
                        <span className="inline-flex items-center gap-2"><CalendarDays className="w-4 h-4" /> Schedule Post</span>
                    </button>
                  )}
                  <button
                    onClick={clearForm}
                    className="w-full bg-red-100 hover:bg-red-200 text-red-700 font-medium py-3 px-4 rounded-lg transition-all duration-200 hover:scale-[1.02]"
                  >
                    <span className="inline-flex items-center gap-2"><Trash2 className="w-4 h-4" /> Clear Form</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Management Tabs */}
      {activeTab !== 'editor' && (
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search your content..."
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                />
              </div>
              <button
                onClick={fetchContentList}
                disabled={listLoading}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-lg transition-all duration-200 hover:scale-105"
              >
                {listLoading ? <TrioLoader size="16" color="white" /> : <span className="inline-flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Refresh</span>}
              </button>
            </div>
          </div>

          {/* Content List */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="mr-2">
                {activeTab === 'drafts' ? <FileText className="w-5 h-5" /> : activeTab === 'published' ? <CheckCircle2 className="w-5 h-5" /> : <CalendarDays className="w-5 h-5" />}
              </span>
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} 
              <span className="ml-2 bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                {activeTab === 'drafts' ? drafts.length : 
                 activeTab === 'published' ? published.length : scheduled.length}
              </span>
            </h2>

              {listLoading ? (
              <div className="text-center py-8">
                <TrioLoader size="32" color="#6366f1" />
                <p className="text-gray-600 mt-4">Loading content...</p>
              </div>
            ) : listError ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4"><AlertTriangle className="inline w-10 h-10 text-yellow-500" /></div>
                <p className="text-red-600">{listError}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(activeTab === 'drafts' ? drafts : 
                  activeTab === 'published' ? published : scheduled).map((item) => (
                  <div key={item._id || item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:scale-[1.01]">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 truncate">{item.title || item.name}</h3>
                        <p className="text-sm text-gray-500">
                          Created: {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => loadIntoEditor(item)}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm transition-all duration-200 hover:scale-105"
                        >
                          ✏️ Edit
                        </button>
                        {activeTab === 'published' && (
                          <button
                            onClick={() => handleViewContent(item)}
                            className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded-lg text-sm transition-all duration-200 hover:scale-105"
                          >
                            👁️ View
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(item._id || item.id, item.title || item.name)}
                          className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg text-sm transition-all duration-200 hover:scale-105"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {(activeTab === 'drafts' ? drafts : 
                  activeTab === 'published' ? published : scheduled).length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">
                      {activeTab === 'drafts' ? <FileText className="inline w-12 h-12" /> : activeTab === 'published' ? <CheckCircle2 className="inline w-12 h-12" /> : <CalendarDays className="inline w-12 h-12" />}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No {activeTab} content yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {activeTab === 'drafts' && "Start writing your first draft!"}
                      {activeTab === 'published' && "Publish your first article!"}
                      {activeTab === 'scheduled' && "Schedule your first post!"}
                    </p>
                    <button
                      onClick={() => setActiveTab('editor')}
                      className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-lg transition-all duration-200 hover:scale-105"
                    >
                      Start Writing
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="Content Preview">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h1 className="text-3xl font-bold text-gray-900">{title || 'Untitled'}</h1>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                <span>Type: {type}</span>
                <span>Status: {status}</span>
                <span>Words: {wordCount}</span>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {tags.map((tag, index) => (
                    <span key={index} className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {coverImageUrl && (
              <img 
                src={coverImageUrl} 
                alt="Cover" 
                className="w-full h-64 object-cover rounded-lg shadow-lg" 
              />
            )}
            {excerpt && (
              <div className="bg-gray-50 border-l-4 border-indigo-500 p-4 rounded">
                <p className="text-gray-700 italic">{excerpt}</p>
              </div>
            )}
            <div 
              className="prose max-w-none text-gray-800" 
              dangerouslySetInnerHTML={{ __html: content }} 
            />
          </div>
        </div>
      </Modal>
    </UserLayout>
  );
}
