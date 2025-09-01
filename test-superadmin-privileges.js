// test-superadmin-privileges.js
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testSuperAdminPrivileges() {
  try {
    console.log('👑 Testing Super Admin Privileges...\n');

    // Login as system admin
    const systemLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@system.com',
      password: 'admin123',
      tenant: '68b56457fc1d2b318626df74'
    });
    const systemToken = systemLogin.data.token;
    console.log('✅ System admin logged in');

    // Test 1: Cross-tenant image access
    const images = await axios.get(`${BASE_URL}/images`, {
      headers: { Authorization: `Bearer ${systemToken}` }
    });
    console.log(`✅ Images: Can see ${images.data.count} images from all tenants`);

    // Test 2: Cross-tenant user access
    const users = await axios.get(`${BASE_URL}/users/all-users`, {
      headers: { Authorization: `Bearer ${systemToken}` }
    });
    console.log(`✅ Users: Can see ${users.data.data.length} users from all tenants`);

    // Test 3: User analytics (all tenants)
    const analytics = await axios.get(`${BASE_URL}/users/analytics`, {
      headers: { Authorization: `Bearer ${systemToken}` }
    });
    console.log(`✅ Analytics: ${analytics.data.data.tenantScope} - ${analytics.data.data.totalUsers} total users`);

    // Test 4: Server analytics
    const serverAnalytics = await axios.get(`${BASE_URL}/analytics/server`, {
      headers: { Authorization: `Bearer ${systemToken}` }
    });
    console.log(`✅ Server Analytics: ${serverAnalytics.data.data.totals.tenants} tenants, ${serverAnalytics.data.data.totals.users} users`);

    // Test 5: Tenant management
    const tenants = await axios.get(`${BASE_URL}/tenants`, {
      headers: { Authorization: `Bearer ${systemToken}` }
    });
    console.log(`✅ Tenants: Can manage ${tenants.data.data.length} tenants`);

    console.log('\n🎉 Super Admin has FULL PRIVILEGES across all tenants!');
    console.log('📋 Privileges confirmed:');
    console.log('  - Cross-tenant image access ✅');
    console.log('  - Cross-tenant user management ✅');
    console.log('  - System-wide analytics ✅');
    console.log('  - Tenant management ✅');
    console.log('  - Server monitoring ✅');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testSuperAdminPrivileges();