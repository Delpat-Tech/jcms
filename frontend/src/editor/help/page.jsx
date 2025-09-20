import React, { useState, useEffect } from 'react';
import UserLayout from '../layout.jsx';
import DashboardWidget from '../../components/common/DashboardWidget.jsx';
import Button from '../../components/ui/Button.jsx';
import TrioLoader from '../../components/ui/TrioLoader.jsx';
import { helpApi } from '../../api';

export default function UserHelpPage() {
  const [query, setQuery] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);

  // Articles state
  const [articles, setArticles] = useState([]);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [articlesError, setArticlesError] = useState(null);

  // FAQ state
  const [faqs, setFaqs] = useState([]);
  const [loadingFaqs, setLoadingFaqs] = useState(true);
  const [faqsError, setFaqsError] = useState(null);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  // User info
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const userInfo = JSON.parse(userData);
      setUser(userInfo);
      setEmail(userInfo.email || '');
    }
    fetchArticles();
    fetchFaqs();
  }, []);

  const fetchArticles = async () => {
    setLoadingArticles(true);
    setArticlesError(null);
    try {
      const response = await helpApi.getArticles();
      const data = await response.json();
      if (data.success) {
        setArticles(data.data || []);
      } else {
        setArticlesError('Failed to load help articles');
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
      setArticlesError('Failed to load help articles');
      // Fallback to default articles
      setArticles([
        { _id: '1', title: 'Getting Started with Content Creation', category: 'Basics', url: '/help/getting-started' },
        { _id: '2', title: 'Managing Media Files', category: 'Media', url: '/help/media-management' },
        { _id: '3', title: 'Publishing and Scheduling Content', category: 'Publishing', url: '/help/publishing' },
        { _id: '4', title: 'Working with Rich Text Editor', category: 'Editor', url: '/help/rich-editor' },
        { _id: '5', title: 'Profile and Account Settings', category: 'Account', url: '/help/profile-settings' },
      ]);
    } finally {
      setLoadingArticles(false);
    }
  };

  const fetchFaqs = async () => {
    setLoadingFaqs(true);
    setFaqsError(null);
    try {
      const response = await helpApi.getFaqs();
      const data = await response.json();
      if (data.success) {
        setFaqs(data.data || []);
      } else {
        setFaqsError('Failed to load FAQs');
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      setFaqsError('Failed to load FAQs');
      // Fallback to default FAQs
      setFaqs([
        {
          _id: '1',
          question: 'How do I create my first article?',
          answer: 'Navigate to the Content section from your dashboard and click on "New Article". Use the rich text editor to write your content, add media, and configure publishing settings.',
          category: 'Content Creation'
        },
        {
          _id: '2',
          question: 'How can I upload and manage media files?',
          answer: 'Go to the Media section in your dashboard. You can drag and drop files or click "Upload" to add images, documents, and other media. Use filters to organize and find your files.',
          category: 'Media Management'
        },
        {
          _id: '3',
          question: 'How do I schedule content for later publication?',
          answer: 'When editing content, look for the "Publish Settings" section. Set the status to "Scheduled" and choose your desired publish date and time.',
          category: 'Publishing'
        },
        {
          _id: '4',
          question: 'Can I save my work as a draft?',
          answer: 'Yes! Your work is automatically saved as you type. You can also manually save drafts using the "Save Draft" button. Drafts won\'t be visible to the public until published.',
          category: 'Content Creation'
        },
        {
          _id: '5',
          question: 'How do I update my profile information?',
          answer: 'Visit the Profile section from your dashboard. Here you can update your personal information, change your password, and configure notification preferences.',
          category: 'Account Management'
        }
      ]);
    } finally {
      setLoadingFaqs(false);
    }
  };

  const filtered = articles.filter(a => 
    a.title.toLowerCase().includes(query.toLowerCase()) || 
    (a.category && a.category.toLowerCase().includes(query.toLowerCase()))
  );

  const sendContact = async () => {
    if (!email || !message || !subject) {
      setSendError('Please fill in all required fields');
      return;
    }

    setSending(true);
    setSendError(null);
    try {
      const response = await helpApi.submitContact({
        email,
        subject,
        message,
        name: user?.username || user?.name || 'User'
      });
      
      const data = await response.json();
      if (data.success) {
        setSent(true);
        setMessage('');
        setSubject('');
      } else {
        setSendError(data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending contact form:', error);
      setSendError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <UserLayout title="Help & Support">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 mb-8 text-white shadow-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Help & Support 🚀</h1>
          <p className="text-blue-100 text-lg">
            We're here to help you succeed with your content creation
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">📚</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Knowledge Base</h3>
              <p className="text-sm text-gray-600">Browse our comprehensive guides and tutorials</p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">❓</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">FAQs</h3>
              <p className="text-sm text-gray-600">Find quick answers to common questions</p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Contact Support</h3>
              <p className="text-sm text-gray-600">Get personalized help from our team</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Knowledge Base */}
          <div className="lg:col-span-2 space-y-6">
            <DashboardWidget title="📚 Knowledge Base" className="bg-white rounded-xl shadow-lg border border-gray-100">
              <div className="space-y-4">
                <div className="relative">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search articles and guides..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="absolute right-3 top-3">
                    <span className="text-gray-400">🔍</span>
                  </div>
                </div>

                {loadingArticles ? (
                  <div className="text-center py-8">
                    <TrioLoader size="32" color="#3b82f6" />
                    <p className="text-gray-500 mt-2">Loading articles...</p>
                  </div>
                ) : articlesError ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">⚠️</div>
                    <p className="text-gray-500">{articlesError}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(filtered.length === 0 && query ? [] : (filtered.length > 0 ? filtered : articles)).map((article) => (
                      <div key={article._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900 hover:text-blue-600 transition-colors">
                              <a href={article.url || '#'} className="text-blue-600 hover:text-blue-800">
                                {article.title}
                              </a>
                            </h4>
                            {article.category && (
                              <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-1">
                                {article.category}
                              </span>
                            )}
                            {article.description && (
                              <p className="text-sm text-gray-600 mt-2">{article.description}</p>
                            )}
                          </div>
                          <span className="text-gray-400 text-sm">📖</span>
                        </div>
                      </div>
                    ))}
                    {query && filtered.length === 0 && (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-2">🔍</div>
                        <p className="text-gray-500">No articles found for "{query}"</p>
                        <p className="text-sm text-gray-400 mt-1">Try different keywords or browse all articles</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </DashboardWidget>

            {/* FAQs */}
            <DashboardWidget title="❓ Frequently Asked Questions" className="bg-white rounded-xl shadow-lg border border-gray-100">
              {loadingFaqs ? (
                <div className="text-center py-8">
                  <TrioLoader size="32" color="#3b82f6" />
                  <p className="text-gray-500 mt-2">Loading FAQs...</p>
                </div>
              ) : faqsError ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">⚠️</div>
                  <p className="text-gray-500">{faqsError}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {faqs.map((faq, index) => (
                    <div key={faq._id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleFaq(index)}
                        className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">{faq.question}</h4>
                          <span className="text-gray-500 ml-2">
                            {openFaqIndex === index ? '−' : '+'}
                          </span>
                        </div>
                        {faq.category && (
                          <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mt-2">
                            {faq.category}
                          </span>
                        )}
                      </button>
                      {openFaqIndex === index && (
                        <div className="p-4 bg-white border-t border-gray-200">
                          <p className="text-gray-700">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </DashboardWidget>
          </div>

          {/* Contact Form */}
          <div className="space-y-6">
            <DashboardWidget title="💬 Contact Support" className="bg-white rounded-xl shadow-lg border border-gray-100">
              {sent ? (
                <div className="text-center py-8">
                  <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl">✅</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Message Sent!</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Thanks for reaching out! We'll get back to you within 24 hours.
                  </p>
                  <Button
                    onClick={() => setSent(false)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 mb-4">
                    Need personalized help? Send us a message and we'll reach out soon.
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="What can we help you with?"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe your issue or question in detail..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[120px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {sendError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-red-600 text-sm">{sendError}</p>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button 
                      onClick={sendContact} 
                      disabled={!email || !message || !subject || sending}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                    >
                      {sending ? (
                        <>
                          <TrioLoader size="16" color="#ffffff" />
                          <span className="ml-2">Sending...</span>
                        </>
                      ) : (
                        'Send Message'
                      )}
                    </Button>
                  </div>

                  <div className="text-xs text-gray-500 text-center pt-2">
                    Or email us directly at{' '}
                    <a href="mailto:support@jcms.com" className="text-blue-600 hover:text-blue-800">
                      support@jcms.com
                    </a>
                  </div>
                </div>
              )}
            </DashboardWidget>

            {/* Quick Links */}
            <DashboardWidget title="🔗 Quick Links" className="bg-white rounded-xl shadow-lg border border-gray-100">
              <div className="space-y-3">
                <a
                  href="/user/content"
                  className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="text-lg mr-3">📝</span>
                  <span className="text-sm font-medium text-gray-900">Create Content</span>
                </a>
                <a
                  href="/user/media"
                  className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="text-lg mr-3">🖼️</span>
                  <span className="text-sm font-medium text-gray-900">Manage Media</span>
                </a>
                <a
                  href="/user/profile"
                  className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="text-lg mr-3">⚙️</span>
                  <span className="text-sm font-medium text-gray-900">Profile Settings</span>
                </a>
                <a
                  href="mailto:support@jcms.com"
                  className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="text-lg mr-3">📧</span>
                  <span className="text-sm font-medium text-gray-900">Email Support</span>
                </a>
              </div>
            </DashboardWidget>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}