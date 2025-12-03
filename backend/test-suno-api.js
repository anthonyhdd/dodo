const axios = require('axios');
require('dotenv').config();

const SUNO_API_KEY = process.env.SUNO_API_KEY;
const SUNO_API_URL = process.env.SUNO_API_URL || 'https://api.sunoapi.org';
const VOICE_ID = 'oRfLTfDD1TbLrWuf61pJ';

console.log('🧪 Testing Suno API...');
console.log('🔑 SUNO_API_KEY:', SUNO_API_KEY ? '✅ Set' : '❌ Missing');
console.log('🌐 SUNO_API_URL:', SUNO_API_URL);
console.log('🎤 VOICE_ID:', VOICE_ID);

if (!SUNO_API_KEY) {
  console.error('❌ SUNO_API_KEY is not set in .env');
  process.exit(1);
}

// Test different endpoints and formats
const testConfigs = [
  {
    name: 'Test 1: /generate with voice_id',
    endpoint: '/generate',
    payload: {
      prompt: 'A soft lullaby for a child',
      duration: 120,
      voice_id: VOICE_ID,
      model: 'v4_5',
      make_instrumental: false,
    },
  },
  {
    name: 'Test 2: /generate with voiceId (camelCase)',
    endpoint: '/generate',
    payload: {
      prompt: 'A soft lullaby for a child',
      duration: 120,
      voiceId: VOICE_ID,
      model: 'v4_5',
      make_instrumental: false,
    },
  },
  {
    name: 'Test 3: /generate with custom_mode',
    endpoint: '/generate',
    payload: {
      custom_mode: true,
      prompt: 'A soft lullaby for a child',
      duration: 120,
      voice_id: VOICE_ID,
    },
  },
  {
    name: 'Test 4: /suno/create',
    endpoint: '/suno/create',
    payload: {
      prompt: 'A soft lullaby for a child',
      duration: 120,
      voice_id: VOICE_ID,
    },
  },
  {
    name: 'Test 5: /create',
    endpoint: '/create',
    payload: {
      prompt: 'A soft lullaby for a child',
      duration: 120,
      voice_id: VOICE_ID,
    },
  },
  {
    name: 'Test 6: /songs (POST)',
    endpoint: '/songs',
    payload: {
      prompt: 'A soft lullaby for a child',
      duration: 120,
      voice_id: VOICE_ID,
    },
  },
];

async function testSunoAPI() {
  for (const config of testConfigs) {
    try {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🧪 ${config.name}`);
      console.log(`📤 Endpoint: ${SUNO_API_URL}${config.endpoint}`);
      console.log(`📤 Payload:`, JSON.stringify(config.payload, null, 2));
      
      const response = await axios.post(
        `${SUNO_API_URL}${config.endpoint}`,
        config.payload,
        {
          headers: {
            'Authorization': `Bearer ${SUNO_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );
      
      console.log(`✅ Success! Status: ${response.status}`);
      console.log(`✅ Response:`, JSON.stringify(response.data, null, 2));
      
      // If we got a song ID, test status check
      const songId = response.data.id || response.data.data?.id || response.data.song_id;
      if (songId) {
        console.log(`\n🔄 Testing status check for song: ${songId}`);
        try {
          const statusResponse = await axios.get(
            `${SUNO_API_URL}/get/${songId}`,
            {
              headers: {
                'Authorization': `Bearer ${SUNO_API_KEY}`,
              },
            }
          );
          console.log(`✅ Status check response:`, JSON.stringify(statusResponse.data, null, 2));
        } catch (statusError) {
          console.error(`❌ Status check failed:`, statusError.response?.data || statusError.message);
        }
      }
      
      // If one works, we're done
      console.log(`\n✅ Found working configuration!`);
      process.exit(0);
      
    } catch (error) {
      console.error(`❌ Failed:`);
      console.error(`   Status: ${error.response?.status}`);
      console.error(`   Status Text: ${error.response?.statusText}`);
      console.error(`   Response Data:`, JSON.stringify(error.response?.data, null, 2));
      console.error(`   Error Message: ${error.message}`);
      console.error(`   Error Code: ${error.code}`);
      // Continue to next test
    }
  }
  
  console.log(`\n❌ All tests failed. Check the errors above.`);
  process.exit(1);
}

testSunoAPI();

