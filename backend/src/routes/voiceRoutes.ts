import { Router, Request, Response } from 'express';
import multer from 'multer';
import { createVoiceProfile, getVoiceProfile } from '../services/voiceService';

const router = Router();

// Configure multer for memory storage (we'll upload to Supabase)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max per file
  },
});

router.post('/profile', upload.array('audioFiles', 3), async (req: Request, res: Response) => {
  try {
    console.log('📥 Received voice profile request');
    console.log('📥 Files received:', req.files ? (req.files as Express.Multer.File[]).length : 0);
    console.log('📥 Content-Type:', req.headers['content-type']);
    
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      console.error('❌ No files received');
      return res.status(400).json({ error: 'No audio files provided' });
    }

    console.log('📥 Processing', files.length, 'audio files');
    
    // Extract buffers from uploaded files
    const audioBuffers = files.map(file => file.buffer);
    console.log('📥 Audio buffers sizes:', audioBuffers.map(b => b.length));

    // Create voice profile with buffers
    const profile = await createVoiceProfile(audioBuffers);
    console.log('✅ Voice profile created:', profile.id);

    res.json(profile);
  } catch (error: any) {
    console.error('❌ Error creating voice profile:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ error: error.message || 'Failed to create voice profile' });
  }
});

router.get('/profile/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const profile = await getVoiceProfile(id);
    if (!profile) {
      return res.status(404).json({ error: 'Voice profile not found' });
    }
    res.json(profile);
  } catch (error: any) {
    console.error('Error fetching voice profile:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch voice profile' });
  }
});

export default router;
