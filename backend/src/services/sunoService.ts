import axios from 'axios';

const SUNO_API_KEY = process.env.SUNO_API_KEY;
const SUNO_API_URL = 'https://api.suno.ai/v1'; // Adjust based on actual Suno API endpoint

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
    // Note: Adjust this based on actual Suno API structure
    // This is a placeholder implementation
    const fullPrompt = `A ${style} lullaby: ${prompt}`;
    
    const response = await axios.post(
      `${SUNO_API_URL}/generate`,
      {
        prompt: fullPrompt,
        duration: durationSeconds,
        ...(voiceId && { voice_id: voiceId }),
      },
      {
        headers: {
          'Authorization': `Bearer ${SUNO_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      id: response.data.id,
      title: response.data.title || 'Lullaby',
      status: 'generating',
    };
  } catch (error: any) {
    console.error('Suno generation error:', error.response?.data || error.message);
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
    const response = await axios.get(
      `${SUNO_API_URL}/songs/${songId}`,
      {
        headers: {
          'Authorization': `Bearer ${SUNO_API_KEY}`,
        },
      }
    );

    return {
      id: response.data.id,
      title: response.data.title || 'Lullaby',
      audio_url: response.data.audio_url,
      status: response.data.status || 'generating',
    };
  } catch (error: any) {
    console.error('Suno status check error:', error.response?.data || error.message);
    throw new Error(`Failed to check song status: ${error.response?.data?.message || error.message}`);
  }
}

