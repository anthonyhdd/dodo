import React, { useMemo, useRef } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AppStateProvider, useAppState } from './state/AppStateContext';
import { RootNavigator } from './navigation/RootNavigator';

function AppNavigator() {
  const { state } = useAppState();
  
  // Store initial route name in a ref - it should only be calculated once
  const initialRouteNameRef = useRef<'Home' | 'OnboardingWelcome' | 'TestWorkflow' | null>(null);
  
  // Calculate initial route only once on first render
  // FORCE TestWorkflow for testing
  if (initialRouteNameRef.current === null) {
    initialRouteNameRef.current = 'TestWorkflow';
    
    console.log('🧭 AppNavigator - Initial route (TEST MODE):', initialRouteNameRef.current);
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
