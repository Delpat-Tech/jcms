// routes/helpRoutes.js
const express = require('express');
const { authenticate } = require('../middlewares/auth');
const { logActivity } = require('../middlewares/activityLogger');

const router = express.Router();

// Contact form endpoint (authenticated users)
router.post('/contact', authenticate, logActivity('CONTACT', 'help'), async (req, res) => {
  try {
    const { email, message, subject } = req.body;
    const userId = req.user.id;
    
    if (!email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Email and message are required'
      });
    }
    
    // In a real application, you would:
    // 1. Send email to support team
    // 2. Create a support ticket in database
    // 3. Send confirmation email to user
    
    // For now, just log the contact attempt
    console.log('Contact form submitted:', {
      userId,
      email,
      subject: subject || 'General Support',
      message: message.substring(0, 100) + '...',
      timestamp: new Date()
    });
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    res.json({
      success: true,
      message: 'Your message has been sent successfully. We will get back to you soon!',
      ticketId: `TICKET-${Date.now()}-${userId.toString().slice(-4)}`
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again later.',
      error: error.message
    });
  }
});

// Get help articles
router.get('/articles', async (req, res) => {
  try {
    const { search } = req.query;
    
    // Mock help articles - in production, these would come from a database
    const allArticles = [
      {
        id: 1,
        title: 'Getting Started with Content Creation',
        description: 'Learn how to create your first article using our powerful editor',
        category: 'Content',
        url: '/help/articles/getting-started',
        popular: true,
        tags: ['beginner', 'content', 'editor']
      },
      {
        id: 2,
        title: 'Managing Your Media Library',
        description: 'Upload, organize, and use images and files in your content',
        category: 'Media',
        url: '/help/articles/media-library',
        popular: true,
        tags: ['media', 'images', 'files']
      },
      {
        id: 3,
        title: 'Scheduling and Publishing Content',
        description: 'Control when your content goes live with scheduling features',
        category: 'Publishing',
        url: '/help/articles/scheduling',
        popular: false,
        tags: ['publishing', 'scheduling', 'workflow']
      },
      {
        id: 4,
        title: 'Using Templates for Faster Creation',
        description: 'Speed up your workflow with reusable content templates',
        category: 'Templates',
        url: '/help/articles/templates',
        popular: false,
        tags: ['templates', 'workflow', 'efficiency']
      },
      {
        id: 5,
        title: 'Profile and Account Management',
        description: 'Update your profile, change passwords, and manage account settings',
        category: 'Account',
        url: '/help/articles/profile-management',
        popular: true,
        tags: ['profile', 'account', 'settings']
      },
      {
        id: 6,
        title: 'Collaborative Writing and Review',
        description: 'Work with team members on content creation and review',
        category: 'Collaboration',
        url: '/help/articles/collaboration',
        popular: false,
        tags: ['collaboration', 'team', 'review']
      },
      {
        id: 7,
        title: 'SEO Best Practices',
        description: 'Optimize your content for search engines',
        category: 'SEO',
        url: '/help/articles/seo-practices',
        popular: true,
        tags: ['seo', 'optimization', 'search']
      },
      {
        id: 8,
        title: 'Content Analytics and Performance',
        description: 'Track how your content performs and engage with your audience',
        category: 'Analytics',
        url: '/help/articles/analytics',
        popular: false,
        tags: ['analytics', 'performance', 'metrics']
      }
    ];
    
    let articles = allArticles;
    
    // Filter by search query if provided
    if (search) {
      const searchLower = search.toLowerCase();
      articles = allArticles.filter(article => 
        article.title.toLowerCase().includes(searchLower) ||
        article.description.toLowerCase().includes(searchLower) ||
        article.category.toLowerCase().includes(searchLower) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    res.json({
      success: true,
      data: {
        articles,
        total: articles.length,
        categories: [...new Set(allArticles.map(a => a.category))],
        popularArticles: allArticles.filter(a => a.popular)
      }
    });
  } catch (error) {
    console.error('Help articles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load help articles',
      error: error.message
    });
  }
});

// Get FAQ
router.get('/faq', async (req, res) => {
  try {
    // Mock FAQ data - in production, this would come from a database
    const faq = [
      {
        id: 1,
        question: 'How do I create my first article?',
        answer: 'Navigate to the Content section and click "New Article". Use our rich text editor to write your content, add media, and publish when ready.',
        category: 'Getting Started'
      },
      {
        id: 2,
        question: 'Can I schedule content to publish later?',
        answer: 'Yes! When creating or editing content, change the status to "Scheduled" and select your desired publication date and time.',
        category: 'Publishing'
      },
      {
        id: 3,
        question: 'What file types can I upload?',
        answer: 'You can upload images (JPG, PNG, GIF, WebP) up to 2MB and various document types (PDF, DOC, TXT) up to 5MB.',
        category: 'Media'
      },
      {
        id: 4,
        question: 'How do I change my password?',
        answer: 'Go to your Profile settings and click on the Security tab. Enter your current password and your new password to make the change.',
        category: 'Account'
      },
      {
        id: 5,
        question: 'Can I collaborate with other users?',
        answer: 'Collaboration features depend on your account type and tenant settings. Contact your administrator for team collaboration options.',
        category: 'Collaboration'
      },
      {
        id: 6,
        question: 'How do I delete content?',
        answer: 'Content can be deleted from the content management tabs. Deleted content goes to drafts first and can be permanently removed by administrators.',
        category: 'Content Management'
      }
    ];
    
    res.json({
      success: true,
      data: {
        faq,
        categories: [...new Set(faq.map(f => f.category))]
      }
    });
  } catch (error) {
    console.error('FAQ error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load FAQ',
      error: error.message
    });
  }
});

module.exports = router;