import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import axios from 'axios';
import he from 'he';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../App';
import showAlert from '../utils/showAlert';
import { strings } from '../constants/strings';
import { colors } from '../styles/theme';
import { layout } from '../styles/commonStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'QuizGame'>;

type Question = {
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
};

const updateQuizHighScore = async (score: number) => {
  const prev = parseInt((await AsyncStorage.getItem('quizHighScore')) || '0', 10);
  if (score > prev) {
    await AsyncStorage.setItem('quizHighScore', String(score));
  }
};

export default function QuizGameScreen({ navigation }: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const loadHighScore = async () => {
    const stored = parseInt((await AsyncStorage.getItem('quizHighScore')) || '0', 10);
    setHighScore(stored);
  };

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('https://opentdb.com/api.php?amount=5&type=multiple');
      setQuestions(response.data.results);
      setCurrentQuestionIndex(0);
      setScore(0);
      setSelectedAnswer(null);
    } catch (err) {
      setError(strings.quiz.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadHighScore();
    void fetchQuestions();
  }, []);

  const currentQuestion = questions[currentQuestionIndex];

  const shuffledAnswers = useMemo(() => {
    if (!currentQuestion) {
      return [];
    }
    return [...currentQuestion.incorrect_answers, currentQuestion.correct_answer].sort(
      () => Math.random() - 0.5,
    );
  }, [currentQuestion]);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
    }
  }, [score, highScore]);

  if (loading) {
    return <ActivityIndicator style={styles.loader} size="large" />;
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchQuestions}>
          <Text style={styles.retryText}>{strings.quiz.retry}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!currentQuestion) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{strings.quiz.error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchQuestions}>
          <Text style={styles.retryText}>{strings.quiz.retry}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const nextQuestion = (latestScore: number) => {
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
    } else {
      void updateQuizHighScore(latestScore);
      showAlert(strings.quiz.finishTitle, strings.quiz.finishMessage(latestScore, questions.length), [
        { text: strings.common.menu, onPress: () => navigation.navigate('Home') },
        { text: strings.common.playAgain, onPress: fetchQuestions },
      ]);
    }
  };

  const checkAnswer = (answer: string) => {
    if (selectedAnswer) {
      return;
    }

    setSelectedAnswer(answer);
    const isCorrect = answer === currentQuestion.correct_answer;
    const updatedScore = score + (isCorrect ? 1 : 0);
    setScore(updatedScore);

    setTimeout(() => {
      nextQuestion(updatedScore);
    }, 1000);
  };

  const getAnswerColor = (answer: string) => {
    if (!selectedAnswer) {
      return colors.quizPrimary;
    }
    if (answer === currentQuestion.correct_answer) {
      return colors.quizCorrect;
    }
    if (answer === selectedAnswer) {
      return colors.quizIncorrect;
    }
    return colors.quizNeutral;
  };

  return (
    <View style={styles.container}>
      <View style={styles.scorecard}>
        <Text style={styles.score}>{strings.quiz.score(score)}</Text>
        <Text style={styles.highScore}>{strings.quiz.highScore(highScore)}</Text>
      </View>
      <Text style={styles.question}>{he.decode(currentQuestion.question)}</Text>
      {shuffledAnswers.map(answer => (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: getAnswerColor(answer) }]}
          key={answer}
          onPress={() => checkAnswer(answer)}
        >
          <Text style={styles.answer}>{he.decode(answer)}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={styles.homeButton} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.homeButtonText}>{strings.common.backToMenu}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...layout.centered, padding: 20 },
  loader: { ...layout.centered },
  centered: { ...layout.centered, padding: 20 },
  question: { fontSize: 20, marginBottom: 20, textAlign: 'center' },
  button: { padding: 15, width: '100%', marginVertical: 5, borderRadius: 10 },
  answer: { fontSize: 16, color: colors.textLight, textAlign: 'center' },
  homeButton: { position: 'absolute', bottom: 30, padding: 12 },
  homeButtonText: { color: colors.textDark, fontSize: 16 },
  scorecard: {
    position: 'absolute',
    top: 40,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  score: { fontSize: 18, fontWeight: 'bold' },
  highScore: { fontSize: 18, fontWeight: 'bold' },
  error: { fontSize: 16, color: colors.quizIncorrect, marginBottom: 16, textAlign: 'center' },
  retryButton: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: colors.quizPrimary, borderRadius: 8 },
  retryText: { color: colors.textLight, fontWeight: '600' },
});
