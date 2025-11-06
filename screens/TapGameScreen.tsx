import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../App';
import showAlert from '../utils/showAlert';
import { strings } from '../constants/strings';
import { colors } from '../styles/theme';
import { layout } from '../styles/commonStyles';

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

  useEffect(() => {
    if (!gameStarted) {
      clearTimer();
      return;
    }

    if (timeLeft === 0) {
      clearTimer();
      const nextHighScore = Math.max(highScore, count);
      setHighScore(nextHighScore);
      void updateTapHighScore(count);
      showAlert(strings.tap.timeUpTitle, strings.tap.timeUpMessage(count), [
        { text: strings.common.menu, onPress: () => navigation.navigate('Home') },
        { text: strings.common.tryAgain, onPress: resetGame },
      ]);
      setGameStarted(false);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return clearTimer;
  }, [gameStarted, timeLeft, count, highScore, navigation, clearTimer, resetGame]);

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
    <View style={styles.container}>
      <Text style={styles.timer}>{strings.tap.time(timeLeft)}</Text>
      <Text style={styles.score}>{strings.tap.taps(count)}</Text>
      <Text style={styles.highScore}>{strings.tap.best(highScore)}</Text>

      <TouchableOpacity
        style={[styles.tapButton, { backgroundColor: gameStarted ? colors.tapActive : colors.tapIdle }]}
        onPress={gameStarted ? handleTap : startGame}
      >
        <Text style={styles.tapText}>{gameStarted ? strings.tap.tap : strings.tap.start}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.homeButton} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.homeButtonText}>{strings.common.backToMenu}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...layout.centered, padding: 20 },
  timer: { fontSize: 22, marginBottom: 10, fontWeight: 'bold' },
  score: { fontSize: 20, marginBottom: 5 },
  highScore: { fontSize: 18, marginBottom: 20, color: '#555' },
  tapButton: { width: '80%', padding: 30, borderRadius: 15, alignItems: 'center' },
  tapText: { color: colors.textLight, fontSize: 24, fontWeight: 'bold' },
  homeButton: { position: 'absolute', bottom: 30, padding: 12 },
  homeButtonText: { color: colors.textDark, fontSize: 16 },
});
