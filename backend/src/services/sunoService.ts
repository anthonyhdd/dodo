import axios from 'axios';

const SUNO_API_KEY = process.env.SUNO_API_KEY;
// Suno API endpoint - Official API from docs.sunoapi.org
// Base URL: https://api.sunoapi.org
// Correct endpoint: /api/v1/generate
const SUNO_API_URL = process.env.SUNO_API_URL || 'https://api.sunoapi.org';

export interface SunoSong {
  id: string;
  title: string;
  audio_url?: string;
  status: 'generating' | 'complete' | 'failed';
}

/**
 * Create a Suno Persona from a generated music track
 * According to docs: https://docs.sunoapi.org/suno-api/generate-persona
 * This requires a taskId and audioId from a completed Suno music generation
 * @param taskId Task ID from a completed music generation
 * @param audioId Audio ID from the generated music
 * @param personaName Name for the persona
 * @param description Description of the persona's musical characteristics
 * @returns Persona ID
 */
export async function createSunoPersonaFromMusic(
  taskId: string,
  audioId: string,
  personaName: string = 'DODO Persona',
  description: string = 'A soft and gentle voice for lullabies'
): Promise<string> {
  if (!SUNO_API_KEY) {
    throw new Error('SUNO_API_KEY is not set');
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log(`🎭 [SUNO] Creating persona from generated music`);
  console.log(`   Task ID: ${taskId}`);
  console.log(`   Audio ID: ${audioId}`);
  console.log(`   Persona Name: ${personaName}`);

  try {
    // According to docs: https://docs.sunoapi.org/suno-api/generate-persona
    // Endpoint: POST /api/v1/generate/generate-persona
    const payload = {
      taskId,
      audioId,
      name: personaName,
      description,
    };

    console.log(`🔄 [SUNO] Calling: ${SUNO_API_URL}/api/v1/generate/generate-persona`);
    console.log(`📤 [SUNO] Request payload:`, JSON.stringify(payload, null, 2));

    const response = await axios.post(
      `${SUNO_API_URL}/api/v1/generate/generate-persona`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${SUNO_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    console.log(`✅ [SUNO] Persona created! Response:`, JSON.stringify(response.data, null, 2));

    if (response.data.code !== 200) {
      throw new Error(`Suno API returned code ${response.data.code}: ${response.data.msg || 'Unknown error'}`);
    }

    const personaId = response.data.data?.personaId;
    if (!personaId) {
      throw new Error('No personaId returned from Suno API');
    }

    console.log(`✅ [SUNO] Persona ID: ${personaId}`);
    console.log(`${'='.repeat(80)}\n`);

    return personaId;
  } catch (error: any) {
    console.error(`\n${'='.repeat(80)}`);
    console.error(`❌ [SUNO] Persona creation error:`);
    console.error(`   Status: ${error.response?.status}`);
    console.error(`   Data:`, JSON.stringify(error.response?.data, null, 2));
    console.error(`   Message: ${error.message}`);
    console.error(`${'='.repeat(80)}\n`);
    throw new Error(`Failed to create Suno persona: ${error.response?.data?.msg || error.message}`);
  }
}

/**
 * Generate a lullaby using Suno API
 * Based on official documentation: https://docs.sunoapi.org/suno-api/generate-music
 * 
 * @param prompt Text prompt describing the lullaby (used as lyrics in custom mode)
 * @param style Style of the lullaby
 * @param durationSeconds Duration in seconds (not directly supported, use model limits)
 * @param personaId Optional persona ID for custom voice (replaces voice_id)
 * @returns Song ID and status
 */
export async function generateLullaby(
  prompt: string,
  style: string,
  durationSeconds: number,
  personaId?: string
): Promise<SunoSong> {
  if (!SUNO_API_KEY) {
    throw new Error('SUNO_API_KEY is not set');
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log(`🎵 [SUNO] Starting lullaby generation`);
  console.log(`   Prompt: ${prompt}`);
  console.log(`   Style: ${style}`);
  console.log(`   Duration: ${durationSeconds}s`);
  console.log(`   Persona ID: ${personaId || 'none (will use default voice)'}`);
  console.log(`   API URL: ${SUNO_API_URL}`);
  console.log(`   API Key: ${SUNO_API_KEY ? '✅ Set' : '❌ Missing'}`);

  try {
    // According to official docs: https://docs.sunoapi.org/suno-api/generate-music
    // Endpoint: POST /api/v1/generate
    // Required params for Custom Mode:
    //   - customMode: true
    //   - instrumental: false (we want vocals)
    //   - model: V4, V4_5, V4_5PLUS, V4_5ALL, or V5
    //   - callBackUrl: required (but we'll poll instead)
    //   - prompt: required (used as lyrics)
    //   - style: required
    //   - title: required
    
    const fullPrompt = prompt.length > 5000 ? prompt.substring(0, 5000) : prompt;
    const fullStyle = style.length > 1000 ? style.substring(0, 1000) : style;
    const title = `Lullaby - ${style}`.substring(0, 100);
    
    // Use Custom Mode to have control over lyrics and style
    const payload = {
      customMode: true,
      instrumental: false, // We want vocals (the prompt will be used as lyrics)
      model: 'V4_5ALL', // Better song structure, max 8 min
      callBackUrl: 'https://api.example.com/callback', // Required but we'll poll instead
      prompt: fullPrompt,
      style: fullStyle,
      title: title,
      ...(personaId && { personaId: personaId }), // Use personaId for custom voice
    };

    console.log(`\n🔄 [SUNO] Calling: ${SUNO_API_URL}/api/v1/generate`);
    console.log(`📤 [SUNO] Request payload:`, JSON.stringify(payload, null, 2));
    console.log(`📤 [SUNO] Headers:`, {
      'Authorization': `Bearer ${SUNO_API_KEY.substring(0, 10)}...`,
      'Content-Type': 'application/json',
    });
    
    const response = await axios.post(
      `${SUNO_API_URL}/api/v1/generate`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${SUNO_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );
    
    console.log(`✅ [SUNO] Response status: ${response.status}`);
    console.log(`✅ [SUNO] Response headers:`, JSON.stringify(response.headers, null, 2));
    console.log(`✅ [SUNO] Response data:`, JSON.stringify(response.data, null, 2));
    
    // According to docs, response format is:
    // {
    //   "code": 200,
    //   "msg": "success",
    //   "data": {
    //     "taskId": "5c79****be8e"
    //   }
    // }
    
    if (response.data.code !== 200) {
      throw new Error(`Suno API returned code ${response.data.code}: ${response.data.msg || 'Unknown error'}`);
    }
    
    const taskId = response.data.data?.taskId;
    if (!taskId) {
      console.error(`❌ [SUNO] No taskId in response. Full response:`, JSON.stringify(response.data, null, 2));
      throw new Error('No taskId returned from Suno API');
    }

    console.log(`✅ [SUNO] Task ID extracted: ${taskId}`);
    console.log(`${'='.repeat(80)}\n`);

    return {
      id: taskId,
      title: title,
      status: 'generating',
    };
  } catch (error: any) {
    console.error(`\n${'='.repeat(80)}`);
    console.error(`❌ [SUNO] Generation error - Full details:`);
    console.error(`   Status: ${error.response?.status}`);
    console.error(`   Status Text: ${error.response?.statusText}`);
    console.error(`   URL: ${error.config?.url}`);
    console.error(`   Method: ${error.config?.method}`);
    console.error(`   Request Payload:`, JSON.stringify(error.config?.data, null, 2));
    console.error(`   Response Data:`, JSON.stringify(error.response?.data, null, 2));
    console.error(`   Response Headers:`, JSON.stringify(error.response?.headers, null, 2));
    console.error(`   Error Message: ${error.message}`);
    console.error(`   Error Code: ${error.code}`);
    console.error(`   Stack: ${error.stack}`);
    console.error(`${'='.repeat(80)}\n`);
    
    // Build a more detailed error message
    let errorMessage = 'Failed to generate lullaby';
    if (error.response?.data) {
      const data = error.response.data;
      // Suno API returns { code, msg, data } format
      if (data.code && data.msg) {
        errorMessage = `[${data.code}] ${data.msg}`;
      } else {
        errorMessage = data.message || 
                      data.error || 
                      data.detail || 
                      data.detail?.message ||
                      data.error?.message ||
                      (typeof data === 'string' ? data : errorMessage);
      }
      
      // If we have a status code, include it
      if (error.response.status) {
        errorMessage = `[HTTP ${error.response.status}] ${errorMessage}`;
      }
      
      // If still no message, use the raw data
      if (errorMessage === 'Failed to generate lullaby' && data) {
        errorMessage = `Failed to generate lullaby: ${JSON.stringify(data)}`;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    // If still no message, provide a default with status
    if (errorMessage === 'Failed to generate lullaby' && error.response?.status) {
      errorMessage = `Failed to generate lullaby: HTTP ${error.response.status}`;
    }
    
    throw new Error(errorMessage);
  }
}

/**
 * Check the status of a Suno song generation
 * Based on official documentation: https://docs.sunoapi.org/suno-api/generate-music
 * 
 * @param songId The task ID from generate endpoint
 * @returns Updated song with audio URL if ready
 */
export async function getSunoSongStatus(songId: string): Promise<SunoSong> {
  if (!SUNO_API_KEY) {
    throw new Error('SUNO_API_KEY is not set');
  }

  // Try multiple possible status endpoints
  const statusEndpoints = [
    `/api/v1/get/${songId}`,
    `/api/v1/task/${songId}`,
    `/api/v1/status/${songId}`,
    `/api/v1/music/${songId}`,
    `/get/${songId}`,
  ];
  
  let lastError: any = null;
  
  for (const endpoint of statusEndpoints) {
    try {
      console.log(`🔄 [SUNO] Checking song status: ${songId}`);
      console.log(`🔄 [SUNO] Trying: ${SUNO_API_URL}${endpoint}`);
      
      const response = await axios.get(
        `${SUNO_API_URL}${endpoint}`,
        {
          headers: {
            'Authorization': `Bearer ${SUNO_API_KEY}`,
          },
          timeout: 10000,
        }
      );
      
      console.log(`✅ [SUNO] Status check success!`);
      console.log(`✅ [SUNO] Response:`, JSON.stringify(response.data, null, 2));
      
      // Process the response
      if (response.data.code !== undefined && response.data.code !== 200) {
        throw new Error(`Suno API returned code ${response.data.code}: ${response.data.msg || 'Unknown error'}`);
      }
      
      const data = response.data.data || response.data;
      const audioUrl = data.audioUrl || data.audio_url || data.url || data.streamUrl;
      const status = data.status === 'complete' || data.status === 'finished' ? 'complete' : 
                     data.status === 'failed' ? 'failed' : 'generating';

      return {
        id: data.taskId || songId,
        title: data.title || 'Lullaby',
        audio_url: audioUrl,
        status,
      };
    } catch (error: any) {
      lastError = error;
      if (error.response?.status === 404) {
        // Try next endpoint
        console.log(`   ❌ 404 - trying next endpoint...`);
        continue;
      }
      // If it's not 404, log and rethrow
      console.error(`❌ [SUNO] Status check error for ${endpoint}:`);
      console.error('   Status:', error.response?.status);
      console.error('   Data:', JSON.stringify(error.response?.data, null, 2));
      console.error('   Message:', error.message);
      throw error;
    }
  }
  
  // If all endpoints returned 404, throw the last error
  console.error(`❌ [SUNO] All status endpoints returned 404`);
  throw new Error(`Failed to check song status: All endpoints returned 404. Task ID: ${songId}`);
}
