import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { useAppState } from '../state/AppStateContext';
import { RootStackParamList } from '../navigation/RootNavigator';
import { getLullabyStyleLabel } from '../types/models';

export function LullabyPlayerScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'LullabyPlayer'>>();
  const navigation = useNavigation();
  const { lullabyId } = route.params;
  const { state } = useAppState();
  const lullaby = state.lullabies.find((l) => l.id === lullabyId);

  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [positionMs, setPositionMs] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  function formatTime(ms: number | null): string {
    if (ms == null) return '--:--';
    const totalSec = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  useEffect(() => {
    let isMounted = true;
    let soundObj: Audio.Sound | null = null;

    async function load() {
      if (!lullaby?.audioUrl) {
        console.warn('⚠️ No audioUrl for lullaby:', lullaby?.id);
        if (isMounted) {
          setError('Aucune URL audio disponible pour cette comptine.');
          setIsLoading(false);
        }
        return;
      }

      console.log('🎵 Loading audio from URL:', lullaby.audioUrl);

      // First, verify the URL is accessible
      try {
        console.log('🔍 Testing audio URL accessibility...');
        const testResponse = await fetch(lullaby.audioUrl, { method: 'HEAD' });
        console.log('✅ URL test response status:', testResponse.status);
        if (!testResponse.ok) {
          throw new Error(`URL returned status ${testResponse.status}`);
        }
      } catch (urlError: any) {
        console.error('❌ URL test failed:', urlError);
        if (isMounted) {
          setError(`L'URL audio n'est pas accessible. Vérifiez que le fichier existe dans Supabase Storage.`);
          setIsLoading(false);
        }
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          playsInSilentModeIOS: true,
        });

        console.log('🎵 Creating sound from URI...');
        const { sound, status } = await Audio.Sound.createAsync(
          { uri: lullaby.audioUrl },
          { shouldPlay: false },
          (status) => {
            if (!isMounted) return;
            if (status.isLoaded) {
              setDurationMs(status.durationMillis ?? null);
              setPositionMs(status.positionMillis ?? 0);
              setIsPlaying(status.isPlaying);
            } else if (status.error) {
              console.error('❌ Sound status error:', status.error);
            }
          }
        );

        console.log('✅ Sound created, status:', status.isLoaded ? 'loaded' : 'not loaded');

        soundObj = sound;
        setSound(sound);

        if (status.isLoaded) {
          setDurationMs(status.durationMillis ?? null);
          setPositionMs(status.positionMillis ?? 0);
          console.log('✅ Audio loaded successfully, duration:', status.durationMillis, 'ms');
        } else {
          console.warn('⚠️ Sound created but not loaded, status:', status);
        }

        setIsLoading(false);
      } catch (e: any) {
        console.error('❌ Error loading audio:', e);
        console.error('❌ Error details:', e.message, e.stack);
        if (isMounted) {
          const errorMessage = e?.message?.includes('Network') 
            ? 'Impossible de charger la comptine. Vérifiez votre connexion internet.'
            : e?.message || 'Un problème est survenu lors du chargement de la comptine.';
          setError(errorMessage);
          setIsLoading(false);
        }
      }
    }

    if (lullaby?.audioUrl && lullaby.status === 'ready') {
      load();
    } else if (lullaby && lullaby.status === 'ready' && !lullaby.audioUrl) {
      console.warn('⚠️ Lullaby is ready but has no audioUrl:', lullaby.id);
      if (isMounted) {
        setError('La comptine est prête mais l\'URL audio est manquante.');
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
      if (soundObj) {
        soundObj.unloadAsync().catch(() => {});
      }
    };
  }, [lullaby?.audioUrl, lullaby?.status]);

  const handlePlayPause = useCallback(async () => {
    if (!sound) return;

    try {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    } catch (e) {
      setError('Un problème est survenu pendant la lecture.');
    }
  }, [sound, isPlaying]);

  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    if (sound) {
      sound.unloadAsync().then(() => {
        setSound(null);
        // Reload will happen via useEffect
      });
    }
  }, [sound]);

  if (!lullaby) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Comptine introuvable.</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (lullaby.status !== 'ready' || !lullaby.audioUrl) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>← Retour</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
          <Text style={styles.title}>Comptine en cours de préparation…</Text>
          <Text style={styles.body}>Reviens dans un instant.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const child = state.children.find((c) => c.id === lullaby.childId);
  const childName = child?.name ?? '';
  const title = childName ? `Comptine pour ${childName}` : 'Comptine';
  const progress = durationMs ? positionMs / durationMs : 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{title}</Text>

        <View style={styles.metadataContainer}>
          <Text style={styles.metadataText}>
            Style : {getLullabyStyleLabel(lullaby.style)}
          </Text>
          <Text style={styles.metadataText}>
            Durée : {lullaby.durationMinutes} minutes
          </Text>
          <Text style={styles.metadataText}>
            Créée le : {formatDate(lullaby.createdAt)}
          </Text>
        </View>

        {isLoading && (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
            <Text style={styles.loadingText}>Chargement de la comptine…</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={handleRetry}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isLoading && !error && sound && (
          <View style={styles.playerContainer}>
            <TouchableOpacity
              style={styles.playButton}
              onPress={handlePlayPause}
              activeOpacity={0.8}
            >
              <Text style={styles.playButtonText}>
                {isPlaying ? 'Mettre en pause' : 'Lancer la comptine'}
              </Text>
            </TouchableOpacity>

            <View style={styles.progressContainer}>
              <Text style={styles.timeText}>
                {formatTime(positionMs)} / {formatTime(durationMs)}
              </Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  body: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  metadataContainer: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 12,
    marginBottom: 32,
  },
  metadataText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  loader: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  errorContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
  },
  playerContainer: {
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: '#007AFF',
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#e5e5e5',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

