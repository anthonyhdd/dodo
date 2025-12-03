import axios from 'axios';

const SUNO_API_KEY = process.env.SUNO_API_KEY;
// Suno API endpoint - Official API from docs.sunoapi.org
// Base URL: https://api.sunoapi.org
const SUNO_API_URL = process.env.SUNO_API_URL || 'https://api.sunoapi.org';

export interface SunoSong {
  id: string;
  title: string;
  audio_url?: string;
  status: 'generating' | 'complete' | 'failed';
}

/**
 * Generate a lullaby using Suno API
 * @param prompt Text prompt describing the lullaby
 * @param style Style of the lullaby
 * @param durationSeconds Duration in seconds
 * @param voiceId Optional voice ID if using custom voice
 * @returns Song ID and status
 */
export async function generateLullaby(
  prompt: string,
  style: string,
  durationSeconds: number,
  voiceId?: string
): Promise<SunoSong> {
  if (!SUNO_API_KEY) {
    throw new Error('SUNO_API_KEY is not set');
  }

  try {
    // Suno API structure based on official documentation
    // The API expects: custom_mode, gpt_description_prompt, make_instrumental, mv
    const fullPrompt = `A ${style} lullaby: ${prompt}`;
    
    // Based on docs.sunoapi.org - try the generate endpoint
    // The API structure may require different parameters
    console.log(`🔄 Calling Suno API: ${SUNO_API_URL}/generate`);
    console.log(`📤 Request payload:`, {
      prompt: fullPrompt,
      duration: durationSeconds,
      ...(voiceId && { voice_id: voiceId }),
    });
    
    const response = await axios.post(
      `${SUNO_API_URL}/generate`,
      {
        prompt: fullPrompt,
        duration: durationSeconds,
        // Try different parameter names based on API docs
        ...(voiceId && { voice_id: voiceId }),
        // Alternative parameter names to try
        model: 'v4_5', // or v5, v4_5plus, etc.
        make_instrumental: false,
      },
      {
        headers: {
          'Authorization': `Bearer ${SUNO_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log(`✅ Suno API response:`, JSON.stringify(response.data, null, 2));
    
    // Extract song ID from response (structure may vary)
    const songId = response.data.id || response.data.data?.id || response.data.song_id || response.data.task_id;
    const title = response.data.title || response.data.data?.title || 'Lullaby';

    if (!songId) {
      throw new Error('No song ID returned from Suno API');
    }

    return {
      id: songId,
      title,
      status: 'generating',
    };
  } catch (error: any) {
    console.error('❌ Suno generation error - Full details:');
    console.error('   Status:', error.response?.status);
    console.error('   Status Text:', error.response?.statusText);
    console.error('   URL:', error.config?.url);
    console.error('   Method:', error.config?.method);
    console.error('   Response Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('   Error Message:', error.message);
    throw new Error(`Failed to generate lullaby: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Check the status of a Suno song generation
 * @param songId The song ID
 * @returns Updated song with audio URL if ready
 */
export async function getSunoSongStatus(songId: string): Promise<SunoSong> {
  if (!SUNO_API_KEY) {
    throw new Error('SUNO_API_KEY is not set');
  }

  try {
    // Check song status - based on docs.sunoapi.org
    console.log(`🔄 Checking Suno song status: ${songId}`);
    const response = await axios.get(
      `${SUNO_API_URL}/get/${songId}`,
      {
        headers: {
          'Authorization': `Bearer ${SUNO_API_KEY}`,
        },
      }
    );
    
    console.log(`✅ Suno status response:`, JSON.stringify(response.data, null, 2));

    // Extract data from response (structure may vary)
    const data = response.data.data || response.data;
    const audioUrl = data.audio_url || data.audioUrl || data.url;
    const status = data.status === 'complete' || data.status === 'finished' ? 'complete' : 
                   data.status === 'failed' ? 'failed' : 'generating';

    return {
      id: data.id || songId,
      title: data.title || 'Lullaby',
      audio_url: audioUrl,
      status,
    };
  } catch (error: any) {
    console.error('Suno status check error:', error.response?.data || error.message);
    throw new Error(`Failed to check song status: ${error.response?.data?.message || error.message}`);
  }
}

