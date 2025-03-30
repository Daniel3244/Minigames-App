import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import AsyncStorage from '@react-native-async-storage/async-storage';

const updateTapHighScore = async (score: number) => {
  const prev = parseInt((await AsyncStorage.getItem('tapHighScore')) || '0');
  if (score > prev) {
    await AsyncStorage.setItem('tapHighScore', score.toString());
  }
};

type Props = NativeStackScreenProps<RootStackParamList, 'TapGame'>;

export default function TapGameScreen({ navigation }: Props) {
  const [count, setCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [gameStarted, setGameStarted] = useState(false);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameStarted && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      if (count > highScore) setHighScore(count);
      updateTapHighScore(count);
      Alert.alert('⏰ Koniec czasu!', `Twój wynik: ${count}`, [
        { text: '🏠 Menu', onPress: () => navigation.navigate('Home') },
        { text: '🔄 Jeszcze raz', onPress: resetGame },
      ]);
      setGameStarted(false);
    }
    return () => clearInterval(timer);
  }, [gameStarted, timeLeft]);

  const startGame = () => {
    setCount(0);
    setTimeLeft(10);
    setGameStarted(true);
  };

  const resetGame = () => {
    setCount(0);
    setTimeLeft(10);
    setGameStarted(false);
  };

  const handleTap = () => {
    if (gameStarted && timeLeft > 0) setCount(count + 1);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.timer}>⏳ Czas: {timeLeft}s</Text>
      <Text style={styles.score}>🔥 Kliknięcia: {count}</Text>
      <Text style={styles.highScore}>🏅 Rekord: {highScore}</Text>

      <TouchableOpacity
        style={[styles.tapButton, { backgroundColor: gameStarted ? '#ff6347' : '#4c8bf5' }]}
        onPress={gameStarted ? handleTap : startGame}
      >
        <Text style={styles.tapText}>{gameStarted ? '⚡ TAP!' : '▶️ Start!'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.homeButton} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.homeButtonText}>🔙 Menu Główne</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  timer: { fontSize: 22, marginBottom: 10, fontWeight: 'bold' },
  score: { fontSize: 20, marginBottom: 5 },
  highScore: { fontSize: 18, marginBottom: 20, color: '#555' },
  tapButton: { width: '80%', padding: 30, borderRadius: 15, alignItems: 'center' },
  tapText: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  homeButton: { position: 'absolute', bottom: 30, padding: 12 },
  homeButtonText: { color: '#333', fontSize: 16 },
});
