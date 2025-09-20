// controllers/contentController.js
const Content = require('../models/content');

// Create content
const createContent = async (req, res) => {
  try {
    const { title, content, excerpt, type, status, tags, coverImageUrl, scheduledAt } = req.body;
    
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

// Get all content for user
const getContent = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    
    const filter = {
      author: req.user.id,
      tenant: req.user.tenant,
      deleted: { $ne: true }
    };
    
    if (status) {
      filter.status = status;
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } }
      ];
    }

    const content = await Content.find(filter)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('author', 'username email');

    const total = await Content.countDocuments(filter);

    res.json({
      success: true,
      data: content,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
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

// Get content by status
const getContentByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const { search, page = 1, limit = 20 } = req.query;
    
    const filter = {
      author: req.user.id,
      tenant: req.user.tenant,
      status,
      deleted: { $ne: true }
    };
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const content = await Content.find(filter)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('author', 'username email');

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Get content by status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch content',
      error: error.message 
    });
  }
};

// Get single content by ID
const getContentById = async (req, res) => {
  try {
    const content = await Content.findOne({
      _id: req.params.id,
      author: req.user.id,
      tenant: req.user.tenant,
      deleted: { $ne: true }
    }).populate('author', 'username email');

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

// Update content
const updateContent = async (req, res) => {
  try {
    const { title, content, excerpt, type, status, tags, coverImageUrl, scheduledAt } = req.body;
    
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

    // Set publishedAt when publishing
    if (status === 'published' && req.body.status !== 'published') {
      updateData.publishedAt = new Date();
    }

    const updatedContent = await Content.findOneAndUpdate(
      {
        _id: req.params.id,
        author: req.user.id,
        tenant: req.user.tenant,
        deleted: { $ne: true }
      },
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

// Delete content (soft delete)
const deleteContent = async (req, res) => {
  try {
    const deletedContent = await Content.findOneAndUpdate(
      {
        _id: req.params.id,
        author: req.user.id,
        tenant: req.user.tenant,
        deleted: { $ne: true }
      },
      {
        deleted: true,
        deletedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!deletedContent) {
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
    const publishedContent = await Content.findOneAndUpdate(
      {
        _id: req.params.id,
        author: req.user.id,
        tenant: req.user.tenant,
        deleted: { $ne: true }
      },
      {
        status: 'published',
        publishedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('author', 'username email');

    if (!publishedContent) {
      return res.status(404).json({ 
        success: false, 
        message: 'Content not found' 
      });
    }

    res.json({
      success: true,
      data: publishedContent,
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
        message: 'Scheduled date is required' 
      });
    }

    const scheduledContent = await Content.findOneAndUpdate(
      {
        _id: req.params.id,
        author: req.user.id,
        tenant: req.user.tenant,
        deleted: { $ne: true }
      },
      {
        status: 'scheduled',
        scheduledAt: new Date(scheduledAt),
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('author', 'username email');

    if (!scheduledContent) {
      return res.status(404).json({ 
        success: false, 
        message: 'Content not found' 
      });
    }

    res.json({
      success: true,
      data: scheduledContent,
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

module.exports = {
  createContent,
  getContent,
  getContentById,
  updateContent,
  deleteContent,
  publishContent,
  scheduleContent,
  getContentByStatus
};