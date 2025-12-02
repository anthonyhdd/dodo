import { Child, Lullaby, VoiceProfile } from '../models/types';

export const db = {
  children: [] as Child[],
  lullabies: [] as Lullaby[],
  voiceProfiles: new Map<string, VoiceProfile>(),
};

