import { Router, Request, Response } from 'express';
import { getChildren, createChild } from '../services/childService';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const children = await getChildren();
    res.json(children);
  } catch (error) {
    console.error('Error fetching children:', error);
    res.status(500).json({ error: 'Failed to fetch children' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, ageMonths } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'name is required and must be a non-empty string' });
    }
    const child = await createChild(name.trim(), ageMonths);
    res.status(201).json(child);
  } catch (error) {
    console.error('Error creating child:', error);
    res.status(500).json({ error: 'Failed to create child' });
  }
});

export default router;
