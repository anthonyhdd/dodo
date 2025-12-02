import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Animated, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useAppState } from '../state/AppStateContext';
import { PrimaryButton } from '../components/PrimaryButton';
import { Card } from '../components/Card';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'OnboardingStep3'>;
};

export function OnboardingStep3Screen({ navigation }: Props) {
  const { dispatch } = useAppState();
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (recording) {
        recording.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, [recording]);

  // Start timer when recording starts
  useEffect(() => {
    if (isRecording && !timerRef.current) {
      setElapsedMs(0);
      timerRef.current = setInterval(() => {
        setElapsedMs(prev => {
          const newMs = prev + 100;
          if (newMs >= 60000) {
            // Auto-stop at 60 seconds
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            // Stop recording asynchronously
            if (recording) {
              recording.stopAndUnloadAsync().then(() => {
                const uri = recording.getURI();
                if (uri) {
                  dispatch({ type: 'SET_ONBOARDING_RECORDING_STEP3', payload: { uri } });
                  setHasRecorded(true);
                }
                setRecording(null);
                setIsRecording(false);
              }).catch(() => {});
            }
            return newMs;
          }
          return newMs;
        });
      }, 100);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRecording, recording, dispatch]);

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        setError('permission');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await newRecording.startAsync();

      // Reset timer and set recording state
      setElapsedMs(0);
      setRecording(newRecording);
      setIsRecording(true);
      setError(null);
      // Timer will start automatically via useEffect when isRecording becomes true
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('recording');
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (uri) {
        dispatch({ type: 'SET_ONBOARDING_RECORDING_STEP3', payload: { uri } });
        setHasRecorded(true);
      }

      setRecording(null);
      setIsRecording(false);
    } catch (err) {
      setError('recording');
    }
  };

  if (error === 'permission') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.centerContent}>
            <Text style={styles.errorText}>
              L'accès au micro est nécessaire pour continuer.
            </Text>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => setError(null)}
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.animatedContent,
            {
              opacity,
              transform: [{ translateY }],
            },
          ]}
        >
          <Text style={styles.header}>Étape 3 sur 3</Text>
          <Text style={styles.title}>Comme une petite histoire du soir</Text>
          <Text style={styles.instructions}>
            Lis ce texte comme si tu racontais une petite histoire du soir.
          </Text>
          <Card style={styles.phrasesCard}>
            <Text style={styles.phrases}>
              « La journée est terminée maintenant, mon petit. Tu as bien joué, tu as bien grandi, tu as bien vécu. Maintenant, c'est le moment de se reposer, de se détendre, de se laisser aller au sommeil. Je reste près de toi, je ne pars pas. Je vais rester là toute la nuit, à veiller sur toi, à te protéger. Tu peux fermer les yeux en toute confiance, en toute sérénité. Le sommeil va venir comme une douce vague qui t'emporte, qui te berce, qui te calme. Tu n'as rien à faire, rien à penser, juste à te laisser aller. Je suis là, je suis toujours là, et je vais rester là. La nuit va être douce, le sommeil va être profond, et demain matin tu te réveilleras reposé et heureux. »
            </Text>
          </Card>

          {!hasRecorded && !isRecording && (
            <PrimaryButton
              label="Enregistrer"
              onPress={startRecording}
              fullWidth={true}
            />
          )}

          {isRecording && (
            <>
              <Text style={styles.timer}>{formatTime(elapsedMs)}</Text>
              <Text style={styles.helperText}>Parle comme tu le ferais le soir…</Text>
              <PrimaryButton
                label="Arrêter"
                onPress={stopRecording}
                variant="destructive"
                fullWidth={true}
              />
            </>
          )}

          {hasRecorded && !isRecording && (
            <>
              <Text style={styles.successText}>On a tout ce qu'il nous faut.</Text>
              <PrimaryButton
                label="Continuer"
                onPress={() => navigation.navigate('OnboardingProcessing')}
                fullWidth={true}
              />
            </>
          )}
        </Animated.View>
      </ScrollView>
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
  },
  animatedContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  header: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
    color: '#111827',
  },
  instructions: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  phrasesCard: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 32,
  },
  phrases: {
    fontSize: 18,
    color: '#111827',
    textAlign: 'center',
    lineHeight: 28,
    fontStyle: 'italic',
  },
  timer: {
    fontSize: 48,
    fontWeight: '700',
    color: '#5C6BFF',
    marginBottom: 16,
  },
  helperText: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  successText: {
    fontSize: 18,
    color: '#10B981',
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: '600',
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
