import React, { useState } from 'react';
import { Search, Book, Zap, Shield, Users, Image, FileText, CreditCard, Menu, X, ChevronRight, Home, Code } from 'lucide-react';

const DocsPage = () => {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apiResponse, setApiResponse] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);

  const apiEndpoints = [
    {
      name: 'Login',
      method: 'POST',
      endpoint: '/api/auth/login',
      body: { username: 'superadmin', password: 'admin123', rememberMe: true },
      description: 'Authenticate user and get token'
    },
    {
      name: 'Get Subscription Plans',
      method: 'GET',
      endpoint: '/api/subscriptions/plans',
      description: 'Get all available subscription plans'
    },
    {
      name: 'Get Subscription Status',
      method: 'GET',
      endpoint: '/api/subscriptions/status',
      requiresAuth: true,
      description: 'Get current user subscription status'
    },
    {
      name: 'Create Subscription',
      method: 'POST',
      endpoint: '/api/subscriptions',
      requiresAuth: true,
      body: { plan: 'standard' },
      description: 'Subscribe to a plan'
    },
    {
      name: 'Get Payment History',
      method: 'GET',
      endpoint: '/api/subscriptions/history',
      requiresAuth: true,
      description: 'Get all payment invoices'
    },
    {
      name: 'Cancel Subscription',
      method: 'POST',
      endpoint: '/api/subscriptions/cancel',
      requiresAuth: true,
      description: 'Cancel active subscription'
    },
    {
      name: 'Get All Content',
      method: 'GET',
      endpoint: '/api/content',
      requiresAuth: true,
      description: 'Get all content items'
    },
    {
      name: 'Create Content',
      method: 'POST',
      endpoint: '/api/content',
      requiresAuth: true,
      body: { title: 'Test Article', content: '<p>Test</p>', status: 'draft', type: 'article' },
      description: 'Create new content'
    },
    {
      name: 'Get All Users',
      method: 'GET',
      endpoint: '/api/users',
      requiresAuth: true,
      description: 'Get all users'
    },
    {
      name: 'Get All Images',
      method: 'GET',
      endpoint: '/api/images',
      requiresAuth: true,
      description: 'Get all uploaded images'
    },
    {
      name: 'Get Analytics',
      method: 'GET',
      endpoint: '/api/analytics/dashboard',
      requiresAuth: true,
      description: 'Get dashboard analytics'
    },
    {
      name: 'Health Check',
      method: 'GET',
      endpoint: '/api/health',
      description: 'Check server health'
    }
  ];

  const tryApi = async (api) => {
    setApiLoading(true);
    setApiResponse(null);
    
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      
      if (api.requiresAuth && token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const options = {
        method: api.method,
        headers
      };
      
      if (api.body) {
        options.body = JSON.stringify(api.body);
      }
      
      const response = await fetch(`http://localhost:5000${api.endpoint}`, options);
      const data = await response.json();
      
      setApiResponse({
        status: response.status,
        data: JSON.stringify(data, null, 2)
      });
    } catch (error) {
      setApiResponse({
        status: 'Error',
        data: error.message
      });
    } finally {
      setApiLoading(false);
    }
  };

  const sections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: <Home className="w-5 h-5" />,
      content: {
        title: 'Welcome to JCMS',
        description: 'Get started with JCMS in minutes',
        items: [
          {
            title: 'What is JCMS?',
            content: 'JCMS is a powerful Content Management System that helps you create, manage, and publish content effortlessly. Built with modern technologies, it offers a seamless experience for content creators and administrators.'
          },
          {
            title: 'Quick Start',
            content: '1. Login with your credentials\n2. Navigate to your dashboard\n3. Start creating content\n4. Publish when ready',
            code: true
          },
          {
            title: 'System Requirements',
            content: '• Modern web browser (Chrome, Firefox, Safari, Edge)\n• Stable internet connection\n• JavaScript enabled'
          }
        ]
      }
    },
    {
      id: 'api',
      title: 'API Reference',
      icon: <Code className="w-5 h-5" />,
      content: {
        title: 'API Endpoints',
        description: 'Test APIs directly from documentation',
        items: []
      }
    },
    {
      id: 'authentication',
      title: 'Authentication',
      icon: <Shield className="w-5 h-5" />,
      content: {
        title: 'User Authentication',
        description: 'Secure login and user management',
        items: [
          {
            title: 'Login',
            content: 'Access your account using your username and password. Check "Remember Me" to stay logged in across sessions.'
          },
          {
            title: 'User Roles',
            content: '• SuperAdmin: Full system access\n• Admin: Tenant management\n• Editor: Content creation',
            code: true
          },
          {
            title: 'Password Security',
            content: 'Use strong passwords with at least 8 characters, including uppercase, lowercase, numbers, and special characters.'
          }
        ]
      }
    },
    {
      id: 'subscription',
      title: 'Subscriptions',
      icon: <CreditCard className="w-5 h-5" />,
      content: {
        title: 'Subscription Plans',
        description: 'Manage your subscription',
        items: [
          {
            title: 'Available Plans',
            content: '• Free: Limited features (5 articles, 10MB uploads, 15-day expiry)\n• Standard: $9.99/month - Full access (100MB uploads, no expiry)\n• Premium: $19.99/month - All features + premium media'
          },
          {
            title: 'Upload Limits',
            content: 'Free users: 10MB max file size, images expire after 15 days\nSubscribed users: 100MB max file size, permanent storage',
            code: true
          },
          {
            title: 'Subscribe',
            content: '1. Go to Subscription page\n2. Choose your plan\n3. Enter payment details\n4. Click "Subscribe"\n5. Confirmation email sent',
            code: true
          }
        ]
      }
    }
  ];

  const currentSection = sections.find(s => s.id === activeSection);

  const filteredSections = sections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.content.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <Book className="w-8 h-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900">JCMS Documentation</h1>
            </div>
            <a href="/" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              Back to App →
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className={`
            ${sidebarOpen ? 'block' : 'hidden'} lg:block
            fixed lg:sticky top-20 left-0 w-64 h-[calc(100vh-5rem)]
            bg-white lg:bg-transparent p-4 lg:p-0
            border-r lg:border-0 border-gray-200
            overflow-y-auto z-40
          `}>
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search docs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-1">
              {filteredSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => {
                    setActiveSection(section.id);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all
                    ${activeSection === section.id
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  {section.icon}
                  <span>{section.title}</span>
                  {activeSection === section.id && (
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  )}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 lg:p-12">
              {/* Section Header */}
              <div className="mb-8 pb-8 border-b border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    {currentSection?.icon}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">
                      {currentSection?.content.title}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {currentSection?.content.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* API Reference Section */}
              {activeSection === 'api' && (
                <div className="space-y-6">
                  {apiEndpoints.map((api, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              api.method === 'GET' ? 'bg-blue-100 text-blue-700' :
                              api.method === 'POST' ? 'bg-green-100 text-green-700' :
                              api.method === 'PUT' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {api.method}
                            </span>
                            <code className="text-sm font-mono text-gray-700">{api.endpoint}</code>
                            {api.requiresAuth && (
                              <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">🔒 Auth Required</span>
                            )}
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">{api.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{api.description}</p>
                        </div>
                        <button
                          onClick={() => tryApi(api)}
                          disabled={apiLoading}
                          className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors text-sm font-medium whitespace-nowrap"
                        >
                          {apiLoading ? 'Testing...' : 'Try It'}
                        </button>
                      </div>
                      
                      {api.body && (
                        <div className="mt-3">
                          <p className="text-xs font-semibold text-gray-700 mb-1">Request Body:</p>
                          <pre className="bg-gray-50 border border-gray-200 rounded p-3 text-xs overflow-x-auto">
                            {JSON.stringify(api.body, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* API Response Display */}
                  {apiResponse && (
                    <div className="mt-6 border-2 border-indigo-200 rounded-lg p-6 bg-indigo-50">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">Response</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                          apiResponse.status >= 200 && apiResponse.status < 300 ? 'bg-green-100 text-green-700' :
                          apiResponse.status >= 400 ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          Status: {apiResponse.status}
                        </span>
                      </div>
                      <pre className="bg-gray-900 text-green-400 rounded p-4 text-xs overflow-x-auto max-h-96">
                        {apiResponse.data}
                      </pre>
                      <button
                        onClick={() => setApiResponse(null)}
                        className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        Clear Response
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Content Items */}
              {activeSection !== 'api' && (
              <div className="space-y-8">
                {currentSection?.content.items.map((item, index) => (
                  <div key={index} className="group">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </span>
                      {item.title}
                    </h3>
                    <div className={`
                      ${item.code ? 'bg-gray-50 border border-gray-200 rounded-lg p-4 font-mono text-sm' : ''}
                      text-gray-700 whitespace-pre-line leading-relaxed
                    `}>
                      {item.content}
                    </div>
                  </div>
                ))}
              </div>
              )}

              {/* Navigation Footer */}
              <div className="mt-12 pt-8 border-t border-gray-200 flex justify-between">
                <button
                  onClick={() => {
                    const currentIndex = sections.findIndex(s => s.id === activeSection);
                    if (currentIndex > 0) {
                      setActiveSection(sections[currentIndex - 1].id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  disabled={sections.findIndex(s => s.id === activeSection) === 0}
                  className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:text-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => {
                    const currentIndex = sections.findIndex(s => s.id === activeSection);
                    if (currentIndex < sections.length - 1) {
                      setActiveSection(sections[currentIndex + 1].id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  disabled={sections.findIndex(s => s.id === activeSection) === sections.length - 1}
                  className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:text-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </div>

            {/* Help Card */}
            <div className="mt-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
              <h3 className="text-2xl font-bold mb-2">Need More Help?</h3>
              <p className="mb-4 opacity-90">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <div className="flex gap-4">
                <a
                  href="/user/help"
                  className="px-6 py-3 bg-white text-indigo-600 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  Contact Support
                </a>
                <a
                  href="/"
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors border border-white/20"
                >
                  Go to Dashboard
                </a>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DocsPage;
