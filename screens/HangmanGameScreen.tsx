import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../App';
import showAlert from '../utils/showAlert';
import { strings } from '../constants/strings';
import { colors } from '../styles/theme';
import { surfaces } from '../styles/commonStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'HangmanGame'>;

const words = ['REACT', 'JAVASCRIPT', 'PROGRAMMING', 'ANDROID', 'TYPESCRIPT', 'APPLICATION'];
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const maxAttempts = 6;

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

  const handleWin = () => {
    showAlert(strings.hangman.winTitle, strings.hangman.winMessage(word), [
      { text: strings.common.menu, onPress: () => navigation.navigate('Home') },
      { text: strings.common.playAgain, onPress: startGame },
    ]);
  };

  const handleLoss = () => {
    showAlert(strings.hangman.loseTitle, strings.hangman.loseMessage(word), [
      { text: strings.common.menu, onPress: () => navigation.navigate('Home') },
      { text: strings.common.tryAgain, onPress: startGame },
    ]);
  };

  const guessLetter = (letter: string) => {
    if (guessedLetters.includes(letter) || wrongAttempts >= maxAttempts) {
      return;
    }

    const updatedGuessed = [...guessedLetters, letter];
    setGuessedLetters(updatedGuessed);

    if (word.includes(letter)) {
      const solved = word.split('').every(char => updatedGuessed.includes(char));
      if (solved) {
        handleWin();
      }
    } else {
      setWrongAttempts(prev => {
        const next = prev + 1;
        if (next >= maxAttempts) {
          handleLoss();
        }
        return next;
      });
    }
  };

  const renderLetter = ({ item }: { item: string }) => {
    const alreadyPicked = guessedLetters.includes(item);
    return (
      <TouchableOpacity
        style={[
          styles.letterButton,
          alreadyPicked ? styles.letterButtonDisabled : styles.letterButtonActive,
        ]}
        onPress={() => guessLetter(item)}
        disabled={alreadyPicked || wrongAttempts >= maxAttempts}
      >
        <Text style={styles.letter}>{item}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={colors.gradient} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.panel}>
          <Text style={styles.title}>{strings.hangman.title(wrongAttempts, maxAttempts)}</Text>
          <View style={styles.wordContainer}>
            {word.split('').map((char, idx) => (
              <Text style={styles.char} key={idx}>
                {guessedLetters.includes(char) ? char : '_'}
              </Text>
            ))}
          </View>
          <FlatList
            contentContainerStyle={styles.alphabet}
            data={alphabet}
            renderItem={renderLetter}
            keyExtractor={item => item}
            numColumns={7}
            style={styles.alphabetList}
          />
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
    padding: 20,
    ...surfaces.roundedCard,
    borderWidth: 0,
  },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: colors.textLight },
  wordContainer: { flexDirection: 'row', marginBottom: 20, justifyContent: 'center', gap: 8 },
  char: { fontSize: 28, color: colors.textLight },
  alphabet: { alignItems: 'center', paddingBottom: 80 },
  alphabetList: { flexGrow: 0 },
  letterButton: {
    padding: 10,
    margin: 4,
    borderRadius: 5,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterButtonActive: { backgroundColor: colors.quizPrimary },
  letterButtonDisabled: { backgroundColor: colors.border },
  letter: { color: colors.textLight, fontSize: 18 },
  homeButton: {
    marginTop: 'auto',
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
  homeButtonText: { color: colors.textLight, fontSize: 16, fontWeight: '600' },
});
