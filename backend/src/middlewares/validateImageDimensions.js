// middlewares/validateImageDimensions.js
const sharp = require("sharp");
const fs = require("fs");

const validateImageDimensions = (minWidth, maxWidth, minHeight, maxHeight) => {
  return async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file uploaded" });
      }

      // Read dimensions using sharp
      const metadata = await sharp(req.file.path).metadata();

      const { width, height } = metadata;

      if (width < minWidth || width > maxWidth || height < minHeight || height > maxHeight) {
        // Delete invalid fixle
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          message: `Invalid image dimensions. 
            Allowed range: width ${minWidth}-${maxWidth}px, height ${minHeight}-${maxHeight}px. 
            Uploaded: ${width}x${height}`,
        });
      }

      // Passed validation
      next();
    } catch (error) {
      return res.status(500).json({ success: false, message: "Image validation failed", error: error.message });
    }
  };
};

module.exports = validateImageDimensions;
