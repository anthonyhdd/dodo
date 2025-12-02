import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
}

/**
 * Clone a voice from audio samples
 * @param audioFiles Array of file paths or URLs to audio files
 * @param voiceName Name for the cloned voice
 * @returns The cloned voice ID
 */
export async function cloneVoiceFromSamples(
  audioFiles: string[],
  voiceName: string = 'DODO Voice'
): Promise<string> {
  if (!ELEVENLABS_API_KEY) {
    console.warn('⚠️ ELEVENLABS_API_KEY is not set, skipping voice cloning');
    throw new Error('ELEVENLABS_API_KEY is not set');
  }

  try {
    console.log('🎤 Preparing to clone voice with', audioFiles.length, 'audio files');
    
    // Step 1: Add the voice
    const formData = new FormData();
    formData.append('name', voiceName);
    
    // Add audio files
    for (const audioFile of audioFiles) {
      // If it's a URL, download it first
      let fileBuffer: Buffer;
      if (audioFile.startsWith('http://') || audioFile.startsWith('https://')) {
        console.log('📥 Downloading audio from URL:', audioFile);
        const response = await axios.get(audioFile, { 
          responseType: 'arraybuffer',
          timeout: 30000, // 30 second timeout
        });
        fileBuffer = Buffer.from(response.data);
      } else if (fs.existsSync(audioFile)) {
        console.log('📁 Reading audio file from disk:', audioFile);
        fileBuffer = fs.readFileSync(audioFile);
      } else {
        throw new Error(`Audio file not found: ${audioFile}`);
      }
      
      formData.append('files', fileBuffer, {
        filename: `sample-${Date.now()}-${Math.random().toString(36).slice(2)}.m4a`,
        contentType: 'audio/m4a',
      });
    }

    console.log('📤 Sending voice cloning request to ElevenLabs...');
    const response = await axios.post(
      `${ELEVENLABS_API_URL}/voices/add`,
      formData,
      {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          ...formData.getHeaders(),
        },
        timeout: 120000, // 2 minute timeout for voice cloning
      }
    );

    console.log('✅ ElevenLabs voice cloned successfully');
    return response.data.voice_id;
  } catch (error: any) {
    console.error('❌ ElevenLabs voice cloning error:', error.message);
    if (error.response) {
      console.error('❌ ElevenLabs response status:', error.response.status);
      console.error('❌ ElevenLabs response data:', JSON.stringify(error.response.data, null, 2));
    }
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.message.includes('fetch failed')) {
      throw new Error(`Network error connecting to ElevenLabs: ${error.message}`);
    }
    throw new Error(`Failed to clone voice: ${error.response?.data?.detail?.message || error.message}`);
  }
}

/**
 * Generate speech using a cloned voice
 * @param voiceId The cloned voice ID
 * @param text Text to convert to speech
 * @returns Audio buffer
 */
export async function generateSpeech(
  voiceId: string,
  text: string
): Promise<Buffer> {
  if (!ELEVENLABS_API_KEY) {
    throw new Error('ELEVENLABS_API_KEY is not set');
  }

  try {
    const response = await axios.post(
      `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
      {
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      },
      {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
      }
    );

    return Buffer.from(response.data);
  } catch (error: any) {
    console.error('ElevenLabs TTS error:', error.response?.data || error.message);
    throw new Error(`Failed to generate speech: ${error.response?.data?.detail?.message || error.message}`);
  }
}

