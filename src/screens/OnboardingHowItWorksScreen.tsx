import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Animated } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { PrimaryButton } from '../components/PrimaryButton';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'OnboardingHowItWorks'>;
};

export function OnboardingHowItWorksScreen({ navigation }: Props) {
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
          <Text style={styles.title}>Comment ça marche ?</Text>
          <Text style={styles.body}>
            Tu lis 2 ou 3 courtes phrases.{'\n'}
            On apprend ta façon de parler.{'\n'}
            Ensuite, tu peux créer des comptines personnalisées pour ton enfant.
          </Text>
          <Text style={styles.smallText}>
            Ça prend environ 3 minutes (1 minute par étape). Tu peux arrêter à tout moment.
          </Text>
          <PrimaryButton
            label="OK"
            onPress={() => navigation.navigate('OnboardingBeforeStart')}
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
