import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useAppState } from '../state/AppStateContext';
import { PrimaryButton } from '../components/PrimaryButton';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'OnboardingProcessing'>;
};

export function OnboardingProcessingScreen({ navigation }: Props) {
  const { state, dispatch, apiClient } = useAppState();
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    processVoiceProfile();

    return () => {
      isMountedRef.current = false;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const processVoiceProfile = async () => {
    try {
      setError(null);

      const { step1Uri, step2Uri, step3Uri } = state.onboardingRecordings;

      if (!step1Uri || !step2Uri || !step3Uri) {
        setError('missing');
        return;
      }

      const profile = await apiClient.createVoiceProfile([step1Uri, step2Uri, step3Uri]);

      if (profile.status === 'ready') {
        if (!isMountedRef.current) return;
        dispatch({ type: 'SET_VOICE_PROFILE', payload: profile });
        navigation.navigate('OnboardingVoiceReady');
        return;
      }

      startPolling(profile.id);
    } catch (err) {
      console.error('Error processing voice profile:', err);
      if (!isMountedRef.current) return;
      setError('processing');
    }
  };

  const startPolling = (profileId: string) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    pollingRef.current = setInterval(async () => {
      try {
        const profile = await apiClient.fetchVoiceProfile(profileId);

        if (profile.status === 'ready') {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }

          if (!isMountedRef.current) return;
          dispatch({ type: 'SET_VOICE_PROFILE', payload: profile });
          navigation.navigate('OnboardingVoiceReady');
        }
      } catch (err) {
        console.error('Error polling voice profile:', err);
        if (!isMountedRef.current) return;
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        setError('processing');
      }
    }, 1500);
  };

  const handleRetry = () => {
    setError(null);
    processVoiceProfile();
  };

  if (error === 'missing') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.centerContent}>
            <Text style={styles.errorText}>
              Un enregistrement est manquant. Tu peux recommencer l'étape.
            </Text>
            <PrimaryButton
              label="Revenir au début"
              onPress={() => navigation.navigate('OnboardingStep1')}
              fullWidth={true}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error === 'processing') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.centerContent}>
            <Text style={styles.errorText}>
              Un problème est survenu. Tu peux réessayer.
            </Text>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={handleRetry}
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" color="#5C6BFF" style={styles.loader} />
        <Text style={styles.title}>On prépare ta voix…</Text>
        <Text style={styles.body}>
          Ça prend quelques secondes.{'\n'}
          Ensuite tu pourras créer ta première comptine.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loader: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
    color: '#111827',
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginBottom: 24,
    textAlign: 'center',
  },
  linkButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  linkText: {
    fontSize: 16,
    color: '#5C6BFF',
    fontWeight: '500',
  },
});
