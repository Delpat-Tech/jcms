// controllers/tenantBrandingController.js
const Tenant = require('../models/tenant');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { ensureTenantStorageExists } = require('../utils/tenantStorage');

// Configure multer for branding assets
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tenantId = req.params.tenantId;
    const uploadPath = ensureTenantStorageExists(tenantId, null, 'branding');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${file.fieldname}-${Date.now()}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Get tenant branding
const getTenantBranding = async (req, res) => {
  try {
    const { tenantId } = req.params;

    // Check access permissions
    if (req.user.role.name !== 'superadmin' && 
        req.user.tenant?._id?.toString() !== tenantId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const tenant = await Tenant.findById(tenantId).select('name subdomain branding');
    
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    // Convert relative URLs to absolute URLs
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const branding = { ...tenant.branding.toObject() };
    
    if (branding.logo?.url) {
      branding.logo.url = `${baseUrl}/${branding.logo.url}`;
    }
    if (branding.favicon?.url) {
      branding.favicon.url = `${baseUrl}/${branding.favicon.url}`;
    }

    res.json({
      success: true,
      tenant: {
        id: tenant._id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        branding
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update tenant branding
const updateTenantBranding = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const {
      colors,
      typography,
      theme,
      customCSS,
      companyInfo
    } = req.body;

    // Check access permissions
    if (req.user.role.name !== 'superadmin' && 
        req.user.tenant?._id?.toString() !== tenantId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    // Update branding fields
    const brandingUpdate = {};
    
    if (colors) {
      brandingUpdate['branding.colors'] = {
        ...tenant.branding.colors.toObject(),
        ...colors
      };
    }
    
    if (typography) {
      brandingUpdate['branding.typography'] = {
        ...tenant.branding.typography.toObject(),
        ...typography
      };
    }
    
    if (theme) {
      brandingUpdate['branding.theme'] = {
        ...tenant.branding.theme.toObject(),
        ...theme
      };
    }
    
    if (customCSS !== undefined) {
      brandingUpdate['branding.customCSS'] = customCSS;
    }
    
    if (companyInfo) {
      brandingUpdate['branding.companyInfo'] = {
        ...tenant.branding.companyInfo.toObject(),
        ...companyInfo
      };
    }

    const updatedTenant = await Tenant.findByIdAndUpdate(
      tenantId,
      { $set: brandingUpdate },
      { new: true, runValidators: true }
    ).select('name subdomain branding');

    res.json({
      success: true,
      message: 'Branding updated successfully',
      tenant: updatedTenant
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Upload tenant logo
const uploadTenantLogo = async (req, res) => {
  const uploadHandler = upload.single('logo');
  
  uploadHandler(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    try {
      const { tenantId } = req.params;

      // Check access permissions
      if (req.user.role.name !== 'superadmin' && 
          req.user.tenant?._id?.toString() !== tenantId) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No logo file uploaded' });
      }

      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return res.status(404).json({ success: false, message: 'Tenant not found' });
      }

      // Delete old logo if exists
      if (tenant.branding.logo.filename) {
        const oldLogoPath = path.join(
          ensureTenantStorageExists(tenantId, null, 'branding'),
          tenant.branding.logo.filename
        );
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
        }
      }

      // Update tenant with new logo info
      const relativePath = path.join('uploads', tenantId, 'branding', req.file.filename).replace(/\\/g, '/');
      const logoUrl = `${req.protocol}://${req.get('host')}/${relativePath}`;

      const updatedTenant = await Tenant.findByIdAndUpdate(
        tenantId,
        {
          $set: {
            'branding.logo.url': relativePath,
            'branding.logo.filename': req.file.filename,
            'branding.logo.uploadedAt': new Date()
          }
        },
        { new: true }
      ).select('name subdomain branding');

      res.json({
        success: true,
        message: 'Logo uploaded successfully',
        logo: {
          url: logoUrl,
          filename: req.file.filename,
          uploadedAt: updatedTenant.branding.logo.uploadedAt
        }
      });
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ success: false, message: error.message });
    }
  });
};

// Upload tenant favicon
const uploadTenantFavicon = async (req, res) => {
  const uploadHandler = upload.single('favicon');
  
  uploadHandler(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    try {
      const { tenantId } = req.params;

      // Check access permissions
      if (req.user.role.name !== 'superadmin' && 
          req.user.tenant?._id?.toString() !== tenantId) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No favicon file uploaded' });
      }

      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return res.status(404).json({ success: false, message: 'Tenant not found' });
      }

      // Delete old favicon if exists
      if (tenant.branding.favicon.filename) {
        const oldFaviconPath = path.join(
          ensureTenantStorageExists(tenantId, null, 'branding'),
          tenant.branding.favicon.filename
        );
        if (fs.existsSync(oldFaviconPath)) {
          fs.unlinkSync(oldFaviconPath);
        }
      }

      // Update tenant with new favicon info
      const relativePath = path.join('uploads', tenantId, 'branding', req.file.filename).replace(/\\/g, '/');
      const faviconUrl = `${req.protocol}://${req.get('host')}/${relativePath}`;

      const updatedTenant = await Tenant.findByIdAndUpdate(
        tenantId,
        {
          $set: {
            'branding.favicon.url': relativePath,
            'branding.favicon.filename': req.file.filename,
            'branding.favicon.uploadedAt': new Date()
          }
        },
        { new: true }
      ).select('name subdomain branding');

      res.json({
        success: true,
        message: 'Favicon uploaded successfully',
        favicon: {
          url: faviconUrl,
          filename: req.file.filename,
          uploadedAt: updatedTenant.branding.favicon.uploadedAt
        }
      });
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ success: false, message: error.message });
    }
  });
};

// Delete tenant branding asset
const deleteTenantBrandingAsset = async (req, res) => {
  try {
    const { tenantId, assetType } = req.params; // assetType: 'logo' or 'favicon'

    // Check access permissions
    if (req.user.role.name !== 'superadmin' && 
        req.user.tenant?._id?.toString() !== tenantId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (!['logo', 'favicon'].includes(assetType)) {
      return res.status(400).json({ success: false, message: 'Invalid asset type' });
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    const asset = tenant.branding[assetType];
    if (!asset.filename) {
      return res.status(404).json({ success: false, message: `No ${assetType} found` });
    }

    // Delete physical file
    const assetPath = path.join(
      ensureTenantStorageExists(tenantId, null, 'branding'),
      asset.filename
    );
    if (fs.existsSync(assetPath)) {
      fs.unlinkSync(assetPath);
    }

    // Update tenant record
    const updateField = {};
    updateField[`branding.${assetType}`] = {
      url: '',
      filename: '',
      uploadedAt: null
    };

    await Tenant.findByIdAndUpdate(tenantId, { $set: updateField });

    res.json({
      success: true,
      message: `${assetType.charAt(0).toUpperCase() + assetType.slice(1)} deleted successfully`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reset tenant branding to defaults
const resetTenantBranding = async (req, res) => {
  try {
    const { tenantId } = req.params;

    // Check access permissions
    if (req.user.role.name !== 'superadmin' && 
        req.user.tenant?._id?.toString() !== tenantId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    // Delete existing branding assets
    ['logo', 'favicon'].forEach(assetType => {
      const asset = tenant.branding[assetType];
      if (asset.filename) {
        const assetPath = path.join(
          ensureTenantStorageExists(tenantId, null, 'branding'),
          asset.filename
        );
        if (fs.existsSync(assetPath)) {
          fs.unlinkSync(assetPath);
        }
      }
    });

    // Reset branding to default values
    const defaultBranding = {
      logo: { url: '', filename: '', uploadedAt: null },
      favicon: { url: '', filename: '', uploadedAt: null },
      colors: {
        primary: '#3b82f6',
        secondary: '#64748b',
        accent: '#10b981',
        background: '#ffffff',
        surface: '#f8fafc',
        text: {
          primary: '#1e293b',
          secondary: '#64748b'
        }
      },
      typography: {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: {
          small: '14px',
          medium: '16px',
          large: '18px'
        }
      },
      theme: {
        mode: 'light',
        borderRadius: '8px',
        shadowIntensity: 'medium'
      },
      customCSS: '',
      companyInfo: {
        tagline: '',
        website: '',
        supportEmail: '',
        phone: ''
      }
    };

    const updatedTenant = await Tenant.findByIdAndUpdate(
      tenantId,
      { $set: { branding: defaultBranding } },
      { new: true }
    ).select('name subdomain branding');

    res.json({
      success: true,
      message: 'Branding reset to defaults successfully',
      tenant: updatedTenant
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Generate CSS variables from tenant branding
const generateTenantCSS = async (req, res) => {
  try {
    const { tenantId } = req.params;

    const tenant = await Tenant.findById(tenantId).select('branding name subdomain');
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    const { colors, typography, theme } = tenant.branding;
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    // Generate CSS variables
    let css = `:root {\n`;
    
    // Colors
    css += `  --tenant-color-primary: ${colors.primary};\n`;
    css += `  --tenant-color-secondary: ${colors.secondary};\n`;
    css += `  --tenant-color-accent: ${colors.accent};\n`;
    css += `  --tenant-color-background: ${colors.background};\n`;
    css += `  --tenant-color-surface: ${colors.surface};\n`;
    css += `  --tenant-color-text-primary: ${colors.text.primary};\n`;
    css += `  --tenant-color-text-secondary: ${colors.text.secondary};\n`;
    
    // Typography
    css += `  --tenant-font-family: ${typography.fontFamily};\n`;
    css += `  --tenant-font-size-small: ${typography.fontSize.small};\n`;
    css += `  --tenant-font-size-medium: ${typography.fontSize.medium};\n`;
    css += `  --tenant-font-size-large: ${typography.fontSize.large};\n`;
    
    // Theme
    css += `  --tenant-border-radius: ${theme.borderRadius};\n`;
    
    // Shadow intensity mapping
    const shadowMap = {
      'none': 'none',
      'light': '0 1px 3px rgba(0, 0, 0, 0.1)',
      'medium': '0 4px 6px rgba(0, 0, 0, 0.1)',
      'strong': '0 10px 15px rgba(0, 0, 0, 0.1)'
    };
    css += `  --tenant-shadow: ${shadowMap[theme.shadowIntensity]};\n`;
    
    // Logo URL if available
    if (tenant.branding.logo.url) {
      css += `  --tenant-logo-url: url('${baseUrl}/${tenant.branding.logo.url}');\n`;
    }
    
    css += `}\n\n`;
    
    // Add custom CSS if provided
    if (tenant.branding.customCSS) {
      css += `/* Custom tenant CSS */\n${tenant.branding.customCSS}\n`;
    }

    res.setHeader('Content-Type', 'text/css');
    res.send(css);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTenantBranding,
  updateTenantBranding,
  uploadTenantLogo,
  uploadTenantFavicon,
  deleteTenantBrandingAsset,
  resetTenantBranding,
  generateTenantCSS
};