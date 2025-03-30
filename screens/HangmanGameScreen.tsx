import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, FlatList } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { SafeAreaView } from 'react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'HangmanGame'>;

const words = ['REACT', 'JAVASCRIPT', 'PROGRAMOWANIE', 'ANDROID', 'TYPESCRIPT', 'APLIKACJA'];

const alphabet = 'AĄBCĆDEĘFGHIJKLŁMNŃOÓPRSŚTUWYZŹŻ'.split('');

export default function HangmanGameScreen({ navigation }: Props) {
  const [word, setWord] = useState('');
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [wrongAttempts, setWrongAttempts] = useState(0);

  useEffect(() => {
    startGame();
  }, []);

  const startGame = () => {
    setWord(words[Math.floor(Math.random() * words.length)]);
    setGuessedLetters([]);
    setWrongAttempts(0);
  };

  const guessLetter = (letter: string) => {
    if (guessedLetters.includes(letter)) return;

    setGuessedLetters(prev => [...prev, letter]);

    if (!word.includes(letter)) {
      setWrongAttempts(prev => prev + 1);
      if (wrongAttempts + 1 >= 6) {
        Alert.alert('😢 Przegrałeś!', `Szukane słowo: ${word}`, [
          { text: '🏠 Menu', onPress: () => navigation.navigate('Home') },
          { text: '🔄 Jeszcze raz', onPress: startGame },
        ]);
      }
    } else {
      if (word.split('').every(char => [...guessedLetters, letter].includes(char))) {
        Alert.alert('🎉 Wygrałeś!', `Gratulacje, odgadłeś słowo: ${word}`, [
          { text: '🏠 Menu', onPress: () => navigation.navigate('Home') },
          { text: '🔄 Jeszcze raz', onPress: startGame },
        ]);
      }
    }
  };

  const renderLetter = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[styles.letterButton, { backgroundColor: guessedLetters.includes(item) ? '#bbb' : '#4c8bf5' }]}
      onPress={() => guessLetter(item)}
      disabled={guessedLetters.includes(item) || wrongAttempts >= 6}
    >
      <Text style={styles.letter}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView  style={styles.container}>
      <Text style={styles.title}>Wisielec 👾 ({wrongAttempts}/6)</Text>
      <SafeAreaView  style={styles.wordContainer}>
        {word.split('').map((char, idx) => (
          <Text style={styles.char} key={idx}>
            {guessedLetters.includes(char) ? char : '_'}
          </Text>
        ))}
      </SafeAreaView >
      <FlatList
        contentContainerStyle={styles.alphabet}
        data={alphabet}
        renderItem={renderLetter}
        keyExtractor={(item) => item}
        numColumns={7}
        style={{ flexGrow: 0 }}
      />
      <TouchableOpacity style={styles.homeButton} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.homeButtonText}>🔙 Menu Główne</Text>
      </TouchableOpacity>
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  wordContainer: { flexDirection: 'row', marginBottom: 20 },
  char: { fontSize: 28, marginHorizontal: 5 },
  alphabet: { alignItems: 'center' },
  letterButton: { padding: 10, margin: 4, borderRadius: 5, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  letter: { color: 'white', fontSize: 18 },
  homeButton: { position: 'absolute', bottom: 30, padding: 12 },
  homeButtonText: { color: '#333', fontSize: 16 },
});
