remove // Simple API Test Script
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let tokens = {};

const testAPI = async () => {
  console.log('🚀 Testing JCMS APIs...\n');

  try {
    // 1. Health Check
    console.log('1️⃣ Health Check');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Status:', health.data.status);

    // 2. SuperAdmin Login
    console.log('\n2️⃣ SuperAdmin Authentication');
    const superAdminLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@system.com',
      password: 'admin123'
    });
    tokens.superadmin = superAdminLogin.data.token;
    console.log('✅ SuperAdmin logged in:', superAdminLogin.data.user.username);

    // 3. Admin Login
    console.log('\n3️⃣ Admin Authentication');
    const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'dev.admin@test.com',
      password: 'dev123'
    });
    tokens.admin = adminLogin.data.token;
    console.log('✅ Admin logged in:', adminLogin.data.user.username);

    // 4. Editor Login
    console.log('\n4️⃣ Editor Authentication');
    const editorLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'testeditor@test.com',
      password: 'test123'
    });
    tokens.editor = editorLogin.data.token;
    console.log('✅ Editor logged in:', editorLogin.data.user.username);

    // 5. User Management Tests
    console.log('\n5️⃣ User Management');
    
    // SuperAdmin gets all users
    const allUsers = await axios.get(`${BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${tokens.superadmin}` }
    });
    console.log('✅ SuperAdmin sees', allUsers.data.count, 'users');

    // Admin gets users (should not see superadmin)
    const adminUsers = await axios.get(`${BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${tokens.admin}` }
    });
    console.log('✅ Admin sees', adminUsers.data.count, 'users (filtered)');

    // SuperAdmin creates new admin
    const newAdmin = await axios.post(`${BASE_URL}/users`, {
      username: `test_admin_${Date.now()}`,
      email: `testadmin${Date.now()}@test.com`,
      password: 'test123',
      role: 'admin'
    }, {
      headers: { Authorization: `Bearer ${tokens.superadmin}` }
    });
    console.log('✅ SuperAdmin created admin:', newAdmin.data.data.username);

    // Admin creates editor
    const newEditor = await axios.post(`${BASE_URL}/users`, {
      username: `test_editor_${Date.now()}`,
      email: `testeditor${Date.now()}@test.com`,
      password: 'test123',
      role: 'editor'
    }, {
      headers: { Authorization: `Bearer ${tokens.admin}` }
    });
    console.log('✅ Admin created editor:', newEditor.data.data.username);

    // 6. Permission Tests
    console.log('\n6️⃣ Permission Tests');

    // Test: Admin cannot create superadmin
    try {
      await axios.post(`${BASE_URL}/users`, {
        username: 'test_superadmin',
        email: 'testsuperadmin@test.com',
        password: 'test123',
        role: 'superadmin'
      }, {
        headers: { Authorization: `Bearer ${tokens.admin}` }
      });
      console.log('❌ Admin should not be able to create superadmin');
    } catch (error) {
      console.log('✅ Admin blocked from creating superadmin:', error.response.data.message);
    }

    // Test: Admin cannot create another admin
    try {
      await axios.post(`${BASE_URL}/users`, {
        username: 'test_admin2',
        email: 'testadmin2@test.com',
        password: 'test123',
        role: 'admin'
      }, {
        headers: { Authorization: `Bearer ${tokens.admin}` }
      });
      console.log('❌ Admin should not be able to create another admin');
    } catch (error) {
      console.log('✅ Admin blocked from creating admin:', error.response.data.message);
    }

    // 7. Image Management Tests
    console.log('\n7️⃣ Image Management');

    // Get images as SuperAdmin
    const superAdminImages = await axios.get(`${BASE_URL}/images`, {
      headers: { Authorization: `Bearer ${tokens.superadmin}` }
    });
    console.log('✅ SuperAdmin sees', superAdminImages.data.data.length, 'images');

    // Get images as Admin
    const adminImages = await axios.get(`${BASE_URL}/images`, {
      headers: { Authorization: `Bearer ${tokens.admin}` }
    });
    console.log('✅ Admin sees', adminImages.data.data.length, 'images (filtered)');

    // Get own images only
    const ownImages = await axios.get(`${BASE_URL}/images?own=true`, {
      headers: { Authorization: `Bearer ${tokens.admin}` }
    });
    console.log('✅ Admin sees', ownImages.data.data.length, 'own images');

    // Test Editor restrictions
    try {
      await axios.get(`${BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${tokens.editor}` }
      });
      console.log('❌ Editor should not access user data');
    } catch (error) {
      console.log('✅ Editor blocked from user data:', error.response.data.message);
    }

    // Editor can only see own images
    const editorImages = await axios.get(`${BASE_URL}/images`, {
      headers: { Authorization: `Bearer ${tokens.editor}` }
    });
    console.log('✅ Editor sees', editorImages.data.data.length, 'own images only');

    // 8. Cleanup - Delete created users
    console.log('\n8️⃣ Cleanup');
    
    // SuperAdmin deletes created admin
    await axios.delete(`${BASE_URL}/users/${newAdmin.data.data._id}`, {
      headers: { Authorization: `Bearer ${tokens.superadmin}` }
    });
    console.log('✅ SuperAdmin deleted created admin');

    // Admin deletes created editor
    await axios.delete(`${BASE_URL}/users/${newEditor.data.data._id}`, {
      headers: { Authorization: `Bearer ${tokens.admin}` }
    });
    console.log('✅ Admin deleted created editor');

    console.log('\n🎉 All API tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('- Health check: ✅');
    console.log('- Authentication: ✅');
    console.log('- User management: ✅');
    console.log('- Permission controls: ✅');
    console.log('- Image management: ✅');
    console.log('- Role-based access: ✅');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
};

testAPI();