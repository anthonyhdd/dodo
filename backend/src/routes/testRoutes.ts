import { Router, Request, Response } from 'express';
import { cloneVoiceFromSamples } from '../services/elevenLabsService';
import { generateLullaby, getSunoSongStatus } from '../services/sunoService';
import { generateLullabyWithCustomVoice } from '../services/audioCombinerService';
import { supabase } from '../lib/supabase';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const router = Router();

/**
 * GET /api/test/latest-mp3
 * Get the latest MP3 file from Supabase Storage
 */
router.get('/latest-mp3', async (req: Request, res: Response) => {
  try {
    console.log('📥 [TEST] Received latest-mp3 request');
    
    const bucket = process.env.SUPABASE_LULLABIES_BUCKET || 'dodo-audio';
    
    // List all files in the bucket
    const { data: files, error } = await supabase.storage
      .from(bucket)
      .list('lullabies', {
        limit: 1000,
      });

    if (error) {
      console.error('❌ [TEST] Error listing files:', error);
      return res.status(500).json({ error: `Failed to list files: ${error.message}` });
    }

    if (!files || files.length === 0) {
      return res.status(404).json({ error: 'No MP3 files found in Supabase Storage' });
    }

    // Find the latest MP3 file (sort by created_at)
    const mp3Files = files
      .filter(file => file.name.toLowerCase().endsWith('.mp3'))
      .sort((a, b) => {
        const timeA = new Date(a.created_at || 0).getTime();
        const timeB = new Date(b.created_at || 0).getTime();
        return timeB - timeA; // Descending order
      });
    
    if (mp3Files.length === 0) {
      return res.status(404).json({ error: 'No MP3 files found' });
    }

    const latestFile = mp3Files[0];
    const filePath = `lullabies/${latestFile.name}`;

    // Get public URL or signed URL
    let fileUrl: string;
    try {
      const { data: signedData, error: signedError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, 3600);

      if (!signedError && signedData) {
        fileUrl = signedData.signedUrl;
      } else {
        // Fallback to public URL
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);
        fileUrl = urlData.publicUrl;
      }
    } catch (urlError: any) {
      console.error('❌ [TEST] Error generating URL:', urlError);
      return res.status(500).json({ error: `Failed to generate file URL: ${urlError.message}` });
    }

    console.log('✅ [TEST] Latest MP3 found:', latestFile.name, fileUrl);

    res.json({
      success: true,
      fileName: latestFile.name,
      fileUrl,
      filePath,
      createdAt: latestFile.created_at,
    });
  } catch (error: any) {
    console.error('❌ [TEST] Error in latest-mp3:', error);
    res.status(500).json({
      error: error.message || 'Failed to get latest MP3',
    });
  }
});

/**
 * GET /api/test/saved-voice-id
 * Get the saved Voice ID if it exists
 */
router.get('/saved-voice-id', async (req: Request, res: Response) => {
  try {
    const voiceIdPath = path.join(__dirname, '../../saved-voice-id.json');
    
    if (fs.existsSync(voiceIdPath)) {
      const data = JSON.parse(fs.readFileSync(voiceIdPath, 'utf-8'));
      console.log('📥 [TEST] Found saved Voice ID:', data.voiceId);
      res.json({
        success: true,
        voiceId: data.voiceId,
        createdAt: data.createdAt,
      });
    } else {
      res.json({
        success: false,
        message: 'No saved Voice ID found',
      });
    }
  } catch (error: any) {
    console.error('❌ [TEST] Error reading saved Voice ID:', error);
    res.status(500).json({
      error: error.message || 'Failed to read saved Voice ID',
    });
  }
});

/**
 * POST /api/test/upload-and-clone
 * Use default Voice ID or saved Voice ID (no new cloning to avoid limit)
 */
router.post('/upload-and-clone', async (req: Request, res: Response) => {
  try {
    console.log('📥 [TEST] Received upload-and-clone request');
    
    // Default Voice ID to use (user's existing voice)
    const DEFAULT_VOICE_ID = 'oRfLTfDD1TbLrWuf61pJ';
    
    // First, use the default Voice ID
    let voiceId: string = DEFAULT_VOICE_ID;
    let fromCache = true;
    let message = 'Using default Voice ID';
    
    // Check if we have a saved Voice ID (as fallback)
    const voiceIdPath = path.join(__dirname, '../../saved-voice-id.json');
    if (fs.existsSync(voiceIdPath)) {
      try {
        const savedData = JSON.parse(fs.readFileSync(voiceIdPath, 'utf-8'));
        if (savedData.voiceId) {
          voiceId = savedData.voiceId;
          message = 'Using saved Voice ID';
          console.log('✅ [TEST] Using saved Voice ID:', voiceId);
        } else {
          console.log('✅ [TEST] Using default Voice ID:', DEFAULT_VOICE_ID);
        }
      } catch (error: any) {
        console.warn('⚠️ [TEST] Error reading saved Voice ID, using default:', error.message);
        console.log('✅ [TEST] Using default Voice ID:', DEFAULT_VOICE_ID);
      }
    } else {
      console.log('✅ [TEST] Using default Voice ID:', DEFAULT_VOICE_ID);
    }
    
    // Save the Voice ID being used to file for consistency
    fs.writeFileSync(voiceIdPath, JSON.stringify({ 
      voiceId, 
      createdAt: new Date().toISOString(),
      isDefault: voiceId === DEFAULT_VOICE_ID,
    }, null, 2));
    
    res.json({
      success: true,
      voiceId,
      message,
      fromCache,
    });
  } catch (error: any) {
    console.error('❌ [TEST] Error:', error.message);
    res.status(500).json({
      error: error.message || 'Failed to get Voice ID',
      details: error.response?.data || undefined,
    });
  }
});

/**
 * POST /api/test/generate-lullaby
 * Generate a lullaby using Suno with a cloned ElevenLabs voice
 */
router.post('/generate-lullaby', async (req: Request, res: Response) => {
  try {
    console.log('📥 [TEST] Received generate-lullaby request');
    const { voiceId, prompt, style, durationMinutes } = req.body;

    if (!voiceId) {
      return res.status(400).json({ error: 'voiceId is required' });
    }

    console.log('📥 [TEST] Request params:', {
      voiceId,
      prompt,
      style,
      durationMinutes,
    });

    // SOLUTION: Use Suno's "Upload And Cover Audio" feature
    // This transforms vocal audio into a complete song with music
    // Workflow:
    // 1. Generate vocals using ElevenLabs TTS with cloned voice
    // 2. Upload vocals to Suno "Upload And Cover Audio"
    // 3. Suno generates complete song around the vocals
    // 
    // This gives the BEST quality: Suno generates full song with music, using our custom vocals
    
    console.log('🎵 [TEST] Generating lullaby with custom voice using Suno "Upload And Cover Audio"...');
    console.log('✅ [TEST] This will use ElevenLabs for vocals + Suno for complete song generation');
    console.log('✅ [TEST] Result: Full Suno-quality song with your custom voice!');
    
    const lyrics = prompt || 'Une douce berceuse pour endormir un enfant, avec une mélodie apaisante et des paroles tendres. Dormir, dormir, mon petit enfant, dans les bras de maman, tout doucement.';
    
    const result = await generateLullabyWithCustomVoice(
      voiceId,
      lyrics,
      style || 'soft',
      durationMinutes || 2
    );
    
    const sunoSong = {
      id: result.taskId,
      title: 'Lullaby with Custom Voice',
      status: result.status as 'generating' | 'complete' | 'failed',
      audio_url: result.audioUrl,
    };

    console.log('✅ [TEST] Lullaby generated:', sunoSong.id);

    // Poll for completion
    // According to Suno docs: Stream URL available in 30-40 seconds, downloadable URL in 2-3 minutes
    let attempts = 0;
    const maxAttempts = 120; // 10 minutes max (120 * 5 seconds)
    let finalSong = sunoSong;
    let lastStatus = 'generating';

    console.log(`🔄 [TEST] Starting to poll for completion. Max attempts: ${maxAttempts} (10 minutes)`);
    
    while (finalSong.status === 'generating' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      attempts++;
      
      try {
        finalSong = await getSunoSongStatus(sunoSong.id);
        console.log(`🔄 [TEST] Status check ${attempts}/${maxAttempts}: ${finalSong.status}`);
        
        if (finalSong.status !== lastStatus) {
          console.log(`📊 [TEST] Status changed: ${lastStatus} → ${finalSong.status}`);
          lastStatus = finalSong.status;
        }
        
        // If we have an audio URL even if status is still generating, we can return it
        if (finalSong.audio_url) {
          console.log(`✅ [TEST] Audio URL available: ${finalSong.audio_url}`);
          res.json({
            success: true,
            songId: finalSong.id,
            audioUrl: finalSong.audio_url,
            status: finalSong.status,
            message: `Lullaby ${finalSong.status === 'complete' ? 'generated successfully' : 'generating (URL available)'}`,
          });
          return;
        }
        
        // If status is complete, break and return
        if (finalSong.status === 'complete') {
          break;
        }
        
        // If status is failed, break and return error
        if (finalSong.status === 'failed') {
          break;
        }
      } catch (err: any) {
        console.error(`❌ [TEST] Error checking status (attempt ${attempts}):`, err.message);
        // Don't break on first error, continue polling
        if (attempts >= 10) {
          // After 10 attempts (50 seconds), if still errors, return the taskId anyway
          console.log(`⚠️ [TEST] Multiple status check errors, returning taskId for manual check`);
          res.json({
            success: true,
            songId: sunoSong.id,
            status: 'generating',
            message: 'Lullaby generation started. Use taskId to check status manually.',
            note: 'Status check encountered errors, but generation may still be in progress',
          });
          return;
        }
      }
    }

    // After polling
    if (finalSong.status === 'complete' && finalSong.audio_url) {
      res.json({
        success: true,
        songId: finalSong.id,
        audioUrl: finalSong.audio_url,
        message: 'Lullaby generated successfully',
      });
    } else if (finalSong.status === 'failed') {
      res.status(500).json({
        error: `Lullaby generation failed. Song ID: ${finalSong.id}`,
        songId: finalSong.id,
      });
    } else {
      // Still generating after max attempts - return taskId for manual check
      console.log(`⚠️ [TEST] Generation still in progress after ${maxAttempts} attempts (10 minutes)`);
      res.json({
        success: true,
        songId: finalSong.id,
        status: finalSong.status,
        message: 'Lullaby generation in progress. Use taskId to check status later.',
        note: 'Generation may take 2-3 minutes. Check status using the taskId.',
      });
    }
  } catch (error: any) {
    console.error('❌ [TEST] Error in generate-lullaby:', error);
    console.error('❌ [TEST] Error message:', error.message);
    console.error('❌ [TEST] Error stack:', error.stack);
    if (error.response) {
      console.error('❌ [TEST] Error response status:', error.response.status);
      console.error('❌ [TEST] Error response data:', JSON.stringify(error.response.data, null, 2));
    }
    
    res.status(500).json({
      error: error.message || 'Failed to generate lullaby',
      details: error.response?.data || undefined,
    });
  }
});

export default router;
