import React from 'react';
import { Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { strings } from '../constants/strings';
import { colors } from '../styles/theme';
import { surfaces } from '../styles/commonStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

type MenuItem = {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof FontAwesome5>['name'];
  route: keyof RootStackParamList;
  variant?: 'accent' | 'score';
};

const menuItems: MenuItem[] = [
  { key: 'memory', label: strings.home.menuItems.memory, icon: 'brain', route: 'MemoryGame' },
  { key: 'quiz', label: strings.home.menuItems.quiz, icon: 'question-circle', route: 'QuizGame' },
  { key: 'hangman', label: strings.home.menuItems.hangman, icon: 'robot', route: 'HangmanGame' },
  { key: 'tap', label: strings.home.menuItems.tap, icon: 'bolt', route: 'TapGame' },
  { key: 'ttt', label: strings.home.menuItems.ttt, icon: 'times-circle', route: 'TicTacToe' },
  {
    key: 'tttmp',
    label: strings.home.menuItems.tttMultiplayer,
    icon: 'users',
    route: 'TicTacToeMultiplayer',
    variant: 'accent',
  },
  {
    key: 'score',
    label: strings.home.menuItems.scoreboard,
    icon: 'chart-bar',
    route: 'ScoreCard',
    variant: 'score',
  },
];

export default function HomeScreen({ navigation }: Props) {
  return (
    <LinearGradient colors={colors.gradient} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>{strings.home.title}</Text>
        <ScrollView contentContainerStyle={[styles.buttonsContainer, styles.buttonsContent]}>
          {menuItems.map(({ key, label, icon, route, variant }) => (
            <TouchableOpacity
              key={key}
              style={[styles.button, variant === 'accent' && styles.buttonAccent, variant === 'score' && styles.buttonScore]}
              onPress={() => navigation.navigate(route)}
            >
              <FontAwesome5 name={icon} size={24} color={colors.textLight} />
              <Text style={styles.buttonText}>{label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 10,
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  buttonsContainer: { paddingHorizontal: 20, paddingBottom: 30 },
  buttonsContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  button: {
    ...surfaces.roundedCard,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: colors.cardBackground,
    marginVertical: 8,
  },
  buttonAccent: {
    backgroundColor: colors.accent,
  },
  buttonScore: {
    backgroundColor: colors.score,
    marginTop: 24,
  },
  buttonText: {
    color: colors.textLight,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
});
