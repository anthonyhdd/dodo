const axios = require('axios');
require('dotenv').config();

const SUNO_API_KEY = process.env.SUNO_API_KEY;
const BASE_URLS = [
  'https://api.sunoapi.org',
  'https://api.sunoapi.org/v1',
  'https://api.sunoapi.org/v2',
  'https://sunoapi.org/api',
  'https://sunoapi.org/api/v1',
];

const ENDPOINTS = [
  '/generate',
  '/api/generate',
  '/v1/generate',
  '/v2/generate',
  '/suno/generate',
  '/create',
  '/api/create',
  '/v1/create',
  '/songs',
  '/api/songs',
  '/v1/songs',
];

const VOICE_ID = 'oRfLTfDD1TbLrWuf61pJ';

console.log('🧪 Testing Suno API endpoints...');
console.log('🔑 SUNO_API_KEY:', SUNO_API_KEY ? '✅ Set' : '❌ Missing');
console.log('🎤 VOICE_ID:', VOICE_ID);

if (!SUNO_API_KEY) {
  console.error('❌ SUNO_API_KEY is not set');
  process.exit(1);
}

async function testEndpoint(baseUrl, endpoint) {
  const fullUrl = `${baseUrl}${endpoint}`;
  const payload = {
    prompt: 'A soft lullaby for a child',
    duration: 120,
    voice_id: VOICE_ID,
  };

  try {
    console.log(`\n🔄 Testing: ${fullUrl}`);
    const response = await axios.post(fullUrl, payload, {
      headers: {
        'Authorization': `Bearer ${SUNO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
    
    console.log(`✅ SUCCESS! Status: ${response.status}`);
    console.log(`✅ Response:`, JSON.stringify(response.data, null, 2));
    return { success: true, url: fullUrl, data: response.data };
  } catch (error) {
    const status = error.response?.status;
    const data = error.response?.data;
    if (status === 404) {
      // Skip 404s, they're expected for wrong endpoints
      return { success: false, url: fullUrl, status: 404 };
    }
    console.log(`   Status: ${status}`);
    console.log(`   Data:`, JSON.stringify(data, null, 2));
    // Non-404 errors might indicate the endpoint exists but params are wrong
    return { success: false, url: fullUrl, status, data };
  }
}

async function testAll() {
  const results = [];
  
  for (const baseUrl of BASE_URLS) {
    for (const endpoint of ENDPOINTS) {
      const result = await testEndpoint(baseUrl, endpoint);
      results.push(result);
      if (result.success) {
        console.log(`\n✅✅✅ FOUND WORKING ENDPOINT: ${result.url} ✅✅✅`);
        return result;
      }
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log(`\n❌ All endpoints failed. Summary:`);
  const byStatus = {};
  results.forEach(r => {
    const status = r.status || 'unknown';
    byStatus[status] = (byStatus[status] || 0) + 1;
  });
  console.log('Status codes:', JSON.stringify(byStatus, null, 2));
  
  // Show non-404 errors (they might be close)
  const interesting = results.filter(r => r.status && r.status !== 404);
  if (interesting.length > 0) {
    console.log(`\n⚠️ Non-404 responses (might be close):`);
    interesting.forEach(r => {
      console.log(`   ${r.url}: ${r.status}`);
      if (r.data) console.log(`      Data:`, JSON.stringify(r.data, null, 2));
    });
  }
}

testAll();

