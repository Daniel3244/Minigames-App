import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import uuid from 'react-native-uuid';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import AsyncStorage from '@react-native-async-storage/async-storage';

const updateTttWins = async () => {
  const wins = parseInt((await AsyncStorage.getItem('tttWinsmp')) || '0');
  await AsyncStorage.setItem('tttWinsmp', (wins + 1).toString());
};


const playerId = uuid.v4();

export default function TicTacToeMultiplayerScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [board, setBoard] = useState(Array(9).fill(''));
  const [player, setPlayer] = useState<'❌' | '⭕' | null>(null);
  const [currentTurn, setCurrentTurn] = useState('❌');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'games', 'game1'), (snapshot) => {
      const data = snapshot.data();
      if (data) {
        setBoard(data.board);
        setCurrentTurn(data.currentTurn);

        if (data.resetReason && data.resetReason !== playerId) {
          Alert.alert('⚠️ Gra zakończona', 'Drugi gracz opuścił grę.', [
            { text: 'OK', onPress: () => navigation.navigate('Home') },
          ]);
          clearResetReason();
        }
      }
    });

    assignPlayer();

    return unsub;
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        resetGameWithReason();
      };
    }, [])
  );

  const assignPlayer = async () => {
    const gameRef = doc(db, 'games', 'game1');
    const gameSnap = await getDoc(gameRef);
    if (gameSnap.exists()) {
      const gameData = gameSnap.data();
      if (!gameData.playerX) {
        await setDoc(gameRef, { playerX: playerId, resetReason: null }, { merge: true });
        setPlayer('❌');
      } else if (!gameData.playerO && gameData.playerX !== playerId) {
        await setDoc(gameRef, { playerO: playerId, resetReason: null }, { merge: true });
        setPlayer('⭕');
      } else if (gameData.playerX === playerId) {
        setPlayer('❌');
      } else if (gameData.playerO === playerId) {
        setPlayer('⭕');
      } else {
        setPlayer('❌');
      }
    } else {
      await setDoc(gameRef, { board: Array(9).fill(''), currentTurn: '❌', playerX: playerId, resetReason: null });
      setPlayer('❌');
    }
  };

  const handleTap = async (index: number) => {
    if (!player || board[index] !== '' || currentTurn !== player) return;

    const newBoard = [...board];
    newBoard[index] = player;
    const nextPlayer = player === '❌' ? '⭕' : '❌';

    await setDoc(doc(db, 'games', 'game1'), {
      board: newBoard,
      currentTurn: nextPlayer,
    }, { merge: true });

    checkWinner(newBoard);
  };

  const checkWinner = (newBoard: string[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];

    for (let [a, b, c] of lines) {
      if (newBoard[a] && newBoard[a] === newBoard[b] && newBoard[a] === newBoard[c]) {
        if (newBoard[a] === player) {
          updateTttWins();
        }
        
        Alert.alert(`🎉 Gracz ${newBoard[a]} wygrywa!`);
        resetGame();
        return;
      }
    }
    if (!newBoard.includes('')) {
      Alert.alert('😐 Remis!');
      resetGame();
    }
  };

  const resetGame = async () => {
    await setDoc(doc(db, 'games', 'game1'), {
      board: Array(9).fill(''),
      currentTurn: '❌'
    }, { merge: true });
  };

  const resetGameWithReason = async () => {
    await setDoc(doc(db, 'games', 'game1'), {
      board: Array(9).fill(''),
      currentTurn: '❌',
      resetReason: playerId,
      playerX: null,
      playerO: null
    }, { merge: true });
  };

  const clearResetReason = async () => {
    await setDoc(doc(db, 'games', 'game1'), {
      resetReason: null
    }, { merge: true });
  };

  if (!player) {
    return <View style={styles.container}><Text>Przydzielanie gracza...</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kółko i Krzyżyk Multiplayer</Text>
      <Text style={styles.subtitle}>Jesteś: {player}</Text>
      <Text style={styles.subtitle}>Teraz gra: {currentTurn}</Text>
      <View style={styles.board}>
        {board.map((cell, idx) => (
          <TouchableOpacity key={idx} style={styles.cell} onPress={() => handleTap(idx)}>
            <Text style={styles.symbol}>{cell}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
        <Text style={styles.resetButtonText}>🔄 Resetuj grę</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.homeButton} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.homeButtonText}>🔙 Menu Główne</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 18, marginBottom: 5 },
  board: { flexDirection: 'row', flexWrap: 'wrap', width: 300, height: 300 },
  cell: { width: '33%', height: '33%', borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  symbol: { fontSize: 40 },
  resetButton: { marginTop: 20, padding: 10, backgroundColor: '#4c8bf5', borderRadius: 8 },
  resetButtonText: { color: 'white', fontSize: 16 },
  homeButton: { marginTop: 10 },
  homeButtonText: { color: '#333', fontSize: 16 },
});
