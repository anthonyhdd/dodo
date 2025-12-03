import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingWelcomeScreen } from '../screens/OnboardingWelcomeScreen';
import { OnboardingHowItWorksScreen } from '../screens/OnboardingHowItWorksScreen';
import { OnboardingBeforeStartScreen } from '../screens/OnboardingBeforeStartScreen';
import { OnboardingStep1Screen } from '../screens/OnboardingStep1Screen';
import { OnboardingStep2Screen } from '../screens/OnboardingStep2Screen';
import { OnboardingStep3Screen } from '../screens/OnboardingStep3Screen';
import { OnboardingProcessingScreen } from '../screens/OnboardingProcessingScreen';
import { OnboardingVoiceReadyScreen } from '../screens/OnboardingVoiceReadyScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { NewLullabyScreen } from '../screens/NewLullabyScreen';
import { LullabyPlayerScreen } from '../screens/LullabyPlayerScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { TestWorkflowScreen } from '../screens/TestWorkflowScreen';

export type RootStackParamList = {
  OnboardingWelcome: undefined;
  OnboardingHowItWorks: undefined;
  OnboardingBeforeStart: undefined;
  OnboardingStep1: undefined;
  OnboardingStep2: undefined;
  OnboardingStep3: undefined;
  OnboardingProcessing: undefined;
  OnboardingVoiceReady: undefined;
  Home: undefined;
  NewLullaby: undefined;
  TestWorkflow: undefined;
  LullabyPlayer: { lullabyId: string };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

type RootNavigatorProps = {
  initialRouteName?: 'Home' | 'OnboardingWelcome' | 'TestWorkflow';
};

export function RootNavigator({ initialRouteName = 'OnboardingWelcome' }: RootNavigatorProps) {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="OnboardingWelcome" component={OnboardingWelcomeScreen} />
      <Stack.Screen name="OnboardingHowItWorks" component={OnboardingHowItWorksScreen} />
      <Stack.Screen name="OnboardingBeforeStart" component={OnboardingBeforeStartScreen} />
      <Stack.Screen name="OnboardingStep1" component={OnboardingStep1Screen} />
      <Stack.Screen name="OnboardingStep2" component={OnboardingStep2Screen} />
      <Stack.Screen name="OnboardingStep3" component={OnboardingStep3Screen} />
      <Stack.Screen name="OnboardingProcessing" component={OnboardingProcessingScreen} />
      <Stack.Screen name="OnboardingVoiceReady" component={OnboardingVoiceReadyScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="NewLullaby" component={NewLullabyScreen} />
      <Stack.Screen
        name="LullabyPlayer"
        component={LullabyPlayerScreen}
        options={{ title: 'Comptine' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Paramètres' }}
      />
      <Stack.Screen name="TestWorkflow" component={TestWorkflowScreen} />
    </Stack.Navigator>
  );
}
