import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import uuid from 'react-native-uuid';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../App';
import { db } from '../firebaseConfig';
import showAlert from '../utils/showAlert';
import { strings } from '../constants/strings';
import { colors } from '../styles/theme';
import { layout } from '../styles/commonStyles';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

type PlayerSymbol = 'X' | 'O';

type GameData = {
  board?: string[];
  currentTurn?: PlayerSymbol;
  playerX?: string | null;
  playerO?: string | null;
  playerXLastActive?: number | null;
  playerOLastActive?: number | null;
  resetReason?: string | null;
};

const lines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const createEmptyBoard = () => Array(9).fill('');
const gameDoc = doc(db, 'games', 'game1');
const PLAYER_ID_KEY = 'tttPlayerId';
const HEARTBEAT_INTERVAL = 5000;
const SESSION_TIMEOUT = 15000;

const updateTttWins = async () => {
  const wins = parseInt((await AsyncStorage.getItem('tttWinsmp')) || '0', 10);
  await AsyncStorage.setItem('tttWinsmp', String(wins + 1));
};

export default function TicTacToeMultiplayerScreen() {
  const navigation = useNavigation<Navigation>();
  const [board, setBoard] = useState<string[]>(createEmptyBoard());
  const [player, setPlayer] = useState<PlayerSymbol | null>(null);
  const [currentTurn, setCurrentTurn] = useState<PlayerSymbol>('X');
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [lastResetReason, setLastResetReason] = useState<string | null>(null);
  const heartbeatRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const ensurePlayerId = async () => {
      const stored = await AsyncStorage.getItem(PLAYER_ID_KEY);
      if (stored) {
        setPlayerId(stored);
        return;
      }
      const newId = String(uuid.v4());
      await AsyncStorage.setItem(PLAYER_ID_KEY, newId);
      setPlayerId(newId);
    };

    void ensurePlayerId();
  }, []);

  const clearResetReason = useCallback(async () => {
    await setDoc(gameDoc, { resetReason: null }, { merge: true });
    setLastResetReason(null);
  }, []);

  const resetGame = useCallback(async () => {
    await setDoc(
      gameDoc,
      {
        board: createEmptyBoard(),
        currentTurn: 'X',
        resetReason: null,
      },
      { merge: true },
    );
  }, []);

  const resetGameWithReason = useCallback(async () => {
    if (!playerId) {
      return;
    }
    await setDoc(
      gameDoc,
      {
        board: createEmptyBoard(),
        currentTurn: 'X',
        resetReason: playerId,
        playerX: null,
        playerO: null,
        playerXLastActive: null,
        playerOLastActive: null,
      },
      { merge: true },
    );
  }, [playerId]);

  const clearHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  const touchHeartbeat = useCallback(
    async (slot: PlayerSymbol) => {
      if (!playerId) {
        return;
      }
      const field = slot === 'X' ? 'playerXLastActive' : 'playerOLastActive';
      await setDoc(gameDoc, { [field]: Date.now() }, { merge: true });
    },
    [playerId],
  );

  const assignPlayer = useCallback(async () => {
    if (!playerId) {
      return;
    }

    const snapshot = await getDoc(gameDoc);
    const now = Date.now();

    if (snapshot.exists()) {
      const gameData = snapshot.data() as GameData;
      const playerXStale =
        !gameData.playerXLastActive || now - gameData.playerXLastActive > SESSION_TIMEOUT;
      const playerOStale =
        !gameData.playerOLastActive || now - gameData.playerOLastActive > SESSION_TIMEOUT;

      if (gameData.playerX && playerXStale) {
        await setDoc(
          gameDoc,
          { playerX: null, playerXLastActive: null, resetReason: null },
          { merge: true },
        );
        gameData.playerX = null;
      }

      if (gameData.playerO && playerOStale) {
        await setDoc(
          gameDoc,
          { playerO: null, playerOLastActive: null, resetReason: null },
          { merge: true },
        );
        gameData.playerO = null;
      }

      if (!gameData.playerX) {
        await setDoc(
          gameDoc,
          { playerX: playerId, playerXLastActive: now, resetReason: null },
          { merge: true },
        );
        setPlayer('X');
        await touchHeartbeat('X');
      } else if (!gameData.playerO && gameData.playerX !== playerId) {
        await setDoc(
          gameDoc,
          { playerO: playerId, playerOLastActive: now, resetReason: null },
          { merge: true },
        );
        setPlayer('O');
        await touchHeartbeat('O');
      } else if (gameData.playerX === playerId) {
        setPlayer('X');
        await touchHeartbeat('X');
      } else if (gameData.playerO === playerId) {
        setPlayer('O');
        await touchHeartbeat('O');
      } else {
        showAlert(strings.tttMultiplayer.roomFullTitle, strings.tttMultiplayer.roomFullMessage, [
          { text: strings.common.menu, onPress: () => navigation.navigate('Home') },
        ]);
      }
    } else {
      await setDoc(
        gameDoc,
        {
          board: createEmptyBoard(),
          currentTurn: 'X',
          playerX: playerId,
          playerO: null,
          playerXLastActive: now,
          playerOLastActive: null,
          resetReason: null,
        },
        { merge: true },
      );
      setPlayer('X');
      await touchHeartbeat('X');
    }
  }, [navigation, playerId, touchHeartbeat]);

  const checkWinner = useCallback(
    async (currentBoard: string[]) => {
      for (const [a, b, c] of lines) {
        if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
          if (currentBoard[a] === player) {
            void updateTttWins();
          }

          showAlert(strings.tttMultiplayer.gameFinishedTitle, strings.tttMultiplayer.playerWins(currentBoard[a]), [
            { text: strings.common.ok, onPress: () => void resetGame() },
          ]);
          return;
        }
      }

      if (!currentBoard.includes('')) {
        showAlert(strings.tttMultiplayer.drawTitle, strings.tttMultiplayer.drawMessage, [
          { text: strings.common.ok, onPress: () => void resetGame() },
        ]);
      }
    },
    [player, resetGame],
  );

  useEffect(() => {
    if (!playerId) {
      return;
    }

    const unsubscribe = onSnapshot(gameDoc, snapshot => {
      const data = snapshot.data() as GameData | undefined;
      if (!data) {
        return;
      }
      if (Array.isArray(data.board)) {
        setBoard(data.board);
      }
      if (data.currentTurn === 'X' || data.currentTurn === 'O') {
        setCurrentTurn(data.currentTurn);
      }

      if (data.resetReason) {
        if (data.resetReason !== playerId && data.resetReason !== lastResetReason) {
          setLastResetReason(data.resetReason);
          showAlert(strings.tttMultiplayer.opponentLeftTitle, strings.tttMultiplayer.opponentLeftMessage, [
            { text: strings.common.menu, onPress: () => navigation.navigate('Home') },
          ]);
          void clearResetReason();
        }
      } else if (lastResetReason) {
        setLastResetReason(null);
      }
    });

    void assignPlayer();

    return unsubscribe;
  }, [assignPlayer, clearResetReason, lastResetReason, navigation, playerId]);

  useEffect(() => {
    if (!player) {
      clearHeartbeat();
      return;
    }

    void touchHeartbeat(player);
    heartbeatRef.current = setInterval(() => {
      void touchHeartbeat(player);
    }, HEARTBEAT_INTERVAL);

    return clearHeartbeat;
  }, [player, touchHeartbeat, clearHeartbeat]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        void resetGameWithReason();
        clearHeartbeat();
      };
    }, [resetGameWithReason, clearHeartbeat]),
  );

  const handleTap = async (index: number) => {
    if (!player || board[index] !== '' || currentTurn !== player) {
      return;
    }

    const newBoard = [...board];
    newBoard[index] = player;
    const nextTurn: PlayerSymbol = player === 'X' ? 'O' : 'X';

    await setDoc(gameDoc, { board: newBoard, currentTurn: nextTurn }, { merge: true });
    void checkWinner(newBoard);
  };

  if (!player || !playerId) {
    return (
      <View style={styles.container}>
        <Text>{strings.tttMultiplayer.assigningPlayer}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{strings.tttMultiplayer.title}</Text>
      <Text style={styles.subtitle}>{strings.tttMultiplayer.youAre(player)}</Text>
      <Text style={styles.subtitle}>{strings.tttMultiplayer.currentTurn(currentTurn)}</Text>
      <View style={styles.board}>
        {board.map((cell, idx) => (
          <TouchableOpacity key={idx} style={styles.cell} onPress={() => handleTap(idx)}>
            <Text style={styles.symbol}>{cell}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.resetButton} onPress={() => void resetGame()}>
        <Text style={styles.resetButtonText}>{strings.common.reset}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.homeButton} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.homeButtonText}>{strings.common.backToMenu}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...layout.centered },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 18, marginBottom: 5 },
  board: { flexDirection: 'row', flexWrap: 'wrap', width: 300, height: 300 },
  cell: { width: '33%', height: '33%', borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  symbol: { fontSize: 40 },
  resetButton: { marginTop: 20, padding: 10, backgroundColor: colors.quizPrimary, borderRadius: 8 },
  resetButtonText: { color: colors.textLight, fontSize: 16 },
  homeButton: { marginTop: 10 },
  homeButtonText: { color: colors.textDark, fontSize: 16 },
});
