import React, { useEffect, useState, useCallback } from 'react';
import { Platform, TextStyle, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { strings } from '../constants/strings';
import { colors } from '../styles/theme';
import { layout, surfaces } from '../styles/commonStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'ScoreCard'>;

type ScoreState = {
  memoryWins: number;
  quizHighScore: number;
  tapHighScore: number;
  tttWins: number;
  tttWinsmp: number;
};

const initialScores: ScoreState = {
  memoryWins: 0,
  quizHighScore: 0,
  tapHighScore: 0,
  tttWins: 0,
  tttWinsmp: 0,
};

type ScoreItemProps = { icon: React.ReactNode; label: string; value: string; color: string };

const ScoreItem = ({ icon, label, value, color }: ScoreItemProps) => (
  <View style={[styles.scoreItem, { backgroundColor: color }]}>
    <View style={styles.iconWrap}>{icon}</View>
    <View style={styles.scoreTextWrap}>
      <Text style={styles.scoreLabel}>{label}</Text>
      <Text style={styles.scoreValue}>{value}</Text>
    </View>
  </View>
);

export default function ScoreCardScreen({ navigation }: Props) {
  const [scores, setScores] = useState<ScoreState>(initialScores);

  const loadScores = useCallback(async () => {
    const memoryWins = parseInt((await AsyncStorage.getItem('memoryWins')) || '0', 10);
    const quizHighScore = parseInt((await AsyncStorage.getItem('quizHighScore')) || '0', 10);
    const tapHighScore = parseInt((await AsyncStorage.getItem('tapHighScore')) || '0', 10);
    const tttWins = parseInt((await AsyncStorage.getItem('tttWins')) || '0', 10);
    const tttWinsmp = parseInt((await AsyncStorage.getItem('tttWinsmp')) || '0', 10);
    setScores({ memoryWins, quizHighScore, tapHighScore, tttWins, tttWinsmp });
  }, []);

  useEffect(() => {
    void loadScores();
  }, [loadScores]);

  useFocusEffect(
    useCallback(() => {
      void loadScores();
    }, [loadScores]),
  );

  const scoreItems = [
    {
      icon: <FontAwesome5 name="brain" size={28} color={colors.textLight} />,
      label: strings.scoreboard.labels.memory,
      value: strings.scoreboard.values.memory(scores.memoryWins),
      color: '#4c8bf5',
    },
    {
      icon: <FontAwesome5 name="question-circle" size={28} color={colors.textLight} />,
      label: strings.scoreboard.labels.quiz,
      value: strings.scoreboard.values.quiz(scores.quizHighScore),
      color: '#f78c6b',
    },
    {
      icon: <FontAwesome5 name="bolt" size={28} color={colors.textLight} />,
      label: strings.scoreboard.labels.tap,
      value: strings.scoreboard.values.tap(scores.tapHighScore),
      color: '#ffd166',
    },
    {
      icon: <FontAwesome5 name="times-circle" size={28} color={colors.textLight} />,
      label: strings.scoreboard.labels.ttt,
      value: strings.scoreboard.values.ttt(scores.tttWins),
      color: '#06d6a0',
    },
    {
      icon: <FontAwesome5 name="users" size={28} color={colors.textLight} />,
      label: strings.scoreboard.labels.tttMultiplayer,
      value: strings.scoreboard.values.tttMultiplayer(scores.tttWinsmp),
      color: '#ef476f',
    },
  ];

  return (
    <LinearGradient colors={colors.gradient} style={styles.gradient}>
      <View style={styles.centeredContainer}>
        <Text style={styles.title}>{strings.scoreboard.title}</Text>
        {scoreItems.map(item => (
          <ScoreItem key={item.label} {...item} />
        ))}
        <TouchableOpacity style={styles.homeButton} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.homeButtonText}>{strings.common.backToMenu}</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const titleShadowStyle: TextStyle =
  Platform.select<TextStyle>({
    web: { textShadow: '1px 1px 3px rgba(0, 0, 0, 0.6)' } as TextStyle,
    default: {
      textShadowColor: '#000',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 3,
    },
  }) || {
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  };

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  centeredContainer: {
    ...layout.centered,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textLight,
    marginBottom: 30,
    ...titleShadowStyle,
  },
  scoreItem: {
    ...surfaces.roundedCard,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginVertical: 8,
  },
  iconWrap: {
    width: 40,
    alignItems: 'center',
    marginRight: 15,
  },
  scoreTextWrap: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textLight,
  },
  scoreValue: {
    fontSize: 16,
    color: colors.textLight,
  },
  homeButton: {
    marginTop: 40,
    padding: 12,
    backgroundColor: colors.textLight,
    borderRadius: 10,
  },
  homeButtonText: {
    color: colors.textDark,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
