import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import TrioLoader from '../components/ui/TrioLoader';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function processContent(htmlContent) {
  if (!htmlContent) return '';
  let processed = htmlContent;
  const apiBase = API_BASE_URL;
  processed = processed.replace(/src="(?!http)([^\"]*\.(jpg|jpeg|png|gif|webp|avif)[^\"]*)"/g, (m, url) => {
    if (!url.startsWith('/')) return `src="${apiBase}/${url}"`;
    return `src="${apiBase}${url}"`;
  });
  processed = processed.replace(/src="\/api\/images\/([^\"]*)"/g, (m, id) => `src="${apiBase}/api/images/${id}"`);
  return processed;
}

export default function PublicContentPage() {
  const { idOrSlug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/public/content/${idOrSlug}`);
        const json = await res.json();
        if (json.success) setData(json.data);
        else setError(json.message || 'Not found');
      } catch (e) {
        setError(e.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [idOrSlug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><TrioLoader size="40" color="#4f46e5" /></div>;
  if (error || !data) return <div className="min-h-screen flex items-center justify-center text-red-600">{error || 'Not found'}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {data.coverImageUrl && (
          <img src={`${data.coverImageUrl.startsWith('http') ? '' : API_BASE_URL}${data.coverImageUrl}`} alt={data.title} className="w-full rounded-lg mb-4 object-cover" />
        )}
        <h1 className="text-3xl font-bold mb-2">{data.title}</h1>
        <div className="text-gray-500 mb-6 text-sm">
          {data.publishedAt ? new Date(data.publishedAt).toLocaleString() : ''}
        </div>
        <article className="prose max-w-none prose-img:max-w-full prose-img:h-auto" dangerouslySetInnerHTML={{ __html: processContent(data.content) }} />
      </div>
    </div>
  );
}
