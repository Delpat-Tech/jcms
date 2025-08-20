const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const Image = require("../models/image");

// Ensure directory exists
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

/**
 * Process and save image in multiple formats.
 * Saves each format as a separate document in MongoDB.
 */
async function processAndSaveImage(buffer, tenant, section, title, subtitle, originalName) {
  const destFolder = path.join(__dirname, "..", "uploads", tenant, section);
  ensureDir(destFolder);

  const formats = ["avif", "webp"];
  const savedImages = [];

  for (const format of formats) {
    const fileName = `${Date.now()}-${originalName.split(".")[0]}.${format}`;
    const filePath = path.join(destFolder, fileName);

    const metadata = await sharp(buffer)[format]().toFile(filePath);

    // Save to MongoDB
    const imageDoc = new Image({
      title,
      subtitle,
      filePath,
      width: metadata.width,
      height: metadata.height,
      format,
      tenant,
      section,
    });

    await imageDoc.save();
    savedImages.push(imageDoc);
  }

  return savedImages;
}

module.exports = { processAndSaveImage };
