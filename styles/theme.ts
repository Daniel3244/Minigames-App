import { ViewStyle } from 'react-native';

export const colors = {
  gradient: ['#89f7fe', '#66a6ff'] as const,
  accent: '#ff758c',
  score: '#6b67de',
  textLight: '#fff',
  textDark: '#333',
  quizCorrect: '#4caf50',
  quizIncorrect: '#f44336',
  quizNeutral: '#ddd',
  quizPrimary: '#4c8bf5',
  tapIdle: '#4c8bf5',
  tapActive: '#ff6347',
  cardBackground: 'rgba(255,255,255,0.32)',
};

export const shadow: ViewStyle = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
  elevation: 3,
};
