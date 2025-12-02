import React, { createContext, useContext, useReducer, ReactNode, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Child, Lullaby, VoiceProfile } from '../types/models';
import { APIClient } from '../api/apiClient';
import { MockAPIClient, HttpAPIClient } from '../api/apiClient';

const STORAGE_KEYS = {
  VOICE_PROFILE: '@dodo_voiceProfile',
  CHILDREN: '@dodo_children',
  LULLABIES: '@dodo_lullabies',
  SETTINGS: '@dodo_settings',
};

type OnboardingRecordings = {
  step1Uri?: string;
  step2Uri?: string;
  step3Uri?: string;
};

type Settings = {
  parentName: string | null;
  defaultVolume: number;
  loopPlayback: boolean;
  theme: 'light' | 'dark';
};

type AppState = {
  voiceProfile: VoiceProfile | null;
  children: Child[];
  lullabies: Lullaby[];
  onboardingRecordings: OnboardingRecordings;
  settings: Settings;
};

const defaultSettings: Settings = {
  parentName: null,
  defaultVolume: 1,
  loopPlayback: false,
  theme: 'light',
};

type Action =
  | { type: 'SET_VOICE_PROFILE'; payload: VoiceProfile | null }
  | { type: 'SET_CHILDREN'; payload: Child[] }
  | { type: 'ADD_CHILD'; payload: Child }
  | { type: 'SET_LULLABIES'; payload: Lullaby[] }
  | { type: 'ADD_LULLABY'; payload: Lullaby }
  | { type: 'UPDATE_LULLABY'; payload: Lullaby }
  | { type: 'SET_ONBOARDING_RECORDING_STEP1'; payload: { uri: string } }
  | { type: 'SET_ONBOARDING_RECORDING_STEP2'; payload: { uri: string } }
  | { type: 'SET_ONBOARDING_RECORDING_STEP3'; payload: { uri: string } }
  | { type: 'RESET_ONBOARDING_RECORDINGS' }
  | { type: 'SET_SETTINGS'; payload: Partial<Settings> }
  | { type: 'RESET_APP' };

const initialState: AppState = {
  voiceProfile: null,
  children: [],
  lullabies: [],
  onboardingRecordings: {},
  settings: defaultSettings,
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_VOICE_PROFILE':
      return { ...state, voiceProfile: action.payload };

    case 'SET_CHILDREN':
      return { ...state, children: action.payload };

    case 'ADD_CHILD':
      return { ...state, children: [...state.children, action.payload] };

    case 'SET_LULLABIES':
      return { ...state, lullabies: action.payload };

    case 'ADD_LULLABY':
      return { ...state, lullabies: [...state.lullabies, action.payload] };

    case 'UPDATE_LULLABY':
      return {
        ...state,
        lullabies: state.lullabies.map(l =>
          l.id === action.payload.id ? action.payload : l
        ),
      };

    case 'SET_ONBOARDING_RECORDING_STEP1':
      return {
        ...state,
        onboardingRecordings: {
          ...state.onboardingRecordings,
          step1Uri: action.payload.uri,
        },
      };

    case 'SET_ONBOARDING_RECORDING_STEP2':
      return {
        ...state,
        onboardingRecordings: {
          ...state.onboardingRecordings,
          step2Uri: action.payload.uri,
        },
      };

    case 'SET_ONBOARDING_RECORDING_STEP3':
      return {
        ...state,
        onboardingRecordings: {
          ...state.onboardingRecordings,
          step3Uri: action.payload.uri,
        },
      };

    case 'RESET_ONBOARDING_RECORDINGS':
      return {
        ...state,
        onboardingRecordings: {},
      };

    case 'SET_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };

    case 'RESET_APP':
      return initialState;

    default:
      return state;
  }
}

type AppStateContextType = {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  apiClient: APIClient;
};

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

// Use HTTP client by default, fallback to Mock if needed
// Set USE_HTTP to false to use MockAPIClient for local development without backend
const USE_HTTP = true;
const apiClient: APIClient = USE_HTTP ? new HttpAPIClient() : new MockAPIClient();

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Hydration: Load persisted state on startup (async, no loading screen)
  useEffect(() => {
    async function hydrate() {
      try {
        // Load from storage in background (no blocking)
        const [voiceJson, childrenJson, lullabiesJson, settingsJson] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.VOICE_PROFILE).catch(() => null),
          AsyncStorage.getItem(STORAGE_KEYS.CHILDREN).catch(() => null),
          AsyncStorage.getItem(STORAGE_KEYS.LULLABIES).catch(() => null),
          AsyncStorage.getItem(STORAGE_KEYS.SETTINGS).catch(() => null),
        ]);

        if (voiceJson) {
          try {
            const voice: VoiceProfile = JSON.parse(voiceJson);
            dispatch({ type: 'SET_VOICE_PROFILE', payload: voice });
          } catch (e) {
            console.warn('⚠️ Failed to parse voice profile:', e);
          }
        }

        if (childrenJson) {
          try {
            const children: Child[] = JSON.parse(childrenJson);
            dispatch({ type: 'SET_CHILDREN', payload: children });
          } catch (e) {
            console.warn('⚠️ Failed to parse children:', e);
          }
        }

        if (lullabiesJson) {
          try {
            const lullabies: Lullaby[] = JSON.parse(lullabiesJson);
            dispatch({ type: 'SET_LULLABIES', payload: lullabies });
          } catch (e) {
            console.warn('⚠️ Failed to parse lullabies:', e);
          }
        }

        if (settingsJson) {
          try {
            const settings: Settings = JSON.parse(settingsJson);
            dispatch({ type: 'SET_SETTINGS', payload: settings });
          } catch (e) {
            console.warn('⚠️ Failed to parse settings:', e);
          }
        }
      } catch (e) {
        console.error('❌ Hydration error:', e);
      }
    }

    hydrate();
  }, []);

  // Persist voiceProfile (with debouncing to prevent infinite loops)
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      try {
        if (state.voiceProfile) {
          await AsyncStorage.setItem(
            STORAGE_KEYS.VOICE_PROFILE,
            JSON.stringify(state.voiceProfile)
          );
        } else {
          await AsyncStorage.removeItem(STORAGE_KEYS.VOICE_PROFILE);
        }
      } catch (e) {
        console.warn('Failed to save voice profile:', e);
      }
    }, 500); // Debounce 500ms

    return () => clearTimeout(timeoutId);
  }, [state.voiceProfile]);

  // Persist children (with debouncing)
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEYS.CHILDREN,
          JSON.stringify(state.children)
        );
      } catch (e) {
        console.warn('Failed to save children:', e);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [state.children]);

  // Persist lullabies (with debouncing)
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEYS.LULLABIES,
          JSON.stringify(state.lullabies)
        );
      } catch (e) {
        console.warn('Failed to save lullabies:', e);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [state.lullabies]);

  // Persist settings (with debouncing)
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEYS.SETTINGS,
          JSON.stringify(state.settings)
        );
      } catch (e) {
        console.warn('Failed to save settings:', e);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [state.settings]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({ state, dispatch, apiClient }),
    [state, dispatch, apiClient]
  );

  // No loading screen - hydration happens in background
  return (
    <AppStateContext.Provider value={contextValue}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppStateContextType {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
