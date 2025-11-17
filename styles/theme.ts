import { Platform, ViewStyle } from 'react-native';

export const colors = {
  gradient: ['#141E30', '#243B55'] as const,
  heroGlow: ['#4facfe', '#38f9d7'] as const,
  accent: '#ff6b81',
  accentSoft: '#ff9a8b',
  heroTitle: ['#ffb8c4', '#c9d6ff'] as const,
  score: '#756bff',
  background: '#0c111f',
  surface: 'rgba(19, 27, 45, 0.85)',
  border: 'rgba(255, 255, 255, 0.08)',
  textLight: '#f8fbff',
  textMuted: '#94a3b8',
  textDark: '#1d2333',
  quizCorrect: '#38b861',
  quizIncorrect: '#f87171',
  quizNeutral: '#cbd5f5',
  quizPrimary: '#4c8bf5',
  tapIdle: '#4c8bf5',
  tapActive: '#ff6347',
  cardBackground: 'rgba(255,255,255,0.08)',
};

const nativeShadow: ViewStyle = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 12 },
  shadowOpacity: 0.35,
  shadowRadius: 20,
  elevation: 12,
};

const webShadow: ViewStyle = {
  boxShadow: '0 20px 45px rgba(5, 8, 20, 0.45)',
};

export const shadow: ViewStyle =
  Platform.select<ViewStyle>({
    web: webShadow,
    default: nativeShadow,
  }) || nativeShadow;
