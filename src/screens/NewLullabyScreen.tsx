import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useAppState } from '../state/AppStateContext';
import { LullabyStyle, getLullabyStyleLabel } from '../types/models';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'NewLullaby'>;
};

export function NewLullabyScreen({ navigation }: Props) {
  const { state, dispatch, apiClient } = useAppState();
  const [step, setStep] = useState(1);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<LullabyStyle | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [showAddChildForm, setShowAddChildForm] = useState(false);
  const [childName, setChildName] = useState('');
  const [childAgeMonths, setChildAgeMonths] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLullabyId, setCurrentLullabyId] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (step === 5 && currentLullabyId) {
      // Start polling - continue even if user navigates away
      pollingRef.current = setInterval(async () => {
        try {
          const updated = await apiClient.fetchLullaby(currentLullabyId);
          dispatch({ type: 'UPDATE_LULLABY', payload: updated });

          if (updated.status === 'ready') {
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
            // Only navigate if we're still on this screen
            // Otherwise, the update will be visible on Home screen
            const currentRoute = navigation.getState()?.routes[navigation.getState()?.index || 0];
            if (currentRoute?.name === 'NewLullaby') {
              navigation.navigate('Home');
            }
          } else if (updated.status === 'failed') {
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
            setError('polling');
          }
        } catch (err) {
          console.error('Error polling lullaby:', err);
          // Don't stop polling on error, just log it
          // The user can retry manually if needed
        }
      }, 3000); // Poll every 3 seconds
    }

    // Cleanup on unmount
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [step, currentLullabyId, apiClient, dispatch, navigation]);

  const handleCreateChild = async () => {
    if (!childName.trim()) return;

    try {
      const ageMonths = childAgeMonths ? parseInt(childAgeMonths, 10) : undefined;
      const child = await apiClient.createChild(childName.trim(), ageMonths);
      dispatch({ type: 'ADD_CHILD', payload: child });
      setSelectedChildId(child.id);
      setShowAddChildForm(false);
      setChildName('');
      setChildAgeMonths('');
    } catch (err) {
      setError('create_child');
    }
  };

  const handleGenerate = async () => {
    if (!state.voiceProfile || !selectedChildId || !selectedStyle || !selectedDuration) return;

    try {
      setIsLoading(true);
      setError(null);

      const lullaby = await apiClient.createLullaby({
        childId: selectedChildId,
        voiceProfileId: state.voiceProfile.id,
        style: selectedStyle,
        durationMinutes: selectedDuration,
        languageCode: 'fr',
      });

      dispatch({ type: 'ADD_LULLABY', payload: lullaby });
      setCurrentLullabyId(lullaby.id);
      setStep(5);
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      setError('create_lullaby');
    }
  };

  const handleRetry = () => {
    setError(null);
    if (step === 5) {
      if (currentLullabyId) {
        setStep(5);
      } else {
        handleGenerate();
      }
    } else {
      handleGenerate();
    }
  };

  // Step 1: Choose/Create Child
  if (step === 1) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Pour quel enfant ?</Text>

          {state.children.length === 0 || showAddChildForm ? (
            <View style={styles.form}>
              <Text style={styles.label}>Prénom de l'enfant</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex : Léa"
                value={childName}
                onChangeText={setChildName}
              />
              <Text style={styles.label}>Âge (en mois)</Text>
              <TextInput
                style={styles.input}
                placeholder="Optionnel"
                value={childAgeMonths}
                onChangeText={setChildAgeMonths}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={styles.button}
                onPress={handleCreateChild}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {state.children.map((child) => (
                <TouchableOpacity
                  key={child.id}
                  style={[
                    styles.childOption,
                    selectedChildId === child.id && styles.childOptionSelected,
                  ]}
                  onPress={() => setSelectedChildId(child.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.childOptionText}>
                    {child.name}
                    {child.ageMonths ? ` (${child.ageMonths} mois)` : ''}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setShowAddChildForm(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>Ajouter un enfant</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={[styles.button, !selectedChildId && styles.buttonDisabled]}
            onPress={() => setStep(2)}
            disabled={!selectedChildId}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Continuer</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Step 2: Choose Style
  if (step === 2) {
    const styles_list: { label: string; value: LullabyStyle }[] = [
      { label: 'Douce et lente', value: 'soft' },
      { label: 'Joyeuse et rassurante', value: 'joyful' },
      { label: 'Plus parlée que chantée', value: 'spoken' },
      { label: 'Plus mélodique', value: 'melodic' },
    ];

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Quel style de comptine ?</Text>

          {styles_list.map((s) => (
            <TouchableOpacity
              key={s.value}
              style={[
                styles.styleOption,
                selectedStyle === s.value && styles.styleOptionSelected,
              ]}
              onPress={() => setSelectedStyle(s.value)}
              activeOpacity={0.7}
            >
              <Text style={styles.styleOptionText}>{s.label}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[styles.button, !selectedStyle && styles.buttonDisabled]}
            onPress={() => setStep(3)}
            disabled={!selectedStyle}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Continuer</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Step 3: Duration & Language
  if (step === 3) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Tu préfères une comptine de…</Text>

          {[5, 10, 15].map((duration) => (
            <TouchableOpacity
              key={duration}
              style={[
                styles.durationOption,
                selectedDuration === duration && styles.durationOptionSelected,
              ]}
              onPress={() => setSelectedDuration(duration)}
              activeOpacity={0.7}
            >
              <Text style={styles.durationOptionText}>{duration} minutes</Text>
            </TouchableOpacity>
          ))}

          <Text style={styles.languageText}>Langue : Français</Text>

          <TouchableOpacity
            style={[styles.button, !selectedDuration && styles.buttonDisabled]}
            onPress={() => setStep(4)}
            disabled={!selectedDuration}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Continuer</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Step 4: Summary
  if (step === 4) {
    const child = state.children.find((c) => c.id === selectedChildId);
    const styleLabel = selectedStyle ? getLullabyStyleLabel(selectedStyle) : '';

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>On récapitule</Text>

          <View style={styles.summaryContainer}>
            <Text style={styles.summaryText}>Enfant : {child?.name || ''}</Text>
            <Text style={styles.summaryText}>Style : {styleLabel}</Text>
            <Text style={styles.summaryText}>Durée : {selectedDuration} minutes</Text>
            <Text style={styles.summaryText}>Langue : Français</Text>
          </View>

          {error === 'create_lullaby' && (
            <Text style={styles.errorText}>
              Un problème est survenu. Tu peux réessayer.
            </Text>
          )}

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleGenerate}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Générer la comptine</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Step 5: Generating
  if (step === 5) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
          <Text style={styles.title}>On génère ta comptine…</Text>
          <Text style={styles.body}>Ça peut prendre quelques instants.</Text>
          <Text style={styles.body}>Tu peux retourner au Home, on te préviendra quand c'est prêt.</Text>

          {error === 'polling' && (
            <>
              <Text style={styles.errorText}>
                Un problème est survenu pendant la création de la comptine.
              </Text>
              <TouchableOpacity
                style={styles.button}
                onPress={handleRetry}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>Réessayer</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              // Continue polling in background, but navigate to Home
              navigation.navigate('Home');
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Retour au Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    marginBottom: 32,
    textAlign: 'center',
  },
  body: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  form: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  childOption: {
    padding: 16,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 12,
  },
  childOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  childOptionText: {
    fontSize: 18,
  },
  styleOption: {
    padding: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 12,
    marginBottom: 12,
  },
  styleOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  styleOptionText: {
    fontSize: 18,
    textAlign: 'center',
  },
  durationOption: {
    padding: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 12,
    marginBottom: 12,
  },
  durationOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  durationOptionText: {
    fontSize: 18,
    textAlign: 'center',
  },
  languageText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  summaryContainer: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 12,
    marginBottom: 32,
  },
  summaryText: {
    fontSize: 18,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: '500',
  },
  loader: {
    marginBottom: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
});

