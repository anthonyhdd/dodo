import { Router, Request, Response } from 'express';
import { createLullaby, getLullaby, listLullabies } from '../services/lullabyService';
import { LullabyStyle } from '../models/types';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const lullabies = await listLullabies();
    res.json(lullabies);
  } catch (error) {
    console.error('Error fetching lullabies:', error);
    res.status(500).json({ error: 'Failed to fetch lullabies' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { childId, voiceProfileId, style, durationMinutes, languageCode } = req.body;
    
    if (!childId || typeof childId !== 'string') {
      return res.status(400).json({ error: 'childId is required' });
    }
    if (!voiceProfileId || typeof voiceProfileId !== 'string') {
      return res.status(400).json({ error: 'voiceProfileId is required' });
    }
    if (!style || !['soft', 'joyful', 'spoken', 'melodic'].includes(style)) {
      return res.status(400).json({ error: 'style must be one of: soft, joyful, spoken, melodic' });
    }
    if (typeof durationMinutes !== 'number' || durationMinutes <= 0) {
      return res.status(400).json({ error: 'durationMinutes must be a positive number' });
    }
    if (!languageCode || typeof languageCode !== 'string') {
      return res.status(400).json({ error: 'languageCode is required' });
    }

    const lullaby = await createLullaby({
      childId,
      voiceProfileId,
      style: style as LullabyStyle,
      durationMinutes,
      languageCode,
    });
    res.status(201).json(lullaby);
  } catch (error) {
    console.error('Error creating lullaby:', error);
    res.status(500).json({ error: 'Failed to create lullaby' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const lullaby = await getLullaby(id);
    if (!lullaby) {
      return res.status(404).json({ error: 'Lullaby not found' });
    }
    res.json(lullaby);
  } catch (error) {
    console.error('Error fetching lullaby:', error);
    res.status(500).json({ error: 'Failed to fetch lullaby' });
  }
});

export default router;
