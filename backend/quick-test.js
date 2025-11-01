// Quick API Test Script
// Run: node quick-test.js

const API_BASE = 'http://localhost:5000';
let token = '';
let imageId = '';

// Helper function
async function apiCall(method, endpoint, body = null, isFormData = false) {
  const headers = { 'Authorization': `Bearer ${token}` };
  if (!isFormData) headers['Content-Type'] = 'application/json';
  
  const options = { method, headers };
  if (body && !isFormData) options.body = JSON.stringify(body);
  if (body && isFormData) options.body = body;
  
  const response = await fetch(`${API_BASE}${endpoint}`, options);
  return response.json();
}

// Test functions
async function test1_Login() {
  console.log('\n🔐 TEST 1: Login');
  const result = await apiCall('POST', '/api/auth/login', {
    username: 'superadmin',
    password: 'admin123',
    rememberMe: true
  });
  
  if (result.success) {
    token = result.token;
    console.log('✅ Login successful');
    console.log(`   User: ${result.user.username}`);
    console.log(`   Role: ${result.user.role}`);
  } else {
    console.log('❌ Login failed:', result.message);
  }
}

async function test2_GetPlans() {
  console.log('\n💳 TEST 2: Get Subscription Plans');
  const result = await fetch(`${API_BASE}/api/subscriptions/plans`).then(r => r.json());
  
  if (Array.isArray(result)) {
    console.log('✅ Plans retrieved');
    result.forEach(plan => {
      console.log(`   ${plan.displayName}: $${(plan.priceCents/100).toFixed(2)}`);
    });
  } else {
    console.log('❌ Failed to get plans');
  }
}

async function test3_GetSubscriptionStatus() {
  console.log('\n📊 TEST 3: Get Subscription Status');
  const result = await apiCall('GET', '/api/subscriptions/status');
  
  console.log('✅ Status retrieved');
  console.log(`   Plan: ${result.plan}`);
  console.log(`   Active: ${result.active}`);
}

async function test4_CreateSubscription() {
  console.log('\n💰 TEST 4: Create Subscription');
  const result = await apiCall('POST', '/api/subscriptions', { plan: 'standard' });
  
  if (result.success) {
    console.log('✅ Subscription created');
    console.log(`   Plan: ${result.data.plan}`);
    console.log(`   Status: ${result.data.status}`);
  } else {
    console.log('❌ Failed:', result.message);
  }
}

async function test5_VerifyPayment() {
  console.log('\n✔️  TEST 5: Verify Payment');
  const result = await apiCall('POST', '/api/subscriptions/verify', {
    paymentReference: `mock_${Date.now()}`
  });
  
  if (result.success) {
    console.log('✅ Payment verified');
  } else {
    console.log('❌ Failed:', result.message);
  }
}

async function test6_GetPaymentHistory() {
  console.log('\n📜 TEST 6: Get Payment History');
  const result = await apiCall('GET', '/api/subscriptions/history');
  
  if (result.success) {
    console.log(`✅ Found ${result.data.length} invoices`);
    result.data.slice(0, 3).forEach(inv => {
      console.log(`   ${inv.invoiceNumber}: $${(inv.amount/100).toFixed(2)} - ${inv.status}`);
    });
  } else {
    console.log('❌ Failed:', result.message);
  }
}

async function test7_CreateContent() {
  console.log('\n📝 TEST 7: Create Content');
  const result = await apiCall('POST', '/api/content', {
    title: 'Test Article',
    content: '<p>This is test content</p>',
    status: 'draft',
    type: 'article',
    tags: ['test']
  });
  
  if (result.success) {
    console.log('✅ Content created');
    console.log(`   Title: ${result.data.title}`);
    console.log(`   Status: ${result.data.status}`);
  } else {
    console.log('❌ Failed:', result.message);
  }
}

async function test8_GetAllContent() {
  console.log('\n📚 TEST 8: Get All Content');
  const result = await apiCall('GET', '/api/content');
  
  if (result.success) {
    console.log(`✅ Found ${result.data.length} content items`);
  } else {
    console.log('❌ Failed:', result.message);
  }
}

async function test9_GetUsers() {
  console.log('\n👥 TEST 9: Get All Users');
  const result = await apiCall('GET', '/api/users');
  
  if (result.success) {
    console.log(`✅ Found ${result.data.length} users`);
    result.data.slice(0, 3).forEach(user => {
      console.log(`   ${user.username} (${user.role})`);
    });
  } else {
    console.log('❌ Failed:', result.message);
  }
}

async function test10_GetAnalytics() {
  console.log('\n📊 TEST 10: Get Analytics');
  const result = await apiCall('GET', '/api/analytics/dashboard');
  
  if (result.success) {
    console.log('✅ Analytics retrieved');
    console.log(`   Total Users: ${result.data?.totalUsers || 'N/A'}`);
    console.log(`   Total Content: ${result.data?.totalContent || 'N/A'}`);
  } else {
    console.log('❌ Failed:', result.message);
  }
}

async function test11_CancelSubscription() {
  console.log('\n🚫 TEST 11: Cancel Subscription');
  const result = await apiCall('POST', '/api/subscriptions/cancel');
  
  if (result.success) {
    console.log('✅ Subscription canceled');
  } else {
    console.log('ℹ️  Info:', result.message);
  }
}

async function test12_HealthCheck() {
  console.log('\n🏥 TEST 12: Health Check');
  const result = await fetch(`${API_BASE}/api/health`).then(r => r.json());
  
  console.log('✅ Server is running');
  console.log(`   Port: ${result.port}`);
  console.log(`   Time: ${new Date(result.timestamp).toLocaleString()}`);
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting JCMS API Tests...');
  console.log('================================');
  
  try {
    await test1_Login();
    await test2_GetPlans();
    await test3_GetSubscriptionStatus();
    await test4_CreateSubscription();
    await test5_VerifyPayment();
    await test6_GetPaymentHistory();
    await test7_CreateContent();
    await test8_GetAllContent();
    await test9_GetUsers();
    await test10_GetAnalytics();
    await test11_CancelSubscription();
    await test12_HealthCheck();
    
    console.log('\n================================');
    console.log('✅ All tests completed!');
  } catch (error) {
    console.log('\n❌ Test failed:', error.message);
  }
}

// Run tests
runAllTests();
