const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const logger = require('./config/logger');

const app = express();

// Middleware setup
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5000,http://127.0.0.1:5000,http://localhost:3000,http://127.0.0.1:3000,https://jackson-intellectual-native-assembly.trycloudflare.com,https://chemicals-happy-vinyl-presented.trycloudflare.com')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);
const allowLocalhostWildcard = (process.env.ALLOW_LOCALHOST_WILDCARD || 'true').toLowerCase() === 'true';
const localhostRegex = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With'],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve public files for Cloudflare Tunnel
app.use('/public', express.static(path.join(__dirname, '../public')));
app.use(express.urlencoded({ extended: true }));

// Serve the main HTML file at root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Public collection gallery route (no auth required)
app.get('/gallery', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Public collection gallery with specific collections
app.get('/gallery/:collectionIds', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Add endpoint to get image collections
app.get('/api/collections', async (req, res) => {
  try {
    const ImageCollection = require('./models/imageCollection');
    const Image = require('./models/image');
    
    // Get all collections with image counts
    const collections = await ImageCollection.find({})
      .populate('user', 'username email')
      .populate('coverImage')
      .sort({ createdAt: -1 });
    
    // Add image counts and sample images for each collection
    const collectionsWithImages = await Promise.all(
      collections.map(async (collection) => {
        const images = await Image.find({ collection: collection._id }).limit(5);
        return {
          ...collection.toJSON(),
          imageCount: images.length,
          sampleImages: images
        };
      })
    );
    
    res.json({ success: true, data: collectionsWithImages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Public endpoint to get public collections (no auth required)
app.get('/api/public/collections', async (req, res) => {
  try {
    const ImageCollection = require('./models/imageCollection');
    const Image = require('./models/image');
    
    // Get only public collections
    const collections = await ImageCollection.find({ visibility: 'public' })
      .populate('user', 'username email')
      .populate('coverImage')
      .sort({ createdAt: -1 });
    
    // Add image counts and sample images for each collection
    const collectionsWithImages = await Promise.all(
      collections.map(async (collection) => {
        const images = await Image.find({ 
          collection: collection._id,
          visibility: 'public' 
        }).limit(5);
        return {
          ...collection.toJSON(),
          imageCount: images.length,
          sampleImages: images
        };
      })
    );
    
    res.json({ success: true, data: collectionsWithImages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add endpoint to get images from specific collections
app.get('/api/collections/:ids/images', async (req, res) => {
  try {
    const Image = require('./models/image');
    const collectionIds = req.params.ids.split(',');
    
    const images = await Image.find({ 
      collection: { $in: collectionIds } 
    })
    .populate('user', 'username email')
    .populate('collection', 'name slug')
    .sort({ createdAt: -1 });
    
    res.json({ success: true, data: images, images: images });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Public endpoint to get images from public collections (no auth required)
app.get('/api/public/collections/:ids/images', async (req, res) => {
  try {
    const Image = require('./models/image');
    const collectionIds = req.params.ids.split(',');
    
    const images = await Image.find({ 
      collection: { $in: collectionIds },
      visibility: 'public'
    })
    .populate('user', 'username email')
    .populate('collection', 'name slug')
    .sort({ createdAt: -1 });
    
    res.json({ success: true, data: images, images: images });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Public API endpoint to get collection by slug (no auth required)
app.get('/api/public/collection/:slug', async (req, res) => {
  try {
    const ImageCollection = require('./models/imageCollection');
    const Image = require('./models/image');
    const File = require('./models/file');
    
    // Find collection by slug
    const collection = await ImageCollection.findOne({ 
      slug: req.params.slug,
      visibility: 'public'
    });
    
    if (!collection) {
      return res.status(404).json({ 
        success: false, 
        message: 'Collection not found or not public' 
      });
    }
    
    // Get images in collection (all images if collection is public)
    const images = await Image.find({ 
      $or: [
        { collection: collection._id },
        { collections: collection._id }
      ]
    }).sort({ createdAt: -1 });
    
    // Get files in collection
    const files = await File.find({ 
      $or: [
        { collection: collection._id },
        { collections: collection._id }
      ]
    }).sort({ createdAt: -1 });
    
    // Transform to clean format
    const cleanImages = images.map((image, index) => ({
      index: index + 1,
      title: image.title || '',
      type: 'image',
      fileUrl: image.fileUrl || image.publicUrl || '',
      notes: {}
    }));
    
    const fs = require('fs');
    
    const cleanFiles = await Promise.all(files.map(async (file, index) => {
      const fileItem = {
        index: cleanImages.length + index + 1,
        title: file.title || '',
        type: file.format === 'json' ? 'json' : 'file',
        fileUrl: file.fileUrl || '',
        notes: file.notes || ''
      };
      
      // If it's a JSON file, try to read and parse the content
      if (file.format === 'json' && file.fileUrl) {
        try {
          // Extract path from URL if it's a full URL
          let filePath = file.fileUrl;
          if (filePath.startsWith('http')) {
            const url = new URL(filePath);
            filePath = url.pathname;
          }
          
          const possiblePaths = [
            path.join(__dirname, '..', filePath.replace(/^\//, '')),
            path.join(__dirname, '../uploads', filePath.replace(/^\/uploads\//, '')),
            filePath.startsWith('/') ? path.join(__dirname, '..', filePath.substring(1)) : path.join(__dirname, '..', filePath)
          ];
          
          let jsonContent = null;
          for (const filePath of possiblePaths) {
            if (fs.existsSync(filePath)) {
              jsonContent = fs.readFileSync(filePath, 'utf8');
              break;
            }
          }
          
          if (jsonContent) {
            fileItem.data = JSON.parse(jsonContent);
          } else {
            console.log('JSON file not found at any path:', possiblePaths);
          }
        } catch (error) {
          console.log('Failed to read JSON file:', error.message);
        }
      }
      
      return fileItem;
    }));
    
    const allItems = [...cleanImages, ...cleanFiles];
    
    res.json({
      success: true,
      data: {
        slug: collection.slug,
        name: collection.name,
        description: collection.description,
        items: allItems
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Public API endpoint to get collection by ID (no auth required)
app.get('/api/public/collection/id/:id', async (req, res) => {
  try {
    const ImageCollection = require('./models/imageCollection');
    const Image = require('./models/image');
    const File = require('./models/file');
    
    // Find collection by ID
    const collection = await ImageCollection.findOne({ 
      _id: req.params.id,
      visibility: 'public'
    });
    
    if (!collection) {
      return res.status(404).json({ 
        success: false, 
        message: 'Collection not found or not public' 
      });
    }
    
    // Get images in collection (all images if collection is public)
    const images = await Image.find({ 
      $or: [
        { collection: collection._id },
        { collections: collection._id }
      ]
    }).sort({ createdAt: -1 });
    
    // Get files in collection
    const files = await File.find({ 
      collection: collection._id 
    }).sort({ createdAt: -1 });
    
    // Transform to clean format
    const cleanImages = images.map((image, index) => ({
      index: index + 1,
      title: image.title || '',
      fileUrl: image.fileUrl || image.publicUrl || '',
      notes: image.notes || '',
      type: 'image'
    }));
    
    const cleanFiles = files.map((file, index) => ({
      index: cleanImages.length + index + 1,
      title: file.title || '',
      fileUrl: file.fileUrl || '',
      notes: file.notes || '',
      type: file.format === 'json' ? 'json' : 'file',
      format: file.format
    }));
    
    const allItems = [...cleanImages, ...cleanFiles];
    
    res.json({
      success: true,
      data: {
        id: collection._id,
        slug: collection.slug,
        name: collection.name,
        description: collection.description,
        items: allItems
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add a simple endpoint to get sample images from public folder
app.get('/api/sample-images', (req, res) => {
  try {
    const sampleImages = [
      {
        _id: 'sample-kitty',
        title: 'Kitty',
        description: 'A cute kitten image from the public collection',
        filename: 'download.jpeg',
        fileUrl: '/public/kitty/download.jpeg',
        internalPath: 'public/kitty/download.jpeg',
        createdAt: new Date(),
        uploadedBy: { name: 'System' }
      }
    ];
    
    res.json({ success: true, data: sampleImages, images: sampleImages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Debug endpoint to check what images exist
app.get('/api/debug/images', async (req, res) => {
  try {
    const Image = require('./models/image');
    const ImageCollection = require('./models/imageCollection');
    
    const allImages = await Image.find({}).populate('collection', 'name slug').limit(10);
    const allCollections = await ImageCollection.find({}).limit(10);
    
    res.json({ 
      success: true, 
      data: {
        images: allImages,
        collections: allCollections,
        imageCount: await Image.countDocuments(),
        collectionCount: await ImageCollection.countDocuments()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Health check routes
app.get("/api/health", (req, res) => {
  res.status(200).json({ 
    message: "Server is running", 
    port: process.env.PORT || 5000, 
    timestamp: new Date() 
  });
});

app.get('/api/debug-notes', async (req, res) => {
  try {
    const Image = require('./models/image');
    const File = require('./models/file');
    
    const images = await Image.find({}).limit(5).select('title notes');
    const files = await File.find({}).limit(5).select('title notes');
    
    res.json({ success: true, images, files });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API Routes
app.use('/api/images', require('./routes/imagesRoutes'));
app.use('/api/image-management', require('./routes/imageManagementRoutes'));
app.use('/api/files', require('./routes/fileRoutes'));
app.use('/api/content', require('./routes/contentRoutes'));
// Public content routes (no auth)
app.use('/api/public', require('./routes/publicContentRoutes'));
app.use('/public', require('./routes/publicContentRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/usersRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/superadmin', require('./routes/superadminRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/tenants', require('./routes/tenantRoutes'));
app.use('/api/tenant-analytics', require('./routes/tenantAnalyticsRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/activity', require('./routes/activityRoutes'));
app.use('/api/tenant-switching', require('./routes/tenantSwitchingRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/editor', require('./routes/editorRoutes'));
app.use('/api/help', require('./routes/helpRoutes'));
app.use('/api/subscriptions', require('./routes/subscriptionRoutes'));

// Public settings endpoint
app.get('/api/settings', async (req, res) => {
  try {
    const Settings = require('./models/settings');
    const settings = await Settings.getSettings();
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Max 2MB allowed."
      });
    }
    return res.status(400).json({ success: false, message: err.message });
  } else if (err.message.includes("File type not supported")) {
    return res.status(400).json({ success: false, message: err.message });
  }

  logger.error('Unhandled server error', { 
    error: err.message, 
    stack: err.stack,
    url: req?.url, 
    method: req?.method 
  });
  res.status(500).json({
    success: false,
    message: "Server error",
    error: err.message
  });
});

module.exports = app;