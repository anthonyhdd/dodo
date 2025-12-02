import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useAppState } from '../state/AppStateContext';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Settings'>;
};

export function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { state, dispatch } = useAppState();
  const [parentName, setParentName] = useState(state.settings.parentName || '');

  const handleParentNameChange = (text: string) => {
    setParentName(text);
    dispatch({
      type: 'SET_SETTINGS',
      payload: { parentName: text.trim() || null },
    });
  };

  const handleVolumeChange = (value: number) => {
    dispatch({
      type: 'SET_SETTINGS',
      payload: { defaultVolume: value },
    });
  };

  const handleLoopToggle = (value: boolean) => {
    dispatch({
      type: 'SET_SETTINGS',
      payload: { loopPlayback: value },
    });
  };

  const handleThemeChange = (theme: 'light' | 'dark') => {
    dispatch({
      type: 'SET_SETTINGS',
      payload: { theme },
    });
  };

  const handleDeleteAllLullabies = () => {
    Alert.alert(
      'Supprimer toutes les comptines',
      'Es-tu sûr de vouloir supprimer toutes tes comptines ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            dispatch({ type: 'SET_LULLABIES', payload: [] });
          },
        },
      ]
    );
  };

  const handleResetVoice = () => {
    Alert.alert(
      'Reconfigurer ma voix',
      'Tu vas devoir réenregistrer ta voix. Toutes tes comptines seront supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Continuer',
          onPress: () => {
            dispatch({ type: 'SET_VOICE_PROFILE', payload: null });
            dispatch({ type: 'RESET_ONBOARDING_RECORDINGS' });
            dispatch({ type: 'SET_LULLABIES', payload: [] });
            navigation.navigate('OnboardingStep1');
          },
        },
      ]
    );
  };

  const handleResetApp = () => {
    Alert.alert(
      'Réinitialiser l\'application',
      'Toutes tes données seront supprimées. Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Tout supprimer',
          style: 'destructive',
          onPress: () => {
            dispatch({ type: 'RESET_APP' });
            navigation.navigate('OnboardingWelcome');
          },
        },
      ]
    );
  };

  const volumePercent = Math.round(state.settings.defaultVolume * 100);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* SECTION 1: Profil */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profil</Text>
          <View style={styles.field}>
            <Text style={styles.label}>Ton prénom</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex : Marie"
              value={parentName}
              onChangeText={handleParentNameChange}
            />
          </View>
        </View>

        {/* SECTION 2: Lecture */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lecture</Text>
          <View style={styles.field}>
            <View style={styles.fieldRow}>
              <Text style={styles.label}>Volume par défaut</Text>
              <Text style={styles.volumeValue}>{volumePercent}%</Text>
            </View>
            <View style={styles.sliderContainer}>
              <TouchableOpacity
                style={[styles.sliderButton, state.settings.defaultVolume === 0 && styles.sliderButtonActive]}
                onPress={() => handleVolumeChange(0)}
              >
                <Text style={styles.sliderButtonText}>0%</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sliderButton, state.settings.defaultVolume === 0.5 && styles.sliderButtonActive]}
                onPress={() => handleVolumeChange(0.5)}
              >
                <Text style={styles.sliderButtonText}>50%</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sliderButton, state.settings.defaultVolume === 1 && styles.sliderButtonActive]}
                onPress={() => handleVolumeChange(1)}
              >
                <Text style={styles.sliderButtonText}>100%</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.field}>
            <View style={styles.fieldRow}>
              <Text style={styles.label}>Lecture en boucle</Text>
              <Switch
                value={state.settings.loopPlayback}
                onValueChange={handleLoopToggle}
              />
            </View>
          </View>
        </View>

        {/* SECTION 3: Apparence */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Apparence</Text>
          <View style={styles.themeContainer}>
            <TouchableOpacity
              style={[
                styles.themeButton,
                state.settings.theme === 'light' && styles.themeButtonActive,
              ]}
              onPress={() => handleThemeChange('light')}
            >
              <Text
                style={[
                  styles.themeButtonText,
                  state.settings.theme === 'light' && styles.themeButtonTextActive,
                ]}
              >
                Clair
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.themeButton,
                state.settings.theme === 'dark' && styles.themeButtonActive,
              ]}
              onPress={() => handleThemeChange('dark')}
            >
              <Text
                style={[
                  styles.themeButtonText,
                  state.settings.theme === 'dark' && styles.themeButtonTextActive,
                ]}
              >
                Sombre
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SECTION 4: Comptines */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comptines</Text>
          <TouchableOpacity
            style={[styles.button, styles.destructiveButton]}
            onPress={handleDeleteAllLullabies}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonText, styles.destructiveButtonText]}>
              Supprimer toutes mes comptines
            </Text>
          </TouchableOpacity>
        </View>

        {/* SECTION 5: Voix */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ma voix</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={handleResetVoice}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Reconfigurer ma voix</Text>
          </TouchableOpacity>
        </View>

        {/* SECTION 6: Réinitialisation totale */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Réinitialiser l'application</Text>
          <TouchableOpacity
            style={[styles.button, styles.destructiveButton]}
            onPress={handleResetApp}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonText, styles.destructiveButtonText]}>
              Tout supprimer et recommencer
            </Text>
          </TouchableOpacity>
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
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
  },
  field: {
    marginBottom: 20,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  volumeValue: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  sliderContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  sliderButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  sliderButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  sliderButtonText: {
    fontSize: 14,
    color: '#333',
  },
  themeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  themeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  themeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  themeButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  themeButtonTextActive: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  destructiveButton: {
    backgroundColor: '#FF3B30',
  },
  destructiveButtonText: {
    color: '#fff',
  },
});

