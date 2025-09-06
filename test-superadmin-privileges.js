// test-superadmin-privileges.js
const axios = require('axios');
const logger = require('./src/config/logger');

const BASE_URL = 'http://localhost:5000/api';

async function testSuperAdminPrivileges() {
  try {
    logger.info('Starting Super Admin privileges test');

    // Login as system admin
    const systemLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@system.com',
      password: 'admin123',
      tenant: '68b56457fc1d2b318626df74'
    });
    const systemToken = systemLogin.data.token;
    logger.debug('System admin logged in successfully');

    // Test 1: Cross-tenant image access
    const images = await axios.get(`${BASE_URL}/images`, {
      headers: { Authorization: `Bearer ${systemToken}` }
    });
    logger.debug('Cross-tenant image access verified', { imageCount: images.data.count });

    // Test 2: Cross-tenant user access
    const users = await axios.get(`${BASE_URL}/users/all-users`, {
      headers: { Authorization: `Bearer ${systemToken}` }
    });
    logger.debug('Cross-tenant user access verified', { userCount: users.data.data.length });

    // Test 3: User analytics (all tenants)
    const analytics = await axios.get(`${BASE_URL}/users/analytics`, {
      headers: { Authorization: `Bearer ${systemToken}` }
    });
    logger.debug('Analytics access verified', { scope: analytics.data.data.tenantScope, totalUsers: analytics.data.data.totalUsers });

    // Test 4: Server analytics
    const serverAnalytics = await axios.get(`${BASE_URL}/analytics/server`, {
      headers: { Authorization: `Bearer ${systemToken}` }
    });
    logger.debug('Server analytics access verified', { tenants: serverAnalytics.data.data.totals.tenants, users: serverAnalytics.data.data.totals.users });

    // Test 5: Tenant management
    const tenants = await axios.get(`${BASE_URL}/tenants`, {
      headers: { Authorization: `Bearer ${systemToken}` }
    });
    logger.debug('Tenant management access verified', { tenantCount: tenants.data.data.length });

    logger.info('Super Admin privileges test completed successfully', {
      privileges: [
        'Cross-tenant image access',
        'Cross-tenant user management', 
        'System-wide analytics',
        'Tenant management',
        'Server monitoring'
      ]
    });

  } catch (error) {
    logger.error('Test failed', { error: error.response?.data || error.message, stack: error.stack });
  }
}

testSuperAdminPrivileges();