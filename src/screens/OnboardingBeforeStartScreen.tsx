import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Animated } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { PrimaryButton } from '../components/PrimaryButton';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'OnboardingBeforeStart'>;
};

export function OnboardingBeforeStartScreen({ navigation }: Props) {
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
          <Text style={styles.title}>Avant de commencer</Text>
          <Text style={styles.body}>
            Installe-toi dans un endroit calme si possible.{'\n'}
            Lis simplement les phrases à l'écran, on s'occupe du reste.
          </Text>
          <Text style={styles.smallText}>
            Tu pourras refaire ta voix plus tard si tu veux.
          </Text>
          <PrimaryButton
            label="Je suis prêt(e)"
            onPress={() => navigation.navigate('OnboardingStep1')}
            fullWidth={true}
          />
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
    justifyContent: 'center',
  },
  animatedContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
    color: '#111827',
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  smallText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 40,
    textAlign: 'center',
  },
});
