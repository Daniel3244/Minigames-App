import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5, FontAwesome } from '@expo/vector-icons';

type Props = NativeStackScreenProps<RootStackParamList, 'ScoreCard'>;

export default function ScoreCardScreen({ navigation }: Props) {
  const [scores, setScores] = useState({
    memoryWins: 0,
    quizHighScore: 0,
    tapHighScore: 0,
    tttWins: 0,
    tttWinsmp: 0,
  });

  const loadScores = async () => {
    const memoryWins = parseInt((await AsyncStorage.getItem('memoryWins')) || '0');
    const quizHighScore = parseInt((await AsyncStorage.getItem('quizHighScore')) || '0');
    const tapHighScore = parseInt((await AsyncStorage.getItem('tapHighScore')) || '0');
    const tttWins = parseInt((await AsyncStorage.getItem('tttWins')) || '0');
    const tttWinsmp = parseInt((await AsyncStorage.getItem('tttWinsmp')) || '0');
    setScores({ memoryWins, quizHighScore, tapHighScore, tttWins, tttWinsmp });
  };

  useEffect(() => {
    loadScores();
  }, []);

  const ScoreItem = ({ icon, label, value, color }: { icon: any; label: string; value: string; color: string }) => (
    <View style={[styles.scoreItem, { backgroundColor: color }]}>
      <View style={styles.iconWrap}>
        {icon}
      </View>
      <View style={styles.scoreTextWrap}>
        <Text style={styles.scoreLabel}>{label}</Text>
        <Text style={styles.scoreValue}>{value}</Text>
      </View>
    </View>
  );

  return (
    <LinearGradient colors={['#89f7fe', '#66a6ff']} style={styles.gradient}>
      <View style={styles.centeredContainer}>
        <Text style={styles.title}>📊 Twoje Wyniki</Text>
  
        <ScoreItem
          icon={<FontAwesome5 name="brain" size={28} color="#fff" />}
          label="Gra w pamięć"
          value={`${scores.memoryWins} wygranych`}
          color="#4c8bf5"
        />
        <ScoreItem
          icon={<FontAwesome5 name="question-circle" size={28} color="#fff" />}
          label="Quiz Wiedzy"
          value={`${scores.quizHighScore} punktów`}
          color="#f78c6b"
        />
        <ScoreItem
          icon={<FontAwesome5 name="bolt" size={28} color="#fff" />}
          label="Tap Challenge"
          value={`${scores.tapHighScore} kliknięć`}
          color="#ffd166"
        />
        <ScoreItem
          icon={<FontAwesome5 name="times-circle" size={28} color="#fff" />}
          label="Kółko i Krzyżyk"
          value={`${scores.tttWins} wygranych`}
          color="#06d6a0"
        />
        <ScoreItem
          icon={<FontAwesome5 name="users" size={28} color="#fff" />}
          label="Kółko i Krzyżyk Multiplayer"
          value={`${scores.tttWinsmp} wygranych`}
          color="#ef476f"
        />
  
        <TouchableOpacity style={styles.homeButton} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.homeButtonText}>🔙 Menu Główne</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
} 

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { padding: 20, alignItems: 'center' },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },  
  scoreItem: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 15,
    marginVertical: 8,
    elevation: 3,
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
    color: '#fff',
  },
  scoreValue: {
    fontSize: 16,
    color: '#fff',
  },
  homeButton: {
    marginTop: 40,
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  homeButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
