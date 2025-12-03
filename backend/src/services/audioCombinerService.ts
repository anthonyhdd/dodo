import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { generateSpeech } from './elevenLabsService';
import { generateLullaby, getSunoSongStatus } from './sunoService';

/**
 * Generate a complete lullaby using Suno's "Upload And Cover Audio" feature
 * This transforms a vocal audio file into a complete song with music
 * 
 * Workflow:
 * 1. Generate vocals using ElevenLabs TTS with cloned voice
 * 2. Upload the vocals to Suno "Upload And Cover Audio" endpoint
 * 3. Suno transforms it into a complete song with music
 * 
 * This gives the best quality: Suno generates the full song around the vocals
 */
export async function generateLullabyWithCustomVoice(
  voiceId: string,
  lyrics: string,
  style: string,
  durationMinutes: number
): Promise<{ taskId: string; audioUrl?: string; status: string }> {
  const SUNO_API_KEY = process.env.SUNO_API_KEY;
  const SUNO_API_URL = process.env.SUNO_API_URL || 'https://api.sunoapi.org';

  if (!SUNO_API_KEY) {
    throw new Error('SUNO_API_KEY is not set');
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log(`🎵 [AUDIO_COMBINER] Generating lullaby with custom voice`);
  console.log(`   Voice ID: ${voiceId}`);
  console.log(`   Lyrics: ${lyrics.substring(0, 100)}...`);
  console.log(`   Style: ${style}`);
  console.log(`   Duration: ${durationMinutes} minutes`);

  let tempVocalsPath: string | null = null;

  try {
    // Step 1: Generate vocals using ElevenLabs TTS
    console.log(`\n🎤 [AUDIO_COMBINER] Step 1: Generating vocals with ElevenLabs...`);
    const vocalsBuffer = await generateSpeech(voiceId, lyrics);
    console.log(`✅ [AUDIO_COMBINER] Vocals generated, size: ${vocalsBuffer.length} bytes`);

    // Step 2: Save vocals to temp file
    tempVocalsPath = path.join(os.tmpdir(), `vocals-${Date.now()}-${Math.random().toString(36).slice(2)}.mp3`);
    fs.writeFileSync(tempVocalsPath, vocalsBuffer);
    console.log(`✅ [AUDIO_COMBINER] Vocals saved to: ${tempVocalsPath}`);

    // Step 3: Upload to Suno "Upload And Cover Audio" endpoint
    // According to docs, this endpoint transforms vocal audio into a complete song
    console.log(`\n🎵 [AUDIO_COMBINER] Step 2: Uploading to Suno "Upload And Cover Audio"...`);
    
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('audio', fs.createReadStream(tempVocalsPath), {
      filename: 'vocals.mp3',
      contentType: 'audio/mpeg',
    });
    formData.append('style', style);
    formData.append('prompt', `A ${style} lullaby with these vocals`);
    
    // Try different possible endpoints
    const uploadEndpoints = [
      '/api/v1/generate/upload-cover',
      '/api/v1/upload-cover',
      '/api/v1/cover',
      '/api/v1/generate/upload-and-cover',
    ];

    let lastError: any = null;
    let taskId: string | null = null;

    for (const endpoint of uploadEndpoints) {
      try {
        console.log(`🔄 [AUDIO_COMBINER] Trying endpoint: ${SUNO_API_URL}${endpoint}`);
        
        const response = await axios.post(
          `${SUNO_API_URL}${endpoint}`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${SUNO_API_KEY}`,
              ...formData.getHeaders(),
            },
            timeout: 60000,
          }
        );

        console.log(`✅ [AUDIO_COMBINER] Upload successful! Response:`, JSON.stringify(response.data, null, 2));

        // Extract task ID
        taskId = response.data.data?.taskId || 
                response.data.taskId || 
                response.data.data?.id ||
                response.data.id;

        if (taskId) {
          console.log(`✅ [AUDIO_COMBINER] Task ID: ${taskId}`);
          break;
        }
      } catch (error: any) {
        lastError = error;
        if (error.response?.status === 404) {
          console.log(`   ❌ 404 - trying next endpoint...`);
          continue;
        }
        console.error(`❌ [AUDIO_COMBINER] Endpoint ${endpoint} failed:`, error.response?.status, error.response?.data);
        throw error;
      }
    }

    if (!taskId) {
      throw lastError || new Error('Failed to get task ID from Suno');
    }

    // Step 4: Poll for completion
    console.log(`\n🔄 [AUDIO_COMBINER] Step 3: Polling for completion...`);
    let attempts = 0;
    const maxAttempts = 120;
    let finalSong = { id: taskId, status: 'generating' as const, audio_url: undefined as string | undefined };

    while (finalSong.status === 'generating' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
      
      try {
        finalSong = await getSunoSongStatus(taskId);
        console.log(`🔄 [AUDIO_COMBINER] Status check ${attempts}/${maxAttempts}: ${finalSong.status}`);
        
        if (finalSong.audio_url) {
          console.log(`✅ [AUDIO_COMBINER] Audio URL available: ${finalSong.audio_url}`);
          return {
            taskId,
            audioUrl: finalSong.audio_url,
            status: finalSong.status,
          };
        }
      } catch (err: any) {
        console.error(`❌ [AUDIO_COMBINER] Status check error:`, err.message);
        if (attempts >= 10) {
          // Return taskId anyway for manual check
          return {
            taskId,
            status: 'generating',
          };
        }
      }
    }

    return {
      taskId,
      audioUrl: finalSong.audio_url,
      status: finalSong.status,
    };
  } catch (error: any) {
    console.error(`\n${'='.repeat(80)}`);
    console.error(`❌ [AUDIO_COMBINER] Error:`);
    console.error(`   Message: ${error.message}`);
    console.error(`   Status: ${error.response?.status}`);
    console.error(`   Data:`, JSON.stringify(error.response?.data, null, 2));
    console.error(`${'='.repeat(80)}\n`);
    throw error;
  } finally {
    // Cleanup temp file
    if (tempVocalsPath && fs.existsSync(tempVocalsPath)) {
      try {
        fs.unlinkSync(tempVocalsPath);
        console.log(`🧹 [AUDIO_COMBINER] Cleaned up temp vocals file`);
      } catch (e) {
        console.warn(`⚠️ [AUDIO_COMBINER] Failed to cleanup temp file:`, e);
      }
    }
  }
}

