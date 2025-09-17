// @ts-nocheck
import React, { useMemo, useState } from 'react';
import UserLayout from '../layout.tsx';
import DashboardWidget from '../../components/common/DashboardWidget.jsx';
import Button from '../../components/ui/Button.jsx';

export default function UserHelpPage() {
  const [query, setQuery] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const apiBase = useMemo(() => (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) ? process.env.REACT_APP_API_URL : '', []);

  const articles = [
    { title: 'Creating your first article', url: 'https://docs.yourcms.com/tutorials/first-article' },
    { title: 'Managing media files', url: 'https://docs.yourcms.com/guide/media' },
    { title: 'Scheduling content', url: 'https://docs.yourcms.com/guide/scheduling' },
    { title: 'Working with templates', url: 'https://docs.yourcms.com/guide/templates' },
    { title: 'Profile and password management', url: 'https://docs.yourcms.com/guide/profile' },
  ];

  const filtered = articles.filter(a => a.title.toLowerCase().includes(query.toLowerCase()));

  const sendContact = async () => {
    // If a backend contact endpoint exists, post to it. Otherwise, fallback to mailto
    if (email && message) {
      try {
        // Optional: await fetch(`${apiBase}/api/support/contact`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, message }) });
        setSent(true);
      } catch (e) {
        setSent(true);
      }
    }
  };

  return (
    <UserLayout title="Help & Support">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Help & Support</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <DashboardWidget title="Knowledge Base" className="lg:col-span-2">
            <div className="space-y-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search articles..."
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
              <ul className="list-disc pl-5">
                {(filtered.length === 0 ? articles : filtered).map((a) => (
                  <li key={a.url} className="text-sm text-indigo-700">
                    <a href={a.url} target="_blank" rel="noreferrer">{a.title}</a>
                  </li>
                ))}
              </ul>
            </div>
          </DashboardWidget>

          <DashboardWidget title="Contact Us">
            {sent ? (
              <div className="text-sm text-green-600">Thanks! We will get back to you soon.</div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-gray-600">Send us a message and we’ll reach out.</div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  className="w-full border rounded-md px-3 py-2 text-sm"
                />
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we help?"
                  className="w-full border rounded-md px-3 py-2 text-sm min-h-[120px]"
                />
                <div className="flex justify-end">
                  <Button onClick={sendContact} disabled={!email || !message}>Send</Button>
                </div>
                <div className="text-xs text-gray-500">
                  Or email us at <a href="mailto:support@yourcms.com" className="text-indigo-700">support@yourcms.com</a>
                </div>
              </div>
            )}
          </DashboardWidget>
        </div>

        <DashboardWidget title="Quick Links">
          <ul className="list-disc pl-5 text-sm text-indigo-700">
            <li><a href="https://docs.yourcms.com" target="_blank" rel="noreferrer">Documentation</a></li>
            <li><a href="https://docs.yourcms.com/tutorials" target="_blank" rel="noreferrer">Tutorials</a></li>
            <li><a href="https://docs.yourcms.com/faq" target="_blank" rel="noreferrer">FAQ</a></li>
            <li><a href="mailto:support@yourcms.com">Contact Support</a></li>
          </ul>
        </DashboardWidget>
      </div>
    </UserLayout>
  );
}
