import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import he from 'he';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import AsyncStorage from '@react-native-async-storage/async-storage';

const updateQuizHighScore = async (score: number) => {
  const prev = parseInt((await AsyncStorage.getItem('quizHighScore')) || '0');
  if (score > prev) {
    await AsyncStorage.setItem('quizHighScore', score.toString());
  }
};

type Props = NativeStackScreenProps<RootStackParamList, 'QuizGame'>;

interface Question {
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

export default function QuizGameScreen({ navigation }: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const fetchQuestions = () => {
    setLoading(true);
    axios.get('https://opentdb.com/api.php?amount=5&type=multiple').then(res => {
      setQuestions(res.data.results);
      setCurrentQuestionIndex(0);
      setScore(0);
      setSelectedAnswer(null);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;

  const currentQuestion = questions[currentQuestionIndex];
  const answers = [...currentQuestion.incorrect_answers, currentQuestion.correct_answer].sort();

  const checkAnswer = (answer: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(answer);
    const isCorrect = answer === currentQuestion.correct_answer;
    if (isCorrect) setScore(score + 1);

    setTimeout(() => {
      if (currentQuestionIndex + 1 < questions.length) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer(null);
      } else {
        const finalScore = score + (isCorrect ? 1 : 0);
        if (finalScore > highScore) setHighScore(finalScore);
        updateQuizHighScore(finalScore);
        Alert.alert('🏆 Koniec gry!', `Twój wynik: ${finalScore} / ${questions.length}`, [
          { text: '🏠 Menu', onPress: () => navigation.navigate('Home') },
          { text: '🔄 Zagraj jeszcze raz', onPress: fetchQuestions },
        ]);
      }
    }, 1200);
  };

  const getAnswerColor = (answer: string) => {
    if (!selectedAnswer) return '#4c8bf5';
    if (answer === currentQuestion.correct_answer) return '#4CAF50';
    if (answer === selectedAnswer && answer !== currentQuestion.correct_answer) return '#f44336';
    return '#ddd';
  };

  return (
    <View style={styles.container}>
      <View style={styles.scorecard}>
        <Text style={styles.score}>🔥 Score: {score}</Text>
        <Text style={styles.highScore}>🏅 Highest Score: {highScore}</Text>
      </View>
      <Text style={styles.question}>{he.decode(currentQuestion.question)}</Text>
      {answers.map((answer, index) => (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: getAnswerColor(answer) }]}
          key={index}
          onPress={() => checkAnswer(answer)}
        >
          <Text style={styles.answer}>{he.decode(answer)}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={styles.homeButton} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.homeButtonText}>🔙 Back to Menu</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' },
  question: { fontSize: 20, marginBottom: 20, textAlign: 'center' },
  button: { padding: 15, width: '100%', marginVertical: 5, borderRadius: 10 },
  answer: { fontSize: 16, color: 'white', textAlign: 'center' },
  homeButton: { position: 'absolute', bottom: 30, padding: 12 },
  homeButtonText: { color: '#333', fontSize: 16 },
  scorecard: { position: 'absolute', top: 40, width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 },
  score: { fontSize: 18, fontWeight: 'bold' },
  highScore: { fontSize: 18, fontWeight: 'bold' },
});
