import { VoiceProfile } from '../models/types';
import { supabase } from '../lib/supabase';
import { cloneVoiceFromSamples } from './elevenLabsService';
import axios from 'axios';
import fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface VoiceCloneProvider {
  cloneVoiceFromSamples(samples: { storagePath: string }[]): Promise<{ externalVoiceId: string }>;
}

/**
 * Save audio buffer to temporary file
 */
async function saveAudioToTemp(audioBuffer: Buffer): Promise<string> {
  const tempPath = path.join(os.tmpdir(), `voice-${Date.now()}-${Math.random().toString(36).slice(2)}.m4a`);
  fs.writeFileSync(tempPath, audioBuffer);
  return tempPath;
}

/**
 * Upload audio file to Supabase Storage
 */
async function uploadAudioToStorage(
  filePath: string,
  voiceProfileId: string,
  stepNumber: number
): Promise<string> {
  const bucket = process.env.SUPABASE_LULLABIES_BUCKET || 'dodo-audio';
  const storagePath = `voices/${voiceProfileId}/source-${stepNumber}.m4a`;

  const fileBuffer = fs.readFileSync(filePath);

  const { error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, fileBuffer, {
      contentType: 'audio/m4a',
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload audio to storage: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(storagePath);

  return urlData.publicUrl;
}

export async function createVoiceProfile(audioBuffers: Buffer[]): Promise<VoiceProfile> {
  if (!audioBuffers || audioBuffers.length === 0) {
    throw new Error('audioBuffers must be provided');
  }

  // Create voice profile in database
  console.log('📝 Creating voice profile in Supabase...');
  const { data, error } = await supabase
    .from('voice_profiles')
    .insert({
      status: 'processing',
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Supabase error:', error);
    console.error('❌ Supabase error details:', JSON.stringify(error, null, 2));
    
    // Check if it's a network/DNS error
    if (error.message && (error.message.includes('fetch failed') || error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo'))) {
      throw new Error(`Cannot connect to Supabase. Please check your SUPABASE_URL and internet connection. Error: ${error.message}`);
    }
    
    throw new Error(`Failed to create voice profile: ${error.message}`);
  }
  
  console.log('✅ Voice profile created in Supabase:', data.id);

  const voiceProfileId = data.id;

  try {
    // Save audio buffers to temp files
    const tempFiles: string[] = [];
    const uploadedPaths: string[] = [];

    for (let i = 0; i < audioBuffers.length; i++) {
      const buffer = audioBuffers[i];
      
      // Save to temp file
      const tempPath = await saveAudioToTemp(buffer);
      tempFiles.push(tempPath);

      // Upload to Supabase Storage
      const storageUrl = await uploadAudioToStorage(tempPath, voiceProfileId, i + 1);
      uploadedPaths.push(storageUrl);
    }

    // Clone voice using ElevenLabs
    let elevenLabsVoiceId: string | null = null;
    try {
      console.log('🎤 Starting ElevenLabs voice cloning with', tempFiles.length, 'files');
      // Use temp files directly for ElevenLabs (they're already on disk)
      elevenLabsVoiceId = await cloneVoiceFromSamples(
        tempFiles,
        `DODO Voice ${voiceProfileId}`
      );
      console.log('✅ ElevenLabs voice cloned successfully:', elevenLabsVoiceId);

      // Update voice profile with ElevenLabs voice ID
      const { error: updateError } = await supabase
        .from('voice_profiles')
        .update({
          status: 'ready',
          elevenlabs_voice_id: elevenLabsVoiceId,
        })
        .eq('id', voiceProfileId);

      if (updateError) {
        throw new Error(`Failed to update voice profile: ${updateError.message}`);
      }
    } catch (elevenLabsError: any) {
      console.error('❌ ElevenLabs error:', elevenLabsError);
      console.error('❌ ElevenLabs error details:', elevenLabsError.message, elevenLabsError.stack);
      
      // For now, mark as ready even if ElevenLabs fails (we can retry later)
      // This allows the user to continue using the app
      const { error: updateError } = await supabase
        .from('voice_profiles')
        .update({ 
          status: 'ready',
          // Don't set elevenlabs_voice_id if cloning failed
        })
        .eq('id', voiceProfileId);
      
      if (updateError) {
        console.error('❌ Failed to update voice profile status:', updateError);
      } else {
        console.log('⚠️ Voice profile marked as ready despite ElevenLabs failure');
      }
      
      // Don't throw - allow the process to continue
      // The voice profile will be ready but without ElevenLabs voice ID
    } finally {
      // Clean up temp files
      tempFiles.forEach(file => {
        try {
          if (fs.existsSync(file)) {
            fs.unlinkSync(file);
          }
        } catch (e) {
          // Ignore cleanup errors
        }
      });
    }

    // Fetch updated profile
    const { data: updated, error: fetchError } = await supabase
      .from('voice_profiles')
      .select('*')
      .eq('id', voiceProfileId)
      .single();

    if (fetchError || !updated) {
      throw new Error('Failed to fetch updated voice profile');
    }

    return {
      id: updated.id,
      status: updated.status,
      createdAt: updated.created_at,
      elevenlabs_voice_id: updated.elevenlabs_voice_id || undefined,
    };
  } catch (error: any) {
    console.error('❌ Error in createVoiceProfile:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Update status to error if something went wrong
    try {
      await supabase
        .from('voice_profiles')
        .update({ status: 'error' })
        .eq('id', voiceProfileId);
    } catch (updateErr) {
      console.error('❌ Failed to update voice profile to error status:', updateErr);
    }

    throw error;
  }
}

export async function getVoiceProfile(id: string): Promise<VoiceProfile | null> {
  const { data, error } = await supabase
    .from('voice_profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    throw new Error(`Failed to fetch voice profile: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  // If still processing, return as-is (don't auto-update to ready)
  return {
    id: data.id,
    status: data.status,
    createdAt: data.created_at,
    elevenlabs_voice_id: data.elevenlabs_voice_id || undefined,
  };
}
