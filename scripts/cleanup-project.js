#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');

const filesToDelete = [
  'backend/api-test-simple.js',
  'backend/checkSuperAdmin.js',
  'backend/clear-mockdata.js',
  'backend/create-test-user.js',
  'backend/createSuperAdmin.js',
  'backend/fix-subscription-expiration.js',
  'backend/fix-user.js',
  'backend/migrate-collections.js',
  'backend/setup-for-testing.js',
  'backend/setupDatabase.js',
  'backend/test-api.js',
  'backend/test-superadmin-privileges.js',
  'backend/quickSetup.js',
  'backend/docs/api-part1.html',
  'backend/docs/api-part2.html',
  'backend/docs/api-part2-complete.html',
  'backend/docs/api-part3.html',
  'backend/docs/api-part3-complete.html',
  'backend/src/utils/test-realtime-client.html',
  'backend/src/utils/fixImageModel.js',
  'backend/src/utils/seed_image.js',
  'backend/public/index.html',
  'frontend/src/admin/analytics/page.jsx',
  'frontend/src/editor/help/page.jsx',
  'frontend/src/editor/media/page.jsx',
  'frontend/src/editor/overview/page.jsx',
  'frontend/src/components/test/SubscriptionLimitsTest.jsx',
  'frontend/src/components/common/TenantBranding.css',
  'frontend/src/components/common/TenantDashboard.css',
  'frontend/src/components/common/TenantSwitcher.css',
  'frontend/src/components/common/DashboardWidget.css',
  'frontend/src/components/common/TenantSelector.css',
  'admin-dashboard.html',
  'admin-panel.html',
  'debug-user.html',
  'test-analytics.html',
  '.env'
];

const directoriesToDelete = [
  'backend/backup',
  'backend/uploads/system/690061c2969a396e92040dac',
  'frontend/public/api-docs'
];

console.log('🧹 JCMS Project Cleanup Script\n');
console.log(DRY_RUN ? '🔍 DRY RUN MODE\n' : '⚠️  LIVE MODE\n');

let deletedCount = 0;
let skippedCount = 0;

console.log('📄 Cleaning files...\n');
filesToDelete.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  
  if (fs.existsSync(filePath)) {
    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would delete: ${file}`);
      deletedCount++;
    } else {
      try {
        fs.unlinkSync(filePath);
        console.log(`  ✅ Deleted: ${file}`);
        deletedCount++;
      } catch (err) {
        console.log(`  ❌ Failed: ${file}`);
      }
    }
  } else {
    skippedCount++;
  }
});

console.log('\n📁 Cleaning directories...\n');
directoriesToDelete.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  
  if (fs.existsSync(dirPath)) {
    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would delete: ${dir}`);
      deletedCount++;
    } else {
      try {
        fs.rmSync(dirPath, { recursive: true, force: true });
        console.log(`  ✅ Deleted: ${dir}`);
        deletedCount++;
      } catch (err) {
        console.log(`  ❌ Failed: ${dir}`);
      }
    }
  } else {
    skippedCount++;
  }
});

console.log(`\n✨ ${deletedCount} items ${DRY_RUN ? 'would be' : ''} deleted`);
console.log(`   ${skippedCount} items skipped\n`);

if (DRY_RUN) {
  console.log('💡 Run without --dry-run to delete files\n');
}
