// src/utils/backup.js
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const MONGO_URI = process.env.MONGO_URI;
const BACKUP_DIR = path.join(__dirname, "../../backup");

// Ensure backup folder exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

async function backupDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("✅ Connected to MongoDB");

        // Get all collections
        const collections = await mongoose.connection.db.listCollections().toArray();

        for (let coll of collections) {
            const name = coll.name;
            
            // Skip collections not needed in backup
            if (name === 'roles' || name === 'notifications') {
                console.log(`⏭️ Skipping collection: ${name}`);
                continue;
            }
            
            const data = await mongoose.connection.db.collection(name).find({}).toArray();

            const filePath = path.join(BACKUP_DIR, `${name}.json`);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

            console.log(`📦 Backed up collection: ${name} -> ${filePath}`);
        }

        console.log("🎉 Backup completed!");
        return { success: true, message: "Database backup completed successfully" };
    } catch (err) {
        console.error("❌ Backup failed:", err);
        return { success: false, message: "Backup failed", error: err.message };
    }
}

module.exports = { backupDatabase };