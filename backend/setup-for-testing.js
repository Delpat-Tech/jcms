// setup-for-testing.js
// Quick setup script to prepare the system for Postman testing

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up JCMS for Postman Testing...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    console.log('⚠️  .env file not found!');
    console.log('📝 Creating .env file from template...\n');
    
    const envTemplate = `# =========================
# SERVER CONFIGURATION  
# =========================
PORT=5000
ALLOWED_ORIGINS=http://localhost:5000,http://127.0.0.1:5000
ALLOW_LOCALHOST_WILDCARD=true

# =========================
# MONGODB CONFIGURATION
# =========================
MONGO_URI=mongodb://localhost:27017/jcms

# =========================
# JWT CONFIGURATION
# =========================
JWT_SECRET=your-super-secret-jwt-key-for-testing

# =========================
# NOTIFICATION CONFIGURATION
# =========================
NOTIFICATIONS_ENABLED=true
QUIET_MODE=false
CRITICAL_ONLY=false

# Activity thresholds
ACTIVITY_THRESHOLD=25
ACTIVITY_TIME_WINDOW=900000
RESET_INTERVAL=1800000
COOLDOWN_PERIOD=300000

# Time bucket configuration
TIME_BUCKETS_ENABLED=true
HOURLY_THRESHOLD=5
DAILY_THRESHOLD=10
BUCKET_CLEANUP_INTERVAL=3600000
BUCKET_RETENTION_HOURS=24
BUCKET_RETENTION_DAYS=7
`;

    fs.writeFileSync(envPath, envTemplate);
    console.log('✅ .env file created successfully!');
    console.log('📋 Please update MONGO_URI if needed\n');
} else {
    console.log('✅ .env file exists');
}

// Check if package.json exists and has required dependencies
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
    console.log('✅ package.json found');
    
    // Check if node_modules exists
    const nodeModulesPath = path.join(__dirname, 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
        console.log('⚠️  node_modules not found');
        console.log('🔧 Please run: npm install');
    } else {
        console.log('✅ node_modules exists');
    }
} else {
    console.log('❌ package.json not found!');
}

// Check for Postman collection
const collectionPath = path.join(__dirname, 'Enhanced-Tenant-Management.postman_collection.json');
if (fs.existsSync(collectionPath)) {
    console.log('✅ Postman collection ready');
} else {
    console.log('❌ Postman collection not found!');
}

console.log('\n📋 Setup Status Summary:');
console.log('========================');
console.log(`✅ Environment file: ${fs.existsSync(envPath) ? 'Ready' : 'Missing'}`);
console.log(`✅ Dependencies: ${fs.existsSync(path.join(__dirname, 'node_modules')) ? 'Installed' : 'Need npm install'}`);
console.log(`✅ Postman collection: ${fs.existsSync(collectionPath) ? 'Ready' : 'Missing'}`);

console.log('\n🚀 Next Steps:');
console.log('==============');
console.log('1. Ensure MongoDB is running');
console.log('2. Run: npm install (if needed)');
console.log('3. Start server: npm run dev');
console.log('4. Create superadmin: node createSuperAdmin.js');
console.log('5. Import Postman collection and start testing!');

console.log('\n🔗 Quick Commands:');
console.log('==================');
console.log('# Install dependencies (if needed)');
console.log('npm install');
console.log('');
console.log('# Create superadmin user');
console.log('node createSuperAdmin.js');
console.log('');
console.log('# Start the server');
console.log('npm run dev');
console.log('');
console.log('# Test with Node.js script');
console.log('node test-tenant-features.js');

console.log('\n✨ System ready for Postman testing!');