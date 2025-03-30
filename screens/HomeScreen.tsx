import React from 'react';
import { Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  return (
    <LinearGradient colors={['#89f7fe', '#66a6ff']} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>🎲 Mini Gry 🎲</Text>
        <ScrollView contentContainerStyle={[styles.buttonsContainer, { flexGrow: 1, justifyContent: 'center' }]}>

          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('MemoryGame')}>
            <FontAwesome5 name="brain" size={24} color="#fff" />
            <Text style={styles.buttonText}>Gra w pamięć</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('QuizGame')}>
            <FontAwesome5 name="question-circle" size={24} color="#fff" />
            <Text style={styles.buttonText}>Quiz Wiedzy</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('HangmanGame')}>
            <FontAwesome5 name="robot" size={24} color="#fff" />
            <Text style={styles.buttonText}>Wisielec</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('TapGame')}>
            <FontAwesome5 name="bolt" size={24} color="#fff" />
            <Text style={styles.buttonText}>Tap Challenge</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('TicTacToe')}>
            <FontAwesome5 name="times-circle" size={24} color="#fff" />
            <Text style={styles.buttonText}>Kółko i Krzyżyk</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.buttonMultiplayer} onPress={() => navigation.navigate('TicTacToeMultiplayer')}>
            <FontAwesome5 name="users" size={24} color="#fff" />
            <Text style={styles.buttonText}>Kółko i Krzyżyk Multiplayer</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.buttonScorecard} onPress={() => navigation.navigate('ScoreCard')}>
            <FontAwesome5 name="chart-bar" size={24} color="#fff" />
            <Text style={styles.buttonText}>Wyniki</Text>
          </TouchableOpacity>

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
      fontSize: 34,
      fontWeight: 'bold',
      color: '#fff',
      textAlign: 'center',
      marginBottom: 20,
      marginTop: 10,
      textShadowColor: '#000',
      textShadowOffset: { width: 2, height: 2 },
      textShadowRadius: 4,
    },
    buttonsContainer: { paddingHorizontal: 20, paddingBottom: 30 },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 15,
      backgroundColor: 'rgba(255,255,255,0.3)',
      marginVertical: 8,
      borderRadius: 15,
      elevation: 3,
    },
    buttonMultiplayer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 15,
      backgroundColor: '#ff758c',
      marginVertical: 8,
      borderRadius: 15,
      elevation: 3,
    },
    buttonScorecard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 15,
      backgroundColor: '#6b67de',
      marginVertical: 25,
      borderRadius: 15,
      elevation: 3,
    },
    buttonText: {
      color: '#fff',
      textAlign: 'center',
      fontSize: 18,
      fontWeight: '600',
      marginLeft: 10,
    },
  });

