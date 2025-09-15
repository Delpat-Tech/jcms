// src/config/imageProcessing.js
module.exports = {
  // General settings from your checklist
  avoidUpscale: true,
  kernel: 'lanczos3', // Best for high-quality downscaling
  fastShrinkOnLoad: true,
  preserveMetadata: true,
  sharpenThumb: 0.3, // Gentle sharpening for thumbnails

  // Encoder settings per your recommendations
  jpeg: {
    quality: 85,
    mozjpeg: true,
    chromaSubsampling: '4:4:4',
    progressive: true
  },
  webp: {
    quality: 88,
    smartSubsample: true,
    nearLossless: false
  },
  avif: {
    quality: 50,
    effort: 6
  },
  png: {
    compressionLevel: 8,
    quality: 90
  }
};