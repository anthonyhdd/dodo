import { Lullaby, LullabyStyle } from '../models/types';
import { supabase } from '../lib/supabase';
import { generateLullaby as generateSunoLullaby, getSunoSongStatus } from './sunoService';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

export interface MusicGenerationProvider {
  generateLullaby(params: {
    prompt: string;
    style: string;
    durationMinutes: number;
    voiceId?: string;
  }): Promise<{ audioBuffer: Buffer; format: 'mp3' | 'wav' }>;
}

class DummyMusicGenerationProvider implements MusicGenerationProvider {
  async generateLullaby(params: {
    prompt: string;
    style: string;
    durationMinutes: number;
    voiceId?: string;
  }): Promise<{ audioBuffer: Buffer; format: 'mp3' | 'wav' }> {
    const testAudioPath = path.join(__dirname, '../../assets/sample-lullaby.mp3');
    
    // 1. Utiliser un vrai MP3 local s'il existe
    if (fs.existsSync(testAudioPath)) {
      const fileBuffer = fs.readFileSync(testAudioPath);
      return {
        audioBuffer: fileBuffer,
        format: 'mp3',
      };
    }

    // 2. Sinon, télécharger un vrai MP3 depuis une URL publique
    const fallbackUrl = process.env.FALLBACK_LULLABY_MP3_URL;
    if (!fallbackUrl) {
      throw new Error(
        'No local sample-lullaby.mp3 file and no FALLBACK_LULLABY_MP3_URL configured'
      );
    }

    const response = await axios.get(fallbackUrl, { responseType: 'arraybuffer' });
    const audioBuffer = Buffer.from(response.data);

    return {
      audioBuffer,
      format: 'mp3',
    };
  }
}

const musicProvider: MusicGenerationProvider = new DummyMusicGenerationProvider();

async function generateAndUploadLullaby(
  lullabyId: string,
  style: string,
  durationMinutes: number,
  elevenLabsVoiceId?: string
): Promise<string> {
  const bucket = process.env.SUPABASE_LULLABIES_BUCKET || 'dodo-audio';
  const storagePath = `lullabies/${lullabyId}.mp3`;

  let audioBuffer: Buffer;
  let format: 'mp3' | 'wav' = 'mp3';

  // Try to use Suno if API key is available
  const SUNO_API_KEY = process.env.SUNO_API_KEY;
  console.log(`🎵 [generateAndUploadLullaby] Checking Suno availability:`);
  console.log(`   SUNO_API_KEY: ${SUNO_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`   elevenLabsVoiceId: ${elevenLabsVoiceId || '❌ Missing'}`);
  
  if (SUNO_API_KEY && elevenLabsVoiceId) {
    console.log(`✅ [generateAndUploadLullaby] Using Suno for generation`);
    try {
      // Generate with Suno
      const styleLabels: Record<string, string> = {
        soft: 'douce et lente',
        joyful: 'joyeuse et rassurante',
        spoken: 'plus parlée que chantée',
        melodic: 'plus mélodique',
      };
      
      const prompt = `Une comptine ${styleLabels[style] || style} pour endormir un enfant, en français`;
      const durationSeconds = durationMinutes * 60;
      
      console.log(`🎵 [generateAndUploadLullaby] Calling Suno with prompt: "${prompt}"`);
      console.log(`🎵 [generateAndUploadLullaby] Duration: ${durationSeconds}s, Voice ID: ${elevenLabsVoiceId}`);
      
      const sunoSong = await generateSunoLullaby(prompt, style, durationSeconds, elevenLabsVoiceId);
      console.log(`✅ [generateAndUploadLullaby] Suno song created: ${sunoSong.id}, status: ${sunoSong.status}`);
      
      // Poll for completion
      let song = sunoSong;
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes max
      
      while (song.status === 'generating' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        song = await getSunoSongStatus(song.id);
        attempts++;
      }
      
      if (song.status === 'complete' && song.audio_url) {
        console.log(`✅ [generateAndUploadLullaby] Suno generation complete! Downloading audio from: ${song.audio_url}`);
        // Download audio from Suno
        const response = await axios.get(song.audio_url, { responseType: 'arraybuffer' });
        audioBuffer = Buffer.from(response.data);
        console.log(`✅ [generateAndUploadLullaby] Audio downloaded from Suno, size: ${audioBuffer.length} bytes`);
      } else {
        throw new Error(`Suno generation failed or timed out. Final status: ${song.status}, audio_url: ${song.audio_url || 'missing'}`);
      }
    } catch (sunoError) {
      console.error('❌ [generateAndUploadLullaby] Suno generation failed, falling back to placeholder:', sunoError);
      console.error('❌ [generateAndUploadLullaby] Error details:', sunoError instanceof Error ? sunoError.message : String(sunoError));
      // Fall back to placeholder
      console.warn('⚠️ [generateAndUploadLullaby] Using Dummy Provider (fallback MP3)');
      const result = await musicProvider.generateLullaby({
        prompt: `A ${style} lullaby`,
        style,
        durationMinutes,
        voiceId: elevenLabsVoiceId,
      });
      audioBuffer = result.audioBuffer;
      format = result.format;
    }
  } else {
    // Use placeholder provider
    console.warn(`⚠️ [generateAndUploadLullaby] Skipping Suno - using Dummy Provider instead`);
    console.warn(`   Reason: ${!SUNO_API_KEY ? 'SUNO_API_KEY missing' : 'elevenLabsVoiceId missing'}`);
    const result = await musicProvider.generateLullaby({
      prompt: `A ${style} lullaby`,
      style,
      durationMinutes,
      voiceId: elevenLabsVoiceId,
    });
    audioBuffer = result.audioBuffer;
    format = result.format;
  }

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, audioBuffer, {
      contentType: `audio/${format}`,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Failed to upload audio: ${uploadError.message}`);
  }

  // Try to get a signed URL first (works for both public and private buckets)
  const { data: signedData, error: signedError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(storagePath, 3600 * 24 * 7); // 7 days expiry
  
  if (!signedError && signedData?.signedUrl) {
    console.log('✅ Generated signed URL (valid for 7 days):', signedData.signedUrl);
    return signedData.signedUrl;
  }

  // Fallback to public URL if signed URL fails
  console.warn('⚠️ Signed URL failed, trying public URL:', signedError?.message);
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(storagePath);

  const publicUrl = urlData.publicUrl;
  console.log('📤 Generated public URL:', publicUrl);
  
  // Verify URL is accessible
  try {
    const testResponse = await axios.head(publicUrl, { timeout: 5000 });
    console.log('✅ Public URL is accessible, status:', testResponse.status);
    return publicUrl;
  } catch (testError: any) {
    console.error('❌ Public URL is not accessible:', testError.message);
    throw new Error(`Audio URL is not accessible. Please make sure the bucket "${bucket}" is public in Supabase Storage settings.`);
  }
}

/**
 * Generate lullaby audio in the background (async)
 */
async function generateLullabyInBackground(
  lullabyId: string,
  voiceProfileId: string,
  style: LullabyStyle,
  durationMinutes: number
): Promise<void> {
  try {
    console.log(`🎵 [Background] Starting generation for lullaby ${lullabyId}`);

    // Get ElevenLabs voice ID from voice profile
    const { data: voiceProfile } = await supabase
      .from('voice_profiles')
      .select('elevenlabs_voice_id')
      .eq('id', voiceProfileId)
      .single();

    const elevenLabsVoiceId = voiceProfile?.elevenlabs_voice_id || undefined;
    console.log(`🎤 [Background] ElevenLabs voice ID: ${elevenLabsVoiceId || 'not available'}`);

    // Generate and upload audio (this can take time)
    const audioUrl = await generateAndUploadLullaby(
      lullabyId,
      style,
      durationMinutes,
      elevenLabsVoiceId
    );
    console.log(`✅ [Background] Audio generated and uploaded: ${audioUrl}`);

    // Update lullaby with audio URL and status 'ready'
    const { data: updated, error: updateError } = await supabase
      .from('lullabies')
      .update({
        status: 'ready',
        audio_url: audioUrl,
      })
      .eq('id', lullabyId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update lullaby: ${updateError.message}`);
    }

    console.log(`✅ [Background] Lullaby ${lullabyId} is now ready!`);
  } catch (audioError: any) {
    console.error(`❌ [Background] Audio generation failed for lullaby ${lullabyId}:`, audioError);
    console.error('❌ [Background] Error details:', audioError.message, audioError.stack);

    // If audio generation fails, mark as failed
    try {
      await supabase
        .from('lullabies')
        .update({ status: 'failed' })
        .eq('id', lullabyId);
      console.log(`⚠️ [Background] Lullaby ${lullabyId} marked as failed`);
    } catch (updateErr) {
      console.error(`❌ [Background] Failed to update lullaby status to failed:`, updateErr);
    }
  }
}

export async function createLullaby(params: {
  childId: string;
  voiceProfileId: string;
  style: LullabyStyle;
  durationMinutes: number;
  languageCode: string;
}): Promise<Lullaby> {
  console.log('🎵 Creating lullaby with params:', {
    childId: params.childId,
    voiceProfileId: params.voiceProfileId,
    style: params.style,
    durationMinutes: params.durationMinutes,
  });

  // Insert lullaby with status 'generating'
  const { data, error } = await supabase
    .from('lullabies')
    .insert({
      child_id: params.childId,
      voice_profile_id: params.voiceProfileId,
      title: 'Comptine',
      style: params.style,
      duration_minutes: params.durationMinutes,
      language_code: params.languageCode,
      status: 'generating',
      audio_url: null,
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Failed to create lullaby in database:', error);
    throw new Error(`Failed to create lullaby: ${error.message}`);
  }

  console.log('✅ Lullaby created in database:', data.id);

  // Start generation in background (non-blocking)
  setImmediate(() => {
    generateLullabyInBackground(
      data.id,
      params.voiceProfileId,
      params.style,
      params.durationMinutes
    ).catch((err) => {
      console.error(`❌ [Background] Unhandled error in background generation:`, err);
    });
  });

  // Return immediately with status 'generating'
  return {
    id: data.id,
    childId: data.child_id,
    voiceProfileId: data.voice_profile_id,
    title: data.title,
    style: data.style,
    durationMinutes: data.duration_minutes,
    languageCode: data.language_code,
    status: data.status,
    audioUrl: data.audio_url || undefined,
    createdAt: data.created_at,
  };
}

export async function getLullaby(id: string): Promise<Lullaby | null> {
  const { data, error } = await supabase
    .from('lullabies')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch lullaby: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    childId: data.child_id,
    voiceProfileId: data.voice_profile_id,
    title: data.title,
    style: data.style,
    durationMinutes: data.duration_minutes,
    languageCode: data.language_code,
    status: data.status,
    audioUrl: data.audio_url,
    createdAt: data.created_at,
  };
}

export async function listLullabies(): Promise<Lullaby[]> {
  const { data, error } = await supabase
    .from('lullabies')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch lullabies: ${error.message}`);
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    childId: row.child_id,
    voiceProfileId: row.voice_profile_id,
    title: row.title,
    style: row.style,
    durationMinutes: row.duration_minutes,
    languageCode: row.language_code,
    status: row.status,
    audioUrl: row.audio_url,
    createdAt: row.created_at,
  }));
}
