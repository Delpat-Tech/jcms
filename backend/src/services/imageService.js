// services/imageService.js
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const imgCfg = require('../config/imageProcessing');

const IMAGE_SIZES = {
  thumbnail: { width: 300, suffix: '_thumb' },
  medium: { width: 720, suffix: '_med' },
  large: { width: 1080, suffix: '_large' }
};

const generateMultipleSizes = async (inputBuffer, outputDir, baseName, format = 'webp') => {
  const results = {};

  fs.mkdirSync(outputDir, { recursive: true });

  // Read original width to avoid upscaling
  const meta = await sharp(inputBuffer).metadata();
  const originalWidth = meta.width || 0;

  for (const [sizeName, cfg] of Object.entries(IMAGE_SIZES)) {
    const targetWidth = imgCfg.avoidUpscale && originalWidth
      ? Math.min(cfg.width, originalWidth)
      : cfg.width;

    const outputPath = path.join(outputDir, `${baseName}${cfg.suffix}.${format}`);

    let pipeline = sharp(inputBuffer)
      .resize({
        width: targetWidth,
        height: null,
        fit: 'inside',
        withoutEnlargement: !!imgCfg.avoidUpscale,
        kernel: sharp.kernel[imgCfg.kernel] || sharp.kernel.lanczos3,
        fastShrinkOnLoad: !!imgCfg.fastShrinkOnLoad
      });

    if (imgCfg.preserveMetadata) pipeline = pipeline.withMetadata();
    if (sizeName === 'thumbnail' && imgCfg.sharpenThumb > 0) {
      pipeline = pipeline.sharpen(imgCfg.sharpenThumb);
    }

    // Format-specific encoders
    if (format === 'webp') {
      pipeline = pipeline.webp({
        quality: imgCfg.webp.quality,
        smartSubsample: imgCfg.webp.smartSubsample,
        nearLossless: imgCfg.webp.nearLossless
      });
    } else if (format === 'avif') {
      pipeline = pipeline.avif({
        quality: imgCfg.avif.quality,
        effort: imgCfg.avif.effort
      });
    } else if (format === 'jpeg' || format === 'jpg') {
      pipeline = pipeline.jpeg({
        quality: imgCfg.jpeg.quality,
        mozjpeg: imgCfg.jpeg.mozjpeg,
        chromaSubsampling: imgCfg.jpeg.chromaSubsampling,
        progressive: imgCfg.jpeg.progressive
      });
    } else if (format === 'png') {
      pipeline = pipeline.png({
        compressionLevel: imgCfg.png.compressionLevel,
        quality: imgCfg.png.quality
      });
    }

    await pipeline.toFile(outputPath);

    results[sizeName] = {
      path: outputPath.replace(/\\/g, '/'),
      width: targetWidth
    };
  }

  return results;
};

const convertImageFormat = async (inputPath, outputFormat) => {
  const allowedFormats = ['webp', 'avif', 'jpeg', 'png'];
  if (!allowedFormats.includes(outputFormat)) {
    throw new Error(`Invalid format. Allowed: ${allowedFormats.join(', ')}`);
  }

  const inputBuffer = fs.readFileSync(inputPath);
  const outputDir = path.dirname(inputPath);
  const baseName = path.parse(inputPath).name;
  const outputPath = path.join(outputDir, `${baseName}.${outputFormat}`);

  let pipeline = sharp(inputBuffer);

  if (outputFormat === 'webp') pipeline = pipeline.webp({ quality: imgCfg.webp.quality, smartSubsample: imgCfg.webp.smartSubsample, nearLossless: imgCfg.webp.nearLossless });
  else if (outputFormat === 'avif') pipeline = pipeline.avif({ quality: imgCfg.avif.quality, effort: imgCfg.avif.effort });
  else if (outputFormat === 'jpeg') pipeline = pipeline.jpeg({ quality: imgCfg.jpeg.quality, mozjpeg: imgCfg.jpeg.mozjpeg, chromaSubsampling: imgCfg.jpeg.chromaSubsampling, progressive: imgCfg.jpeg.progressive });
  else if (outputFormat === 'png') pipeline = pipeline.png({ compressionLevel: imgCfg.png.compressionLevel, quality: imgCfg.png.quality });

  await pipeline.toFile(outputPath);
  return outputPath.replace(/\\/g, '/');
};

module.exports = {
  generateMultipleSizes,
  convertImageFormat,
  IMAGE_SIZES
};
