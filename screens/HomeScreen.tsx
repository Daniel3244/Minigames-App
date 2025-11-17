import React from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
  TextStyle,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { strings } from '../constants/strings';
import { colors } from '../styles/theme';
import { surfaces } from '../styles/commonStyles';
import GradientText from '../components/GradientText';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

type MenuItem = {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof FontAwesome5>['name'];
  route: keyof RootStackParamList;
  description: string;
  accent?: 'accent' | 'score';
};

const menuItems: MenuItem[] = [
  {
    key: 'memory',
    label: strings.home.menuItems.memory,
    icon: 'brain',
    route: 'MemoryGame',
    description: 'Match cards faster each round',
  },
  {
    key: 'quiz',
    label: strings.home.menuItems.quiz,
    icon: 'question-circle',
    route: 'QuizGame',
    description: 'Fresh trivia powered by OpenTDB',
  },
  {
    key: 'hangman',
    label: strings.home.menuItems.hangman,
    icon: 'robot',
    route: 'HangmanGame',
    description: 'Guess the word before the bot wins',
  },
  {
    key: 'tap',
    label: strings.home.menuItems.tap,
    icon: 'bolt',
    route: 'TapGame',
    description: 'Beat your previous tap streak',
  },
  {
    key: 'ttt',
    label: strings.home.menuItems.ttt,
    icon: 'times-circle',
    route: 'TicTacToe',
    description: 'Classic offline duel',
  },
  {
    key: 'tttmp',
    label: strings.home.menuItems.tttMultiplayer,
    icon: 'users',
    route: 'TicTacToeMultiplayer',
    description: 'Real-time Firestore rooms',
    accent: 'accent',
  },
  {
    key: 'score',
    label: strings.home.menuItems.scoreboard,
    icon: 'chart-bar',
    route: 'ScoreCard',
    description: 'Track wins across all modes',
    accent: 'score',
  },
];

const titleShadowStyle: TextStyle =
  Platform.select<TextStyle>({
    web: { textShadow: '2px 2px 4px rgba(0, 0, 0, 0.55)' } as TextStyle,
    default: {
      textShadowColor: '#000',
      textShadowOffset: { width: 2, height: 2 },
      textShadowRadius: 4,
    },
  }) || {
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  };

export default function HomeScreen({ navigation }: Props) {
  return (
    <LinearGradient colors={colors.gradient} style={styles.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <LinearGradient colors={[colors.accent, colors.score]} style={styles.heroFrame} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={styles.heroCard}>
              <GradientText text="Minigames App" style={styles.title} colors={colors.heroTitle} />
              <Text style={styles.heroCaption}>Tap, think, play – your mini games in one place.</Text>
              <View style={styles.heroChips}>
                <View style={styles.heroChip}>
                  <FontAwesome5 name="bolt" size={16} color={colors.textLight} />
                  <Text style={styles.heroChipText}>Pick & play</Text>
                </View>
                <View style={styles.heroChip}>
                  <FontAwesome5 name="chart-line" size={16} color={colors.textLight} />
                  <Text style={styles.heroChipText}>Scores auto-sync</Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Choose a mode</Text>
            <Text style={styles.sectionSubtitle}>Tap any card to jump into a fresh round instantly.</Text>
          </View>

          {menuItems.map(({ key, label, icon, route, accent, description }) => {
            const cardAccentStyle = accent === 'accent' ? styles.cardAccent : accent === 'score' ? styles.cardScore : null;
            const iconAccentStyle = accent === 'accent' ? styles.iconAccent : accent === 'score' ? styles.iconScore : null;

            return (
              <TouchableOpacity
                key={key}
                activeOpacity={0.9}
                style={[styles.gameCard, cardAccentStyle]}
                onPress={() => navigation.navigate(route)}
              >
                <View style={[styles.iconWrap, iconAccentStyle]}>
                  <FontAwesome5 name={icon} size={20} color={colors.textLight} />
                </View>
                <View style={styles.cardTextBlock}>
                  <Text style={styles.cardTitle}>{label}</Text>
                  <Text style={styles.cardSubtitle}>{description}</Text>
                </View>
                <FontAwesome5 name="chevron-right" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: {
    flex: 1,
    alignItems: 'center',
  },
  content: {
    paddingBottom: 40,
    paddingTop: 12,
    width: '100%',
    maxWidth: 360,
    paddingHorizontal: 16,
  },
  heroFrame: {
    borderRadius: 34,
    padding: 2,
    marginBottom: 28,
    ...surfaces.roundedCard,
    borderWidth: 0,
  },
  heroCard: {
    borderRadius: 28,
    paddingVertical: 22,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(12,17,31,0.9)',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 1,
    ...titleShadowStyle,
    textAlign: 'center',
  },
  heroCaption: {
    color: colors.textLight,
    opacity: 0.85,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  heroChips: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  heroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroChipText: {
    color: colors.textLight,
    fontSize: 13,
    fontWeight: '600',
  },
  sectionHeader: {
    marginBottom: 12,
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    color: colors.textLight,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  sectionSubtitle: {
    color: colors.textMuted,
    textAlign: 'center',
  },
  gameCard: {
    ...surfaces.roundedCard,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  cardAccent: {
    backgroundColor: colors.accent,
  },
  cardScore: {
    backgroundColor: colors.score,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconAccent: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  iconScore: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  cardTextBlock: {
    flex: 1,
  },
  cardTitle: {
    color: colors.textLight,
    fontSize: 17,
    fontWeight: '600',
  },
  cardSubtitle: {
    color: colors.textMuted,
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
  },
});
