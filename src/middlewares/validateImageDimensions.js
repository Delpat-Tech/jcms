// middlewares/validateImageDimensions.js
const sharp = require("sharp");
const { safeDeleteFile } = require('../utils/safeDeleteFile'); // Import safe delete

const validateImageDimensions = (minWidth, maxWidth, minHeight, maxHeight) => {
  return async (req, res, next) => {
    try {
      // 2. If no file is uploaded (e.g., updating text only), skip validation.
      if (!req.file) {
        return next();
      }

      const metadata = await sharp(req.file.path).metadata();
      const { width, height } = metadata;

      if (width < minWidth || width > maxWidth || height < minHeight || height > maxHeight) {
        // Delete invalid file asynchronously using your utility
        await safeDeleteFile(req.file.path); 
        return res.status(400).json({
          success: false,
          message: `Invalid image dimensions. Allowed range: width ${minWidth}-${maxWidth}px, height ${minHeight}-${maxHeight}px. Uploaded: ${width}x${height}`,
        });
      }

      next();
    } catch (error) {
      if (req.file) {
        await safeDeleteFile(req.file.path); // Clean up on error
      }
      return res.status(500).json({ success: false, message: "Image validation failed", error: error.message });
    }
  };
};

module.exports = validateImageDimensions;