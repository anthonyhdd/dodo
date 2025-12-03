const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';
const TEST_MP3_URL = 'https://ogorrfojgoceivyyraez.supabase.co/storage/v1/object/public/dodo-audio/lullabies/21ff668b-6ed1-48c4-912f-ef1139ae046b.mp3';

async function testVoiceClone() {
  console.log('🧪 Testing voice cloning...');
  console.log('🔑 ELEVENLABS_API_KEY:', ELEVENLABS_API_KEY ? '✅ Set' : '❌ Missing');
  
  if (!ELEVENLABS_API_KEY) {
    console.error('❌ ELEVENLABS_API_KEY is not set in .env');
    process.exit(1);
  }

  try {
    // Step 1: Download MP3
    console.log('\n📥 Step 1: Downloading MP3 from Supabase...');
    console.log('URL:', TEST_MP3_URL);
    
    const response = await axios.get(TEST_MP3_URL, {
      responseType: 'arraybuffer',
      timeout: 30000,
    });
    
    const fileBuffer = Buffer.from(response.data);
    console.log('✅ Downloaded, size:', fileBuffer.length, 'bytes');
    
    // Step 2: Save to temp file
    const tempPath = path.join(__dirname, 'temp-test-voice.mp3');
    fs.writeFileSync(tempPath, fileBuffer);
    console.log('✅ Saved to:', tempPath);
    
    // Step 3: Clone on ElevenLabs
    console.log('\n🎤 Step 2: Cloning voice on ElevenLabs...');
    
    const formData = new FormData();
    formData.append('name', `DODO Test Voice ${Date.now()}`);
    formData.append('files', fs.createReadStream(tempPath), {
      filename: 'voice-sample.mp3',
      contentType: 'audio/mpeg',
    });
    
    console.log('📤 Sending request to ElevenLabs...');
    const cloneResponse = await axios.post(
      `${ELEVENLABS_API_URL}/voices/add`,
      formData,
      {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          ...formData.getHeaders(),
        },
        timeout: 120000,
      }
    );
    
    console.log('✅ Voice cloned successfully!');
    console.log('Voice ID:', cloneResponse.data.voice_id);
    
    // Cleanup
    fs.unlinkSync(tempPath);
    console.log('🧹 Cleaned up temp file');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

testVoiceClone();

