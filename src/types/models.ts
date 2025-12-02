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

export function getLullabyStyleLabel(style: LullabyStyle): string {
  switch (style) {
    case 'soft': return 'Douce et lente';
    case 'joyful': return 'Joyeuse et rassurante';
    case 'spoken': return 'Plus parlée que chantée';
    case 'melodic': return 'Plus mélodique';
  }
}
