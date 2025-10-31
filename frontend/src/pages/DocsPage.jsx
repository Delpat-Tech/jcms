import React, { useState } from 'react';
import { Search, Book, Zap, Shield, Users, Image, FileText, CreditCard, Menu, X, ChevronRight, Home } from 'lucide-react';

const DocsPage = () => {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      id: 'content',
      title: 'Content Management',
      icon: <FileText className="w-5 h-5" />,
      content: {
        title: 'Creating & Managing Content',
        description: 'Learn how to create and publish content',
        items: [
          {
            title: 'Create New Content',
            content: '1. Click "Content" in sidebar\n2. Click "New Content" button\n3. Enter title and content\n4. Add tags and images\n5. Save as draft or publish',
            code: true
          },
          {
            title: 'Content Status',
            content: '• Draft: Work in progress\n• Published: Live content\n• Scheduled: Auto-publish at set time'
          },
          {
            title: 'Rich Text Editor',
            content: 'Use the editor toolbar to format text, add links, insert images, and create lists. Auto-save keeps your work safe.'
          }
        ]
      }
    },
    {
      id: 'media',
      title: 'Media Management',
      icon: <Image className="w-5 h-5" />,
      content: {
        title: 'Upload & Manage Media',
        description: 'Handle images, videos, and files',
        items: [
          {
            title: 'Upload Files',
            content: '1. Go to Media section\n2. Drag & drop files or click "Choose Files"\n3. Enter title and description\n4. Select format (for images)\n5. Click "Upload"',
            code: true
          },
          {
            title: 'Supported Formats',
            content: '• Images: JPEG, PNG, WebP, AVIF, GIF\n• Documents: PDF, DOC, DOCX, JSON\n• Media: MP4, MP3'
          },
          {
            title: 'Batch Upload',
            content: 'Select multiple files at once for batch upload. Each file is processed individually with progress tracking.'
          },
          {
            title: 'File Organization',
            content: 'Use collections to organize your media. Add tags for easy searching and filtering.'
          }
        ]
      }
    },
    {
      id: 'users',
      title: 'User Management',
      icon: <Users className="w-5 h-5" />,
      content: {
        title: 'Managing Users',
        description: 'Add and manage team members',
        items: [
          {
            title: 'Add New User',
            content: '1. Navigate to Users section\n2. Click "Add User"\n3. Enter username, email, password\n4. Assign role (Admin/Editor)\n5. Click "Create User"',
            code: true
          },
          {
            title: 'Edit User',
            content: 'Click the edit icon next to any user to update their information, change their role, or deactivate their account.'
          },
          {
            title: 'User Permissions',
            content: 'Admins can manage users and content within their tenant. Editors can only create and manage their own content.'
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
            content: '• Free: Limited features (5 articles)\n• Standard: $9.99/month - Full access\n• Premium: $19.99/month - All features + premium media'
          },
          {
            title: 'Subscribe',
            content: '1. Go to Subscription page\n2. Choose your plan\n3. Enter payment details\n4. Click "Subscribe"\n5. Confirmation email sent',
            code: true
          },
          {
            title: 'Cancel Subscription',
            content: 'Visit your subscription dashboard and click "Cancel Subscription". Your access continues until the end of the billing period.'
          },
          {
            title: 'Payment History',
            content: 'View all your invoices and payment history in the subscription dashboard. Download invoices for your records.'
          }
        ]
      }
    },
    {
      id: 'tips',
      title: 'Tips & Best Practices',
      icon: <Zap className="w-5 h-5" />,
      content: {
        title: 'Pro Tips',
        description: 'Get the most out of JCMS',
        items: [
          {
            title: 'Content Creation',
            content: '• Use descriptive titles\n• Add relevant tags\n• Include cover images\n• Preview before publishing\n• Use auto-save feature'
          },
          {
            title: 'Media Optimization',
            content: '• Use WebP format for smaller file sizes\n• Compress images before upload\n• Add descriptive titles\n• Organize with collections\n• Use tags for easy search'
          },
          {
            title: 'Security',
            content: '• Use strong passwords\n• Enable 2FA if available\n• Log out on shared devices\n• Review user permissions regularly\n• Keep software updated'
          },
          {
            title: 'Performance',
            content: '• Clear browser cache regularly\n• Use modern browsers\n• Optimize images before upload\n• Archive old content\n• Monitor storage usage'
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

              {/* Content Items */}
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
