import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useAppState } from '../state/AppStateContext';
import { Lullaby } from '../types/models';
import { getLullabyStyleLabel } from '../types/models';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export function HomeScreen({ navigation }: Props) {
  const { state, dispatch, apiClient } = useAppState();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = React.useState(false);

  const fetchData = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      setError(null);

      const children = await apiClient.fetchChildren();
      dispatch({ type: 'SET_CHILDREN', payload: children });

      const lullabies = await apiClient.fetchLullabies();
      dispatch({ type: 'SET_LULLABIES', payload: lullabies });

      setIsLoading(false);
      setHasInitiallyLoaded(true);
    } catch (err) {
      console.error('Error fetching data:', err);
      setIsLoading(false);
      setError('fetch_error');
      setHasInitiallyLoaded(true);
    }
  }, [apiClient, dispatch]);

  useFocusEffect(
    useCallback(() => {
      // Only show loading on first load if we don't have data yet
      // Otherwise, refresh silently in background
      const shouldShowLoading = !hasInitiallyLoaded && state.lullabies.length === 0 && state.children.length === 0;
      fetchData(shouldShowLoading);
      
      // Poll for generating lullabies (only if we have generating lullabies)
      const generatingLullabies = state.lullabies.filter(l => l.status === 'generating');
      if (generatingLullabies.length > 0) {
        const pollInterval = setInterval(async () => {
          try {
            // Refresh all generating lullabies
            for (const lullaby of generatingLullabies) {
              try {
                const updated = await apiClient.fetchLullaby(lullaby.id);
                dispatch({ type: 'UPDATE_LULLABY', payload: updated });
              } catch (err) {
                console.error('Error polling lullaby:', err);
              }
            }
          } catch (err) {
            console.error('Error in polling loop:', err);
          }
        }, 3000); // Poll every 3 seconds

        return () => {
          clearInterval(pollInterval);
        };
      }
    }, [fetchData, state.lullabies, state.children.length, hasInitiallyLoaded, apiClient, dispatch])
  );

  const handleRetry = () => {
    fetchData();
  };

  const renderLullabyItem = ({ item }: { item: Lullaby }) => {
    const child = state.children.find(c => c.id === item.childId);
    const childName = child?.name || null;
    const title = childName ? `Comptine pour ${childName}` : 'Comptine';
    const styleLabel = getLullabyStyleLabel(item.style);
    const subtitle = `Style : ${styleLabel} • Durée : ${item.durationMinutes} min`;
    const isGenerating = item.status === 'generating';
    const isFailed = item.status === 'failed';

    return (
      <TouchableOpacity
        style={[
          styles.lullabyCard,
          isGenerating && styles.lullabyCardGenerating,
          isFailed && styles.lullabyCardFailed,
        ]}
        onPress={() => {
          if (isGenerating) {
            // Don't navigate if still generating
            return;
          }
          if (isFailed) {
            // Maybe show error message
            return;
          }
          navigation.navigate('LullabyPlayer', { lullabyId: item.id });
        }}
        activeOpacity={isGenerating || isFailed ? 1 : 0.7}
        disabled={isGenerating || isFailed}
      >
        <View style={styles.lullabyCardContent}>
          <Text style={styles.lullabyTitle}>{title}</Text>
          <Text style={styles.lullabySubtitle}>{subtitle}</Text>
          {isGenerating && (
            <View style={styles.generatingIndicator}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.generatingText}>Génération en cours…</Text>
            </View>
          )}
          {isFailed && (
            <Text style={styles.failedText}>Échec de la génération</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Only show loading on first load when we have no data
  if (isLoading && !hasInitiallyLoaded && state.lullabies.length === 0 && state.children.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
          <Text style={styles.loadingText}>Chargement…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Un problème est survenu.</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={handleRetry}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (state.lullabies.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.emptyTitle}>Tu n'as pas encore de comptine.</Text>
          <Text style={styles.emptySubtitle}>
            Crée ta première en appuyant sur « Nouvelle comptine ».
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('NewLullaby')}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Nouvelle comptine</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tes comptines</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          activeOpacity={0.7}
        >
          <Text style={styles.settingsButton}>Paramètres</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={state.lullabies}
        renderItem={renderLullabyItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('NewLullaby')}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Nouvelle comptine</Text>
        </TouchableOpacity>
      </View>
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
    paddingTop: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
  },
  settingsButton: {
    fontSize: 16,
    color: '#555',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loader: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  lullabyCard: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  lullabyCardGenerating: {
    backgroundColor: '#f0f8ff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  lullabyCardFailed: {
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#FF3B30',
    opacity: 0.7,
  },
  lullabyCardContent: {
    flex: 1,
  },
  lullabyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  lullabySubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  generatingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  generatingText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 8,
    fontStyle: 'italic',
  },
  failedText: {
    fontSize: 14,
    color: '#FF3B30',
    marginTop: 8,
    fontStyle: 'italic',
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
