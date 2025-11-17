import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useFonts } from 'expo-font';
import { colors } from './styles/theme';

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
  const { width } = useWindowDimensions();
  const [fontsLoaded] = useFonts({
    'FontAwesome5Free-Solid': require('./assets/fonts/FontAwesome5_Solid.ttf'),
    'FontAwesome5Free-Regular': require('./assets/fonts/FontAwesome5_Regular.ttf'),
    'FontAwesome5Free-Light': require('./assets/fonts/FontAwesome5_Regular.ttf'),
    'FontAwesome5Free-Brand': require('./assets/fonts/FontAwesome5_Brands.ttf'),
    FontAwesome: require('./assets/fonts/FontAwesome.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

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

  const shouldFrameWeb = Platform.OS === 'web' && width > 980;

  if (shouldFrameWeb) {
    return (
      <View style={styles.webContainer}>
        <View style={styles.webFrameInner}>{content}</View>
      </View>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  webContainer: {
    width: '100vw',
    height: '100vh',
    backgroundColor: colors.background,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 40,
    paddingRight: 40,
    paddingTop: 24,
    paddingBottom: 24,
    boxSizing: 'border-box',
  },
  webFrameInner: {
    width: 400,
    height: 870,
    borderRadius: 32,
    overflow: 'hidden',
    boxShadow: '0 30px 80px rgba(5,8,20,0.75)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121212',
  },
});
