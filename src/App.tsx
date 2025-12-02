import React, { useMemo, useRef } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AppStateProvider, useAppState } from './state/AppStateContext';
import { RootNavigator } from './navigation/RootNavigator';

function AppNavigator() {
  const { state } = useAppState();
  
  // Store initial route name in a ref - it should only be calculated once
  const initialRouteNameRef = useRef<'Home' | 'OnboardingWelcome' | null>(null);
  
  // Calculate initial route only once on first render
  if (initialRouteNameRef.current === null) {
    initialRouteNameRef.current =
      state.voiceProfile && state.voiceProfile.status === 'ready'
        ? 'Home'
        : 'OnboardingWelcome';
    
    console.log('🧭 AppNavigator - Initial route (calculated once):', initialRouteNameRef.current, {
      hasVoiceProfile: !!state.voiceProfile,
      voiceStatus: state.voiceProfile?.status,
    });
  }

  return <RootNavigator initialRouteName={initialRouteNameRef.current} />;
}

function AppWithNavigation() {
  console.log('🚀 AppWithNavigation rendering');
  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <AppWithNavigation />
    </AppStateProvider>
  );
}
