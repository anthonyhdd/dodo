export type VoiceStatus = 'recording' | 'processing' | 'ready' | 'error';

export interface Child {
  id: string;
  name: string;
  ageMonths?: number;
  createdAt: string;
}

export type LullabyStyle = 'soft' | 'joyful' | 'spoken' | 'melodic';

export type LullabyStatus = 'generating' | 'ready' | 'failed';

export interface VoiceProfile {
  id: string;
  status: VoiceStatus;
  createdAt: string;
  elevenlabs_voice_id?: string;
}

export interface Lullaby {
  id: string;
  childId: string;
  voiceProfileId: string;
  title: string;
  style: LullabyStyle;
  durationMinutes: number;
  languageCode: string;
  status: LullabyStatus;
  audioUrl?: string;
  createdAt: string;
}

