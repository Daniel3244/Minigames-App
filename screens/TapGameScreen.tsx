import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../App';
import showAlert from '../utils/showAlert';
import { strings } from '../constants/strings';
import { colors } from '../styles/theme';
import { surfaces } from '../styles/commonStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'TapGame'>;

const updateTapHighScore = async (score: number) => {
  const prev = parseInt((await AsyncStorage.getItem('tapHighScore')) || '0', 10);
  if (score > prev) {
    await AsyncStorage.setItem('tapHighScore', String(score));
  }
};

const gameDuration = 10;

export default function TapGameScreen({ navigation }: Props) {
  const [count, setCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(gameDuration);
  const [gameStarted, setGameStarted] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetGame = useCallback(() => {
    clearTimer();
    setCount(0);
    setTimeLeft(gameDuration);
    setGameStarted(false);
  }, [clearTimer]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        resetGame();
      };
    }, [resetGame]),
  );

  const endGame = useCallback(
    (finalScore: number) => {
      clearTimer();
      setGameStarted(false);
      void updateTapHighScore(finalScore);
      setHighScore(prev => Math.max(prev, finalScore));
      showAlert(strings.tap.timeUpTitle, strings.tap.timeUpMessage(finalScore), [
        { text: strings.common.menu, onPress: () => navigation.navigate('Home') },
        { text: strings.common.tryAgain, onPress: resetGame },
      ]);
    },
    [clearTimer, navigation, resetGame],
  );

  useEffect(() => {
    if (!gameStarted) {
      clearTimer();
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return clearTimer;
  }, [gameStarted, clearTimer]);

  useEffect(() => {
    if (!gameStarted || timeLeft > 0) {
      return;
    }
    endGame(count);
  }, [gameStarted, timeLeft, count, endGame]);

  const startGame = useCallback(() => {
    clearTimer();
    setCount(0);
    setTimeLeft(gameDuration);
    setGameStarted(true);
  }, [clearTimer]);

  const handleTap = () => {
    if (gameStarted && timeLeft > 0) {
      setCount(prev => prev + 1);
    }
  };

  return (
    <LinearGradient colors={colors.gradient} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.panel}>
          <Text style={styles.title}>Tap Challenge</Text>
          <Text style={styles.subtitle}>Beat your previous streak in {gameDuration} seconds.</Text>
          <View style={styles.metrics}>
            <View style={styles.metricPill}>
              <Text style={styles.metricLabel}>Timer</Text>
              <Text style={styles.metricValue}>{timeLeft}s</Text>
            </View>
            <View style={styles.metricPill}>
              <Text style={styles.metricLabel}>Score</Text>
              <Text style={styles.metricValue}>{count}</Text>
            </View>
            <View style={styles.metricPill}>
              <Text style={styles.metricLabel}>Best</Text>
              <Text style={styles.metricValue}>{highScore}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.tapButton,
              { backgroundColor: gameStarted ? colors.tapActive : colors.tapIdle },
            ]}
            onPress={gameStarted ? handleTap : startGame}
          >
            <Text style={styles.tapText}>{gameStarted ? strings.tap.tap : strings.tap.start}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.homeButton} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.homeButtonText}>{strings.common.backToMenu}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1, padding: 20 },
  panel: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 24,
    ...surfaces.roundedCard,
    borderWidth: 0,
    alignItems: 'center',
  },
  title: { fontSize: 28, fontWeight: '800', color: colors.textLight, marginBottom: 6 },
  subtitle: { color: colors.textMuted, textAlign: 'center', marginBottom: 20 },
  metrics: { flexDirection: 'row', gap: 12, marginBottom: 30, width: '100%' },
  metricPill: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  metricLabel: { color: colors.textMuted, fontSize: 12 },
  metricValue: { color: colors.textLight, fontSize: 22, fontWeight: '700' },
  tapButton: { width: '100%', padding: 32, borderRadius: 24, alignItems: 'center', marginBottom: 30 },
  tapText: { color: colors.textLight, fontSize: 24, fontWeight: 'bold' },
  homeButton: {
    marginTop: 'auto',
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: colors.textLight,
    width: '100%',
    alignItems: 'center',
  },
  homeButtonText: { color: colors.textDark, fontSize: 16, fontWeight: '600' },
});
