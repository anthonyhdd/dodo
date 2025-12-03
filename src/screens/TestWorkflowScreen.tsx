import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Audio } from 'expo-av';
import { useAppState } from '../state/AppStateContext';
import { Lullaby } from '../types/models';

export function TestWorkflowScreen() {
  const { state, dispatch } = useAppState();
  const [isCloning, setIsCloning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const [cloneStatus, setCloneStatus] = useState<string>('');
  const [generateStatus, setGenerateStatus] = useState<string>('');
  const [hasAutoCloned, setHasAutoCloned] = useState(false);
  
  // Audio player state
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingLullabyId, setPlayingLullabyId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Load saved Voice ID or auto-clone on mount
  useEffect(() => {
    const loadSavedVoiceId = async () => {
      try {
        const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL || 'http://192.168.1.155:4000'}/api/test/upload-and-clone`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.voiceId) {
            console.log('✅ Voice ID loaded:', data.voiceId, data.fromCache ? '(from cache)' : '(newly created)');
            setVoiceId(data.voiceId);
            if (data.fromCache) {
              setCloneStatus('✅ Voice ID chargé depuis la sauvegarde (voice existante)');
            } else {
              setCloneStatus('✅ Voix clonée avec succès sur ElevenLabs!');
            }
            setHasAutoCloned(true);
          }
        } else {
          const fallbackResponse = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL || 'http://192.168.1.155:4000'}/api/test/saved-voice-id`);
          const fallbackData = await fallbackResponse.json();
          
          if (fallbackData.success && fallbackData.voiceId) {
            console.log('✅ Found saved Voice ID (fallback):', fallbackData.voiceId);
            setVoiceId(fallbackData.voiceId);
            setCloneStatus('✅ Voice ID chargé depuis la sauvegarde');
            setHasAutoCloned(true);
          }
        }
      } catch (error: any) {
        console.error('Error loading Voice ID:', error);
        setCloneStatus('⚠️ Erreur lors du chargement du Voice ID');
      }
    };
    
    loadSavedVoiceId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync().catch(() => {});
      }
    };
  }, [sound]);

  const handleGenerateLullaby = async () => {
    if (!voiceId) {
      Alert.alert('Erreur', 'Veuillez d\'abord cloner une voix');
      return;
    }

    try {
      setIsGenerating(true);
      setGenerateStatus('Génération de la comptine via Suno...');

      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL || 'http://192.168.1.155:4000'}/api/test/generate-lullaby`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voiceId,
          prompt: 'Une douce berceuse pour endormir un enfant, avec une mélodie apaisante et des paroles tendres',
          style: 'soft',
          durationMinutes: 2,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Create a lullaby object and save it to state
      const newLullaby: Lullaby = {
        id: data.songId || `lullaby-${Date.now()}`,
        childId: state.children[0]?.id || 'default-child',
        voiceProfileId: voiceId,
        title: 'Comptine générée',
        style: 'soft',
        durationMinutes: 2,
        languageCode: 'fr',
        status: data.audioUrl ? 'ready' : 'generating',
        audioUrl: data.audioUrl || undefined,
        createdAt: new Date().toISOString(),
      };

      // Save to state (will be persisted automatically)
      dispatch({ type: 'ADD_LULLABY', payload: newLullaby });
      
      setGenerateStatus('✅ Comptine générée avec succès!');
      Alert.alert('Succès', 'Comptine générée avec succès via Suno!');
    } catch (error: any) {
      console.error('Error generating lullaby:', error);
      setGenerateStatus(`❌ Erreur: ${error.message}`);
      Alert.alert('Erreur', `Impossible de générer la comptine: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayPause = async (lullaby: Lullaby) => {
    if (!lullaby.audioUrl) {
      Alert.alert('Erreur', 'URL audio non disponible');
      return;
    }

    try {
      // If playing a different lullaby, stop current and load new
      if (playingLullabyId !== lullaby.id && sound) {
        await sound.unloadAsync();
        setSound(null);
        setIsPlaying(false);
      }

      if (playingLullabyId === lullaby.id && sound) {
        // Toggle play/pause for current lullaby
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      } else {
        // Load and play new lullaby
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          playsInSilentModeIOS: true,
        });

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: lullaby.audioUrl },
          { shouldPlay: true }
        );

        setSound(newSound);
        setPlayingLullabyId(lullaby.id);
        setIsPlaying(true);

        // Handle playback finish
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
          }
        });
      }
    } catch (error: any) {
      console.error('Error playing audio:', error);
      Alert.alert('Erreur', `Impossible de jouer la comptine: ${error.message}`);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Test Workflow</Text>
        <Text style={styles.subtitle}>
          MP3 → ElevenLabs Voice Cloning → Suno Lullaby Generation
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Étape 1: Cloner la voix (automatique)</Text>
          {isCloning ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.status}>{cloneStatus || 'Clonage en cours...'}</Text>
            </View>
          ) : null}
          {cloneStatus && !isCloning ? (
            <Text style={styles.status}>{cloneStatus}</Text>
          ) : null}
          {voiceId ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>✅ Voice ID: {voiceId}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Étape 2: Générer une comptine</Text>
          <TouchableOpacity
            style={[
              styles.button,
              (!voiceId || isGenerating) && styles.buttonDisabled,
            ]}
            onPress={handleGenerateLullaby}
            disabled={!voiceId || isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Générer comptine via Suno</Text>
            )}
          </TouchableOpacity>
          {generateStatus ? (
            <Text style={styles.status}>{generateStatus}</Text>
          ) : null}
        </View>

        {/* Display saved lullabies */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comptines générées ({state.lullabies.length})</Text>
          {state.lullabies.length === 0 ? (
            <Text style={styles.emptyText}>Aucune comptine générée pour le moment</Text>
          ) : (
            state.lullabies.map((lullaby) => (
              <View key={lullaby.id} style={styles.lullabyCard}>
                <View style={styles.lullabyHeader}>
                  <Text style={styles.lullabyTitle}>{lullaby.title}</Text>
                  <Text style={styles.lullabyDate}>{formatDate(lullaby.createdAt)}</Text>
                </View>
                <View style={styles.lullabyInfo}>
                  <Text style={styles.lullabyInfoText}>Style: {lullaby.style}</Text>
                  <Text style={styles.lullabyInfoText}>Durée: {lullaby.durationMinutes} min</Text>
                  <Text style={styles.lullabyInfoText}>
                    Status: {lullaby.status === 'ready' ? '✅ Prête' : lullaby.status === 'generating' ? '⏳ En cours...' : '❌ Erreur'}
                  </Text>
                </View>
                {lullaby.audioUrl && lullaby.status === 'ready' ? (
                  <TouchableOpacity
                    style={[
                      styles.playButton,
                      playingLullabyId === lullaby.id && isPlaying && styles.playButtonActive,
                    ]}
                    onPress={() => handlePlayPause(lullaby)}
                  >
                    <Text style={styles.playButtonText}>
                      {playingLullabyId === lullaby.id && isPlaying ? '⏸ Pause' : '▶️ Jouer'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.waitingText}>
                    {lullaby.status === 'generating' ? '⏳ Génération en cours...' : '❌ Non disponible'}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  status: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
  },
  successBox: {
    backgroundColor: '#d4edda',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  successText: {
    color: '#155724',
    fontSize: 14,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  lullabyCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  lullabyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  lullabyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  lullabyDate: {
    fontSize: 12,
    color: '#666',
  },
  lullabyInfo: {
    marginBottom: 12,
  },
  lullabyInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  playButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  playButtonActive: {
    backgroundColor: '#FF3B30',
  },
  playButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  waitingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    padding: 12,
    fontStyle: 'italic',
  },
});
