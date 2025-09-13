// Quick API test
const axios = require('axios');

async function testAPI() {
  try {
    const response = await axios.get('http://localhost:5000/api/health');
    console.log('✅ API working:', response.data);
  } catch (error) {
    console.log('❌ API failed:', error.message);
  }
}

testAPI();