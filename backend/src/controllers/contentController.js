// controllers/contentController.js
const Content = require('../models/content');

// simple slugify helper
const slugify = (text = '') => {
  return (text || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Create content
const createContent = async (req, res) => {
  try {
    const { title, content, excerpt, type, status, tags, coverImageUrl, scheduledAt, slug } = req.body;
    
    const newContent = new Content({
      title,
      content,
      excerpt,
      type: type || 'article',
      status: status || 'draft',
      tags: tags || [],
      coverImageUrl,
      scheduledAt,
      author: req.user.id,
      tenant: req.user.tenant,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // assign slug if not provided
    if (!newContent.slug) {
      const base = slug ? slugify(slug) : slugify(title || 'content');
      newContent.slug = `${base}-${Date.now().toString(36).slice(-5)}`;
    }

    if (status === 'published') {
      newContent.publishedAt = new Date();
    }

    const savedContent = await newContent.save();
    res.status(201).json({ 
      success: true, 
      data: savedContent,
      id: savedContent._id
    });
  } catch (error) {
    console.error('Create content error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create content',
      error: error.message 
    });
  }
};

// Get all content (with filtering)
const getContent = async (req, res) => {
  try {
    const filter = {
      tenant: req.user.tenant,
      deleted: { $ne: true }
    };
    
    // If user is not admin or superadmin, only show their own content
    if (req.user.role && req.user.role.name && !['admin', 'superadmin'].includes(req.user.role.name)) {
      filter.author = req.user.id;
    }

    // Apply status filter if provided
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const content = await Content.find(filter)
      .populate('author', 'username email')
      .sort({ createdAt: -1 })
      .limit(parseInt(req.query.limit) || 50);

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch content',
      error: error.message 
    });
  }
};

// Get content by ID
const getContentById = async (req, res) => {
  try {
    const filter = {
      _id: req.params.id,
      tenant: req.user.tenant,
      deleted: { $ne: true }
    };
    
    // If user is not admin or superadmin, only allow viewing their own content
    if (req.user.role && req.user.role.name && !['admin', 'superadmin'].includes(req.user.role.name)) {
      filter.author = req.user.id;
    }
    
    const content = await Content.findOne(filter).populate('author', 'username email');

    if (!content) {
      return res.status(404).json({ 
        success: false, 
        message: 'Content not found' 
      });
    }

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Get content by ID error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch content',
      error: error.message 
    });
  }
};

// Delete content
const deleteContent = async (req, res) => {
  try {
    const filter = {
      _id: req.params.id,
      tenant: req.user.tenant,
      deleted: { $ne: true }
    };
    
    // If user is not admin or superadmin, only allow deleting their own content
    if (req.user.role && req.user.role.name && !['admin', 'superadmin'].includes(req.user.role.name)) {
      filter.author = req.user.id;
    }
    
    const content = await Content.findOneAndUpdate(
      filter,
      { 
        deleted: true, 
        deletedAt: new Date() 
      },
      { new: true }
    );

    if (!content) {
      return res.status(404).json({ 
        success: false, 
        message: 'Content not found' 
      });
    }

    res.json({
      success: true,
      message: 'Content deleted successfully'
    });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete content',
      error: error.message 
    });
  }
};

// Publish content
const publishContent = async (req, res) => {
  try {
    const filter = {
      _id: req.params.id,
      tenant: req.user.tenant,
      deleted: { $ne: true }
    };
    
    // If user is not admin or superadmin, only allow publishing their own content
    if (req.user.role && req.user.role.name && !['admin', 'superadmin'].includes(req.user.role.name)) {
      filter.author = req.user.id;
    }
    
    const content = await Content.findOneAndUpdate(
      filter,
      { 
        status: 'published',
        publishedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    ).populate('author', 'username email');

    if (!content) {
      return res.status(404).json({ 
        success: false, 
        message: 'Content not found' 
      });
    }

    res.json({
      success: true,
      data: content,
      message: 'Content published successfully'
    });
  } catch (error) {
    console.error('Publish content error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to publish content',
      error: error.message 
    });
  }
};

// Schedule content
const scheduleContent = async (req, res) => {
  try {
    const { scheduledAt } = req.body;
    
    if (!scheduledAt) {
      return res.status(400).json({
        success: false,
        message: 'scheduledAt date is required'
      });
    }

    const filter = {
      _id: req.params.id,
      tenant: req.user.tenant,
      deleted: { $ne: true }
    };
    
    // If user is not admin or superadmin, only allow scheduling their own content
    if (req.user.role && req.user.role.name && !['admin', 'superadmin'].includes(req.user.role.name)) {
      filter.author = req.user.id;
    }
    
    const content = await Content.findOneAndUpdate(
      filter,
      { 
        status: 'scheduled',
        scheduledAt: new Date(scheduledAt),
        updatedAt: new Date()
      },
      { new: true }
    ).populate('author', 'username email');

    if (!content) {
      return res.status(404).json({ 
        success: false, 
        message: 'Content not found' 
      });
    }

    res.json({
      success: true,
      data: content,
      message: 'Content scheduled successfully'
    });
  } catch (error) {
    console.error('Schedule content error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to schedule content',
      error: error.message 
    });
  }
};

// Get content by status
const getContentByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    
    const filter = {
      status,
      tenant: req.user.tenant,
      deleted: { $ne: true }
    };
    
    // If user is not admin or superadmin, only show their own content
    if (req.user.role && req.user.role.name && !['admin', 'superadmin'].includes(req.user.role.name)) {
      filter.author = req.user.id;
    }

    const content = await Content.find(filter)
      .populate('author', 'username email')
      .sort({ createdAt: -1 })
      .limit(parseInt(req.query.limit) || 50);

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Get content by status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch content by status',
      error: error.message 
    });
  }
};

// Update content
const updateContent = async (req, res) => {
  try {
    const { title, content, excerpt, type, status, tags, coverImageUrl, scheduledAt, slug } = req.body;
    
    const updateData = {
      title,
      content,
      excerpt,
      type,
      status,
      tags,
      coverImageUrl,
      scheduledAt,
      updatedAt: new Date()
    };

    // If slug is explicitly provided, use it, else if missing and title exists, regenerate a slug
    if (typeof slug === 'string' && slug.trim()) {
      updateData.slug = slugify(slug);
    } else if (title) {
      updateData.slug = `${slugify(title)}-${Date.now().toString(36).slice(-5)}`;
    }

    // Set publishedAt when publishing
    if (status === 'published' && req.body.status !== 'published') {
      updateData.publishedAt = new Date();
    }

    const filter = {
      _id: req.params.id,
      tenant: req.user.tenant,
      deleted: { $ne: true }
    };
    
    // If user is not admin or superadmin, only allow updating their own content
    if (req.user.role && req.user.role.name && !['admin', 'superadmin'].includes(req.user.role.name)) {
      filter.author = req.user.id;
    }
    
    const updatedContent = await Content.findOneAndUpdate(
      filter,
      updateData,
      { new: true, runValidators: true }
    ).populate('author', 'username email');

    if (!updatedContent) {
      return res.status(404).json({ 
        success: false, 
        message: 'Content not found' 
      });
    }

    res.json({
      success: true,
      data: updatedContent,
      id: updatedContent._id
    });
  } catch (error) {
    console.error('Update content error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update content',
      error: error.message 
    });
  }
};

// Public: fetch published content by slug or id (no auth)
const getPublicContentBySlugOrId = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const tenant = req.query.tenant; // optional multi-tenant filter via query

    const filter = {
      status: 'published',
      deleted: { $ne: true }
    };
    if (tenant) filter.tenant = tenant;

    let content;
    if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      content = await Content.findOne({ ...filter, _id: idOrSlug });
    } else {
      content = await Content.findOne({ ...filter, slug: idOrSlug.toLowerCase() });
    }

    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    // increment views
    content.views = (content.views || 0) + 1;
    await content.save();

    res.json({ success: true, data: content });
  } catch (error) {
    console.error('Get public content error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch public content', error: error.message });
  }
};

module.exports = {
  createContent,
  getContent,
  getContentById,
  updateContent,
  deleteContent,
  publishContent,
  scheduleContent,
  getContentByStatus,
  getPublicContentBySlugOrId
};