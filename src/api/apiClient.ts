import { Child, Lullaby, LullabyStyle, VoiceProfile } from '../types/models';
import * as FileSystem from 'expo-file-system';

export interface APIClient {
  createVoiceProfile(audioUris: string[]): Promise<VoiceProfile>;
  fetchVoiceProfile(id: string): Promise<VoiceProfile>;

  createChild(name: string, ageMonths?: number): Promise<Child>;
  fetchChildren(): Promise<Child[]>;

  createLullaby(params: {
    childId: string;
    voiceProfileId: string;
    style: LullabyStyle;
    durationMinutes: number;
    languageCode: string;
  }): Promise<Lullaby>;

  fetchLullabies(): Promise<Lullaby[]>;
  fetchLullaby(id: string): Promise<Lullaby>;
}

export class MockAPIClient implements APIClient {
  private children: Child[] = [];
  private lullabies: Lullaby[] = [];
  private voiceProfiles: Record<string, VoiceProfile> = {};

  private delay(ms: number = 500): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async createChild(name: string, ageMonths?: number): Promise<Child> {
    await this.delay();
    const id = `child-${Date.now()}`;
    const child: Child = {
      id,
      name,
      ageMonths,
      createdAt: new Date().toISOString(),
    };
    this.children.push(child);
    return child;
  }

  async fetchChildren(): Promise<Child[]> {
    await this.delay();
    return [...this.children];
  }

  async createVoiceProfile(audioUris: string[]): Promise<VoiceProfile> {
    await this.delay(800);
    const id = `vp-${Date.now()}`;
    const profile: VoiceProfile = {
      id,
      status: 'processing',
      createdAt: new Date().toISOString(),
    };
    this.voiceProfiles[id] = profile;
    return profile;
  }

  async fetchVoiceProfile(id: string): Promise<VoiceProfile> {
    await this.delay(500);
    const profile = this.voiceProfiles[id];
    if (!profile) {
      throw new Error(`VoiceProfile with id ${id} not found`);
    }
    if (profile.status === 'processing') {
      profile.status = 'ready';
    }
    return profile;
  }

  async createLullaby(params: {
    childId: string;
    voiceProfileId: string;
    style: LullabyStyle;
    durationMinutes: number;
    languageCode: string;
  }): Promise<Lullaby> {
    await this.delay();
    const id = `lb-${Date.now()}`;
    const lullaby: Lullaby = {
      id,
      childId: params.childId,
      voiceProfileId: params.voiceProfileId,
      title: 'Comptine',
      style: params.style,
      durationMinutes: params.durationMinutes,
      languageCode: params.languageCode,
      status: 'generating',
      audioUrl: undefined,
      createdAt: new Date().toISOString(),
    };
    this.lullabies.push(lullaby);
    return lullaby;
  }

  async fetchLullaby(id: string): Promise<Lullaby> {
    await this.delay();
    const lullaby = this.lullabies.find(l => l.id === id);
    if (!lullaby) {
      throw new Error(`Lullaby with id ${id} not found`);
    }
    if (lullaby.status === 'generating') {
      lullaby.status = 'ready';
      lullaby.audioUrl = 'https://example.com/fake-lullaby.mp3';
    }
    return lullaby;
  }

  async fetchLullabies(): Promise<Lullaby[]> {
    await this.delay();
    return [...this.lullabies];
  }
}

// Base URL for the backend API
// Note: For Expo, you may need to use your machine's IP address instead of localhost
// e.g., 'http://192.168.1.100:4000' instead of 'http://localhost:4000'
const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:4000';

/**
 * HTTP API Client that calls the real backend
 */
export class HttpAPIClient implements APIClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error');
    }
  }

  async createVoiceProfile(audioUris: string[]): Promise<VoiceProfile> {
    const url = `${BASE_URL}/api/voice/profile`;
    
    console.log('📤 Sending voice profile request to:', url);
    console.log('📤 Audio URIs count:', audioUris.length);
    console.log('📤 Audio URIs:', audioUris);
    
    // Test connection first
    try {
      const testResponse = await fetch(`${BASE_URL}/`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      const testData = await testResponse.json();
      console.log('✅ Backend connection test:', testResponse.status, testData);
    } catch (testError: any) {
      console.error('❌ Backend connection test failed:', testError);
      throw new Error(`Impossible de se connecter au serveur sur ${BASE_URL}. Vérifiez que le backend tourne et que vous êtes sur le même réseau Wi-Fi.`);
    }
    
    // Create FormData to send audio files
    // In React Native, FormData can handle file:// URIs directly
    const formData = new FormData();
    
    for (let i = 0; i < audioUris.length; i++) {
      const uri = audioUris[i];
      console.log(`📤 Adding file ${i + 1}:`, uri);
      
      // Ensure URI starts with file:// for local files
      const fileUri = uri.startsWith('file://') ? uri : `file://${uri}`;
      
      formData.append('audioFiles', {
        uri: fileUri,
        type: 'audio/m4a',
        name: `recording-${i + 1}.m4a`,
      } as any);
    }

    try {
      console.log('📤 Sending FormData with', audioUris.length, 'files...');
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type, let fetch set it with boundary for FormData
          'Accept': 'application/json',
        },
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Voice profile created:', result.id);
      return result;
    } catch (error) {
      console.error('❌ createVoiceProfile error:', error);
      if (error instanceof Error) {
        // Improve error message for network errors
        if (error.message.includes('fetch failed') || error.message.includes('Network request failed') || error.message.includes('TypeError: fetch failed')) {
          throw new Error(`Impossible de se connecter au serveur. Vérifiez que le backend tourne sur ${BASE_URL} et que vous êtes sur le même réseau Wi-Fi.`);
        }
        throw error;
      }
      throw new Error('Network error');
    }
  }

  async fetchVoiceProfile(id: string): Promise<VoiceProfile> {
    return this.request<VoiceProfile>(`/api/voice/profile/${id}`);
  }

  async createChild(name: string, ageMonths?: number): Promise<Child> {
    return this.request<Child>('/api/children', {
      method: 'POST',
      body: JSON.stringify({ name, ageMonths }),
    });
  }

  async fetchChildren(): Promise<Child[]> {
    return this.request<Child[]>('/api/children');
  }

  async createLullaby(params: {
    childId: string;
    voiceProfileId: string;
    style: LullabyStyle;
    durationMinutes: number;
    languageCode: string;
  }): Promise<Lullaby> {
    console.log('📤 [FRONTEND] Creating lullaby with params:', params);
    console.log('📤 [FRONTEND] Calling:', `${BASE_URL}/lullabies`);
    return this.request<Lullaby>('/lullabies', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async fetchLullabies(): Promise<Lullaby[]> {
    return this.request<Lullaby[]>('/lullabies');
  }

  async fetchLullaby(id: string): Promise<Lullaby> {
    return this.request<Lullaby>(`/lullabies/${id}`);
  }
}
