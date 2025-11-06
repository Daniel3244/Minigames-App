import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import showAlert from '../utils/showAlert';
import { strings } from '../constants/strings';
import { colors } from '../styles/theme';
import { layout } from '../styles/commonStyles';

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
    <SafeAreaView style={styles.container}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { ...layout.centered, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  wordContainer: { flexDirection: 'row', marginBottom: 20 },
  char: { fontSize: 28, marginHorizontal: 5 },
  alphabet: { alignItems: 'center' },
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
  letterButtonDisabled: { backgroundColor: '#bbb' },
  letter: { color: colors.textLight, fontSize: 18 },
  homeButton: { position: 'absolute', bottom: 30, padding: 12 },
  homeButtonText: { color: colors.textDark, fontSize: 16 },
});
