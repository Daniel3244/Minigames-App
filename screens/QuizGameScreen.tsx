import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import axios from 'axios';
import he from 'he';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../App';
import showAlert from '../utils/showAlert';
import { strings } from '../constants/strings';
import { colors } from '../styles/theme';
import { surfaces } from '../styles/commonStyles';

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

  const renderFallback = (message: string) => (
    <LinearGradient colors={colors.gradient} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.panel}>
          <Text style={styles.error}>{message}</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={fetchQuestions}>
            <Text style={styles.primaryText}>{strings.quiz.retry}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );

  if (loading) {
    return renderFallback(strings.quiz.retry);
  }

  if (error || !currentQuestion) {
    return renderFallback(error ?? strings.quiz.error);
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
    <LinearGradient colors={colors.gradient} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.panel}>
          <View style={styles.scoreRow}>
            <View style={styles.scorePill}>
              <Text style={styles.scoreLabel}>Score</Text>
              <Text style={styles.scoreValue}>{score}</Text>
            </View>
            <View style={styles.scorePill}>
              <Text style={styles.scoreLabel}>Best</Text>
              <Text style={styles.scoreValue}>{highScore}</Text>
            </View>
          </View>
          <Text style={styles.question}>{he.decode(currentQuestion.question)}</Text>
          {shuffledAnswers.map(answer => (
            <TouchableOpacity
              style={[styles.answerButton, { backgroundColor: getAnswerColor(answer) }]}
              key={answer}
              onPress={() => checkAnswer(answer)}
            >
              <Text style={styles.answerText}>{he.decode(answer)}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.primaryText}>{strings.common.backToMenu}</Text>
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
  scoreRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  scorePill: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  scoreLabel: { color: colors.textMuted, fontSize: 12 },
  scoreValue: { color: colors.textLight, fontWeight: '700', fontSize: 22 },
  question: { fontSize: 20, marginBottom: 16, color: colors.textLight, lineHeight: 26 },
  answerButton: {
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 10,
    paddingHorizontal: 12,
  },
  answerText: { fontSize: 16, color: colors.textLight, textAlign: 'center' },
  primaryButton: {
    marginTop: 'auto',
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: colors.quizPrimary,
    alignItems: 'center',
  },
  primaryText: { color: colors.textLight, fontWeight: '700' },
  error: { fontSize: 16, color: colors.quizIncorrect, marginBottom: 16, textAlign: 'center' },
});
