import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform, View, StyleSheet } from 'react-native';

import HomeScreen from './screens/HomeScreen';
import MemoryGameScreen from './screens/MemoryGameScreen';
import QuizGameScreen from './screens/QuizGameScreen';
import HangmanGameScreen from './screens/HangmanGameScreen';
import TapGameScreen from './screens/TapGameScreen';
import TicTacToeScreen from './screens/TicTacToeScreen';
import TicTacToeMultiplayerScreen from './screens/TicTacToeMultiplayerScreen';
import ScoreCardScreen from './screens/ScoreCardScreen';

export type RootStackParamList = {
  Home: undefined;
  MemoryGame: undefined;
  QuizGame: undefined;
  HangmanGame: undefined;
  TapGame: undefined;
  TicTacToe: undefined;
  TicTacToeMultiplayer: undefined;
  ScoreCard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const content = (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="MemoryGame" component={MemoryGameScreen} />
        <Stack.Screen name="QuizGame" component={QuizGameScreen} />
        <Stack.Screen name="HangmanGame" component={HangmanGameScreen} />
        <Stack.Screen name="TapGame" component={TapGameScreen} />
        <Stack.Screen name="TicTacToe" component={TicTacToeScreen} />
        <Stack.Screen name="TicTacToeMultiplayer" component={TicTacToeMultiplayerScreen} />
        <Stack.Screen name="ScoreCard" component={ScoreCardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webContainer}>
        <View style={styles.webFrame}>{content}</View>
      </View>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  webContainer: {
    width: '100vw',
    height: '100vh',
    backgroundColor: '#121212',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    boxSizing: 'border-box',
  },
  webFrame: {
    width: 390,
    height: 844,
    borderRadius: 36,
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
    backgroundColor: '#000',
  },
});
