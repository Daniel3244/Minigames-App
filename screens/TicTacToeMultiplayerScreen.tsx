import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  AppStateStatus,
  FlatList,
  ListRenderItem,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { FirebaseError } from 'firebase/app';
import {
  DocumentData,
  DocumentReference,
  QuerySnapshot,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import uuid from 'react-native-uuid';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../App';
import { db } from '../firebaseConfig';
import showAlert from '../utils/showAlert';
import { strings } from '../constants/strings';
import { colors } from '../styles/theme';
import { surfaces } from '../styles/commonStyles';
import { PlayerSymbol } from '../logic/ticTacToe';
import {
  GameStatus,
  GameWinner,
  PlayerPresence,
  RemoteGameState,
  cleanupPlayers,
  chooseSlotForPlayer,
  createEmptyBoard,
  createInitialRemoteDocState,
  evaluateBoardWinner,
  generateRoomCode,
  getOpponentSlot,
  normalizeRemoteState,
  shouldAutoStartRematch,
  shouldShowOpponentLeftAlert,
  shouldStartRound,
} from '../logic/ticTacToeMultiplayer';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const HEARTBEAT_INTERVAL = 4000;
const STALE_PLAYER_THRESHOLD = 15000;
const OPPONENT_DISCONNECT_GRACE_MS = 7000;
const JOIN_RETRY_LIMIT = 10;
const JOIN_RETRY_DELAY_MS = 200;
const ROOM_LIST_LIMIT = 25;
const MAX_ROOM_CREATE_ATTEMPTS = 5;
const RETRYABLE_FIRESTORE_CODES = new Set(['failed-precondition', 'aborted', 'unavailable']);
const MAX_ACTIVE_ROOMS = 5;
const EMPTY_ROOM_RETENTION_MS = 5 * 60 * 1000;
const SERVER_TIME_COLLECTION = 'meta';
const SERVER_TIME_DOC_ID = 'serverTime';
const PLAYER_ID_STORAGE_KEY = 'tttMultiplayerPlayerId';
const ACTIVE_ROOM_STORAGE_KEY = 'tttMultiplayerActiveRoomId';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const runWithRetry = async <T,>(operation: () => Promise<T>, attempt = 0): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    const message = (error as Error)?.message;
    if (attempt >= 3 || message === 'room-code-taken') {
      throw error;
    }
    const backoff = JOIN_RETRY_DELAY_MS * Math.pow(2, attempt);
    await delay(backoff);
    return runWithRetry(operation, attempt + 1);
  }
};

const sanitizeRoomCode = (value: string) => value.replace(/[^a-z0-9]/gi, '').toUpperCase();

const toMillis = (value?: Timestamp | number | null) => {
  if (value instanceof Timestamp) {
    return value.toMillis();
  }
  if (typeof value === 'number') {
    return value;
  }
  return null;
};

const parsePlayersFromDoc = (data?: Record<PlayerSymbol, PlayerPresence>): Record<PlayerSymbol, PlayerPresence> => ({
  X: {
    id: data?.X?.id ?? null,
    lastSeen: toMillis(data?.X?.lastSeen),
  },
  O: {
    id: data?.O?.id ?? null,
    lastSeen: toMillis(data?.O?.lastSeen),
  },
});

const parseGameDocument = (data: DocumentData): Partial<RemoteGameState> => ({
  ...data,
  resultAt: toMillis(data.resultAt),
  lastActivityAt: toMillis(data.lastActivityAt),
  players: parsePlayersFromDoc(data.players),
  rematchVotes: data.rematchVotes ?? { X: false, O: false },
});

const getServerClockRef = () => doc(db, SERVER_TIME_COLLECTION, SERVER_TIME_DOC_ID);

const fetchServerTime = async (): Promise<number> => {
  try {
    const clockRef = getServerClockRef();
    await setDoc(clockRef, { now: serverTimestamp() }, { merge: true });
    const snapshot = await getDoc(clockRef);
    const serverNow = toMillis(snapshot.data({ serverTimestamps: 'estimate' })?.now);
    return serverNow ?? Date.now();
  } catch (error) {
    console.error('Failed to fetch server time', error);
    return Date.now();
  }
};

const computeServerAlignedNow = (state: RemoteGameState | null, slot: PlayerSymbol | null): number | null => {
  if (!state) {
    return null;
  }
  const values = [
    slot ? state.players[slot].lastSeen ?? null : null,
    state.players.X.lastSeen ?? null,
    state.players.O.lastSeen ?? null,
    state.resultAt ?? null,
    state.lastActivityAt ?? null,
  ].filter((value): value is number => typeof value === 'number');
  if (!values.length) {
    return null;
  }
  return Math.max(...values);
};

const clearSlotDocument = async (
  roomRef: DocumentReference<DocumentData>,
  slot: PlayerSymbol | null,
  options?: { forceForfeit?: boolean; playerId?: string },
) => {
  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(roomRef);
    if (!snapshot.exists()) {
      return;
    }
    const remote = normalizeRemoteState(
      parseGameDocument(snapshot.data({ serverTimestamps: 'estimate' }) as DocumentData),
    );
    let targetSlot = slot;
    if (!targetSlot && options?.playerId) {
      targetSlot =
        (['X', 'O'] as PlayerSymbol[]).find(symbol => remote.players[symbol].id === options.playerId) ?? null;
    }
    if (!targetSlot) {
      return;
    }
    const slotOccupied = Boolean(remote.players[targetSlot].id);
    if (!slotOccupied && !options?.forceForfeit) {
      return;
    }
    const opponentSlot = getOpponentSlot(targetSlot);
    const opponentConnected = Boolean(remote.players[opponentSlot].id);
    const playersAfterClear = {
      ...remote.players,
      [targetSlot]: { id: null, lastSeen: null },
    };
    const remainingPlayers = (['X', 'O'] as PlayerSymbol[]).filter(symbol => playersAfterClear[symbol].id);
    if (!remainingPlayers.length) {
      transaction.delete(roomRef);
      return;
    }
    const playersUpdate: Partial<Record<PlayerSymbol, PlayerPresence>> = {
      [targetSlot]: { id: null, lastSeen: null },
    };
    const update: Record<string, unknown> = {
      players: playersUpdate,
      rematchVotes: { [targetSlot]: false },
      updatedAt: serverTimestamp(),
      lastActivityAt: serverTimestamp(),
    };
    const shouldForfeit =
      remote.status === 'playing' && !remote.winner && (opponentConnected || options?.forceForfeit);
    if (shouldForfeit) {
      update.status = 'finished';
      update.winner = opponentSlot;
      update.resultAt = serverTimestamp();
    } else {
      update.board = createEmptyBoard();
      update.status = 'waiting';
      update.winner = null;
      update.resultAt = null;
      update.currentTurn = remote.nextStarter ?? 'X';
      update.rematchVotes = { X: false, O: false };
    }
    transaction.set(roomRef, update, { merge: true });
  });
};

const initializeRoomDocument = async (roomRef: ReturnType<typeof doc>) => {
  await setDoc(roomRef, {
    ...createInitialRemoteDocState(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastActivityAt: serverTimestamp(),
  });
};

type LobbyRoom = {
  id: string;
  status: GameStatus;
  players: Record<PlayerSymbol, PlayerPresence>;
  lastActivityAt: number | null;
};

const updateTttWins = async () => {
  const wins = parseInt((await AsyncStorage.getItem('tttWinsmp')) || '0', 10);
  await AsyncStorage.setItem('tttWinsmp', String(wins + 1));
};

export default function TicTacToeMultiplayerScreen() {
  const navigation = useNavigation<Navigation>();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [rooms, setRooms] = useState<LobbyRoom[]>([]);
  const [roomActionError, setRoomActionError] = useState<string | null>(null);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [joiningRoom, setJoiningRoom] = useState(false);
  const [playerSlot, setPlayerSlot] = useState<PlayerSymbol | null>(null);
  const [gameState, setGameState] = useState<RemoteGameState | null>(null);
  const [isForeground, setIsForeground] = useState(true);
  const [opponentOverrideDisconnected, setOpponentOverrideDisconnected] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const lastResultAtRef = useRef<number | null>(null);
  const previousOpponentRef = useRef<string | null>(null);
  const opponentOverrideDisconnectedRef = useRef(false);
  const lastOpponentHeartbeatRef = useRef<number | null>(null);
  const lastOpponentAlertIdRef = useRef<string | null>(null);
  const opponentDisconnectGraceUntilRef = useRef(0);
  const clearingSlotRef = useRef<Record<PlayerSymbol, boolean>>({ X: false, O: false });
  const joinInFlightRef = useRef(false);
  const playerIdRef = useRef<string | null>(null);
  const initialRoomCleanupAttemptedRef = useRef(false);
  const playerSlotRef = useRef<PlayerSymbol | null>(null);
  const slotConfirmedRef = useRef(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const leavingRoomRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    const loadPlayerId = async () => {
      try {
        const storedId = await AsyncStorage.getItem(PLAYER_ID_STORAGE_KEY);
        const resolvedId = storedId ?? String(uuid.v4());
        if (!storedId) {
          await AsyncStorage.setItem(PLAYER_ID_STORAGE_KEY, resolvedId);
        }
        if (isMounted) {
          playerIdRef.current = resolvedId;
          setPlayerId(resolvedId);
        }
      } catch (error) {
        console.error('Failed to load multiplayer player id', error);
        const fallback = String(uuid.v4());
        if (isMounted) {
          playerIdRef.current = fallback;
          setPlayerId(fallback);
        }
      }
    };
    loadPlayerId();
    return () => {
      isMounted = false;
    };
  }, []);

  const roomDocRef = useMemo(() => (roomId ? doc(db, 'games', roomId) : null), [roomId]);
  useEffect(() => {
    playerSlotRef.current = playerSlot;
    slotConfirmedRef.current = false;
  }, [playerSlot]);

  useEffect(() => {
    if (!playerId || initialRoomCleanupAttemptedRef.current) {
      return undefined;
    }
    initialRoomCleanupAttemptedRef.current = true;
    let cancelled = false;
    void (async () => {
      try {
        const storedRoom = await AsyncStorage.getItem(ACTIVE_ROOM_STORAGE_KEY);
        if (!storedRoom || cancelled) {
          return;
        }
        const orphanRef = doc(db, 'games', storedRoom);
        await runWithRetry(() => clearSlotDocument(orphanRef, null, { playerId, forceForfeit: true }));
        if (!cancelled) {
          await AsyncStorage.removeItem(ACTIVE_ROOM_STORAGE_KEY);
        }
      } catch (error) {
        console.error('Failed to cleanup dangling multiplayer room', error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [playerId]);

  useEffect(() => {
    setGameState(null);
    setPlayerSlot(null);
    playerSlotRef.current = null;
    previousOpponentRef.current = null;
    return undefined;
  }, [roomDocRef]);

  const clearHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  const sendHeartbeat = useCallback(async () => {
    if (!roomDocRef || !playerSlotRef.current || !playerId) {
      return;
    }
    const slot = playerSlotRef.current;
    try {
      await runWithRetry(async () => {
        if (!playerSlotRef.current || playerSlotRef.current !== slot) {
          return;
        }
        await setDoc(
          roomDocRef,
          {
            players: {
              [slot]: {
                id: playerId,
                lastSeen: serverTimestamp(),
              },
            },
            updatedAt: serverTimestamp(),
            lastActivityAt: serverTimestamp(),
          },
          { merge: true },
        );
      });
    } catch (error) {
      console.error('Failed to send heartbeat', error);
    }
  }, [playerId, roomDocRef]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      appStateRef.current = nextState;
      const foreground = nextState === 'active';
      setIsForeground(foreground);
      if (foreground) {
        void sendHeartbeat();
      } else {
        clearHeartbeat();
      }
    });
    return () => {
      subscription.remove();
    };
  }, [clearHeartbeat, sendHeartbeat]);

  useEffect(() => {
    if (!playerSlot || !roomDocRef || !isForeground) {
      clearHeartbeat();
      return;
    }
    void sendHeartbeat();
    heartbeatRef.current = setInterval(() => {
      void sendHeartbeat();
    }, HEARTBEAT_INTERVAL);
    return clearHeartbeat;
  }, [clearHeartbeat, isForeground, playerSlot, roomDocRef, sendHeartbeat]);

  useEffect(() => {
    if (!playerId) {
      return;
    }
    if (roomId) {
      void AsyncStorage.setItem(ACTIVE_ROOM_STORAGE_KEY, roomId);
    } else {
      void AsyncStorage.removeItem(ACTIVE_ROOM_STORAGE_KEY);
    }
  }, [playerId, roomId]);

  const clearSlot = useCallback(
    async (slot: PlayerSymbol, options?: { forceForfeit?: boolean }) => {
      if (!roomDocRef) {
        return;
      }
      await runWithRetry(() => clearSlotDocument(roomDocRef, slot, options));
    },
    [roomDocRef],
  );

  const clearSlotByPlayerId = useCallback(
    async (playerId: string) => {
      if (!roomDocRef) {
        return;
      }
      await runWithRetry(() => clearSlotDocument(roomDocRef, null, { playerId }));
    },
    [roomDocRef],
  );

  const pruneRoomIfEmpty = useCallback(async () => {
    if (!roomDocRef) {
      return;
    }
    try {
      await runWithRetry(async () => {
        const serverNow = await fetchServerTime();
        await runTransaction(db, async transaction => {
          const snapshot = await transaction.get(roomDocRef);
          if (!snapshot.exists()) {
            return;
          }
          const normalized = normalizeRemoteState(
            parseGameDocument(snapshot.data({ serverTimestamps: 'estimate' }) as DocumentData),
          );
          if (!normalized.players.X.id && !normalized.players.O.id) {
            const lastActive = normalized.lastActivityAt ?? normalized.resultAt ?? null;
            if (!lastActive || serverNow - lastActive >= EMPTY_ROOM_RETENTION_MS) {
              transaction.delete(roomDocRef);
            }
          }
        });
      });
    } catch (error) {
      console.error('Failed to prune empty room', error);
    }
  }, [roomDocRef]);

  const leaveGame = useCallback(
    async (returnToLobby = false) => {
      if (leavingRoomRef.current) {
        return;
      }
      leavingRoomRef.current = true;
      try {
        clearHeartbeat();
        const currentSlot = playerSlotRef.current;
        const currentPlayerId = playerIdRef.current;
        playerSlotRef.current = null;
        setPlayerSlot(null);
        let clearedSlot = false;
        if (currentSlot) {
          await clearSlot(currentSlot);
          clearedSlot = true;
        } else if (currentPlayerId) {
          await clearSlotByPlayerId(currentPlayerId);
          clearedSlot = true;
        }
        if (clearedSlot) {
          await pruneRoomIfEmpty();
        }
        slotConfirmedRef.current = false;
        previousOpponentRef.current = null;
        lastResultAtRef.current = null;
        opponentDisconnectGraceUntilRef.current = 0;
        if (returnToLobby) {
          setRoomId(null);
        }
      } finally {
        leavingRoomRef.current = false;
      }
    },
    [clearHeartbeat, clearSlot, clearSlotByPlayerId, pruneRoomIfEmpty],
  );

  const leaveGameRef = useRef<(returnToLobby?: boolean) => Promise<void>>(async () => {});
  useEffect(() => {
    leaveGameRef.current = leaveGame;
  }, [leaveGame]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        void leaveGameRef.current(true);
      };
    }, []),
  );

  const ensureRoomCapacity = useCallback(async () => {
    try {
      const snapshot = await getDocs(
        query(collection(db, 'games'), orderBy('updatedAt', 'desc'), limit(MAX_ACTIVE_ROOMS + 5)),
      );
      const activeCount = snapshot.docs.reduce((count, docSnap) => {
        const normalized = normalizeRemoteState(
          parseGameDocument(docSnap.data({ serverTimestamps: 'estimate' }) as DocumentData),
        );
        return count + Number(Boolean(normalized.players.X.id || normalized.players.O.id));
      }, 0);
      return activeCount < MAX_ACTIVE_ROOMS;
    } catch (error) {
      console.error('Failed to check room capacity', error);
      return true;
    }
  }, []);

  const handleCreateRoom = useCallback(async () => {
    const desiredCode = sanitizeRoomCode(roomCodeInput);
    setRoomActionError(null);
    setCreatingRoom(true);
    try {
      const hasCapacity = await ensureRoomCapacity();
      if (!hasCapacity) {
        setRoomActionError(strings.tttMultiplayer.roomLimitReached(MAX_ACTIVE_ROOMS));
        return;
      }
      const code = await runWithRetry(async () => {
        if (desiredCode) {
          const candidateRef = doc(db, 'games', desiredCode);
          const snapshot = await getDoc(candidateRef);
          if (snapshot.exists()) {
            throw new Error('room-code-taken');
          }
          await initializeRoomDocument(candidateRef);
          return desiredCode;
        }
        for (let attempt = 0; attempt < MAX_ROOM_CREATE_ATTEMPTS; attempt += 1) {
          const candidate = generateRoomCode();
          const candidateRef = doc(db, 'games', candidate);
          const snapshot = await getDoc(candidateRef);
          if (snapshot.exists()) {
            continue;
          }
          await initializeRoomDocument(candidateRef);
          return candidate;
        }
        throw new Error('room-create-failed');
      });
      setRoomId(code);
      setRoomCodeInput(code);
    } catch (error) {
      console.error('Failed to create room', error);
      if ((error as Error).message === 'room-code-taken') {
        setRoomActionError(strings.tttMultiplayer.roomCodeTakenMessage);
      } else {
        setRoomActionError(strings.tttMultiplayer.joinFailedMessage);
      }
    } finally {
      setCreatingRoom(false);
    }
  }, [ensureRoomCapacity, roomCodeInput]);

  const handleSelectRoom = useCallback(
    async (input?: string) => {
      const code = sanitizeRoomCode(input ?? roomCodeInput);
      if (!code) {
        setRoomActionError(strings.tttMultiplayer.roomNotFoundMessage);
        return;
      }
      setRoomActionError(null);
      setJoiningRoom(true);
      try {
        const snapshot = await getDoc(doc(db, 'games', code));
        if (!snapshot.exists()) {
          setRoomActionError(strings.tttMultiplayer.roomNotFoundMessage);
          return;
        }
        setRoomId(code);
      } catch (error) {
        console.error('Failed to validate room', error);
        setRoomActionError(strings.tttMultiplayer.joinFailedMessage);
      } finally {
        setJoiningRoom(false);
      }
    },
    [roomCodeInput],
  );

  useEffect(() => {
    const roomsQuery = query(collection(db, 'games'), orderBy('updatedAt', 'desc'), limit(ROOM_LIST_LIMIT));
    let latestSnapshot: QuerySnapshot<DocumentData> | null = null;
    let processing = false;

    const processSnapshot = async (snapshot: QuerySnapshot<DocumentData>) => {
      if (processing) {
        latestSnapshot = snapshot;
        return;
      }
      processing = true;
      latestSnapshot = snapshot;
      try {
        const serverNow = await fetchServerTime();
        const cleanupCandidates: Array<{ ref: DocumentReference<DocumentData>; lastActivityAt: number | null }> = [];
        const stalePlayerCandidates: Array<{ ref: DocumentReference<DocumentData>; slots: PlayerSymbol[] }> = [];
        const nextRooms = snapshot.docs.map(docSnap => {
          const normalized = normalizeRemoteState(
            parseGameDocument(docSnap.data({ serverTimestamps: 'estimate' }) as DocumentData),
          );
          const effectivePlayers = cleanupPlayers(normalized.players, serverNow, STALE_PLAYER_THRESHOLD);
          const staleSlots = (['X', 'O'] as PlayerSymbol[]).filter(
            slot => normalized.players[slot].id && !effectivePlayers[slot].id,
          );
          if (staleSlots.length) {
            stalePlayerCandidates.push({ ref: docSnap.ref, slots: staleSlots });
          }
          const isEmpty = !effectivePlayers.X.id && !effectivePlayers.O.id;
          if (isEmpty) {
            cleanupCandidates.push({
              ref: docSnap.ref,
              lastActivityAt: normalized.lastActivityAt ?? normalized.resultAt ?? null,
            });
          }
          return {
            id: docSnap.id,
            status: normalized.status,
            players: effectivePlayers,
            lastActivityAt: normalized.lastActivityAt,
          };
        });
        setRooms(nextRooms);
        const expiredRooms = cleanupCandidates.filter(candidate => {
          if (!candidate.lastActivityAt) {
            return true;
          }
          return serverNow - candidate.lastActivityAt >= EMPTY_ROOM_RETENTION_MS;
        });
        if (expiredRooms.length) {
          await Promise.all(
            expiredRooms.map(candidate =>
              runWithRetry(async () => {
                await deleteDoc(candidate.ref);
              }),
            ),
          );
        }
        if (stalePlayerCandidates.length) {
          await Promise.all(
            stalePlayerCandidates.map(async ({ ref, slots }) => {
              for (const slot of slots) {
                await runWithRetry(() => clearSlotDocument(ref, slot));
              }
            }),
          );
        }
      } catch (error) {
        console.error('Failed to process lobby rooms', error);
      } finally {
        processing = false;
        if (latestSnapshot && latestSnapshot !== snapshot) {
          const pendingSnapshot = latestSnapshot;
          latestSnapshot = null;
          await processSnapshot(pendingSnapshot);
        }
      }
    };

    const unsubscribe = onSnapshot(roomsQuery, snapshot => {
      void processSnapshot(snapshot);
    });

    const interval = setInterval(() => {
      if (latestSnapshot) {
        void processSnapshot(latestSnapshot);
      }
    }, STALE_PLAYER_THRESHOLD);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const renderLobbyRoom = useCallback<ListRenderItem<LobbyRoom>>(
    ({ item }) => {
      const connected = Number(Boolean(item.players.X.id)) + Number(Boolean(item.players.O.id));
      const statusText =
        item.status === 'playing'
          ? strings.tttMultiplayer.roomStatusPlaying
          : strings.tttMultiplayer.roomStatusWaiting;
      return (
        <TouchableOpacity style={styles.roomCard} onPress={() => void handleSelectRoom(item.id)}>
          <View style={styles.roomCardInfo}>
            <Text style={styles.roomCode}>{item.id}</Text>
            <Text style={styles.roomMeta}>{statusText}</Text>
          </View>
          <View style={styles.roomBadge}>
            <Text style={styles.roomBadgeValue}>{`${connected}/2`}</Text>
          </View>
        </TouchableOpacity>
      );
    },
    [handleSelectRoom],
  );

  const joinGame = useCallback(async () => {
    if (leavingRoomRef.current) {
      return;
    }
    if (!playerId || playerSlot || !roomDocRef || joinInFlightRef.current) {
      return;
    }
    joinInFlightRef.current = true;
    const attemptJoin = async (attempt: number): Promise<void> => {
      const serverNow = await fetchServerTime();
      try {
        const slot = await runTransaction(db, async transaction => {
          const snapshot = await transaction.get(roomDocRef);
          if (!snapshot.exists()) {
            throw new Error('room-missing');
          }
          const docData = parseGameDocument(snapshot.data({ serverTimestamps: 'estimate' }) as DocumentData);
          const normalizedDoc = normalizeRemoteState(docData);
          const cleanedPlayers = cleanupPlayers(normalizedDoc.players, serverNow, STALE_PLAYER_THRESHOLD);
          const slotsToClear = (['X', 'O'] as PlayerSymbol[]).filter(
            slotKey => normalizedDoc.players[slotKey].id && !cleanedPlayers[slotKey].id,
          );
          const chosenSlot = chooseSlotForPlayer(cleanedPlayers, playerId);
          if (!chosenSlot) {
            throw new Error('room-full');
          }
          const slotWasEmpty = !cleanedPlayers[chosenSlot].id;
          const opponentSlotForJoin = getOpponentSlot(chosenSlot);
          const opponentActiveBeforeJoin = Boolean(cleanedPlayers[opponentSlotForJoin].id);
          cleanedPlayers[chosenSlot] = { id: playerId, lastSeen: serverNow };
          const nextState: RemoteGameState = {
            ...normalizedDoc,
            players: cleanedPlayers,
          };
          const playersUpdate: Record<string, unknown> = {};
          slotsToClear.forEach(slotKey => {
            playersUpdate[slotKey] = { id: null, lastSeen: null };
          });
          playersUpdate[chosenSlot] = { id: playerId, lastSeen: serverTimestamp() };
          const update: Record<string, unknown> = {
            players: playersUpdate,
            updatedAt: serverTimestamp(),
            lastActivityAt: serverTimestamp(),
          };
          const shouldResetAfterFinishedForfeit =
            normalizedDoc.status === 'finished' && slotWasEmpty && opponentActiveBeforeJoin;

          if (shouldStartRound(nextState) || shouldResetAfterFinishedForfeit) {
            const opening = nextState.nextStarter ?? 'X';
            update.board = createEmptyBoard();
            update.currentTurn = opening;
            update.status = 'playing';
            update.winner = null;
            update.resultAt = null;
            update.rematchVotes = { X: false, O: false };
            update.nextStarter = getOpponentSlot(opening);
          }

          transaction.set(roomDocRef, update, { merge: true });
          return chosenSlot;
        });
        setPlayerSlot(slot);
      } catch (error) {
        const message = (error as Error).message;
        const isRoomFull = message === 'room-full';
        const isRoomMissing = message === 'room-missing';
        const isFirebaseError = error instanceof FirebaseError;
        const shouldRetry =
          !isRoomFull &&
          !isRoomMissing &&
          isFirebaseError &&
          RETRYABLE_FIRESTORE_CODES.has(error.code) &&
          attempt + 1 < JOIN_RETRY_LIMIT;

        if (shouldRetry) {
          const backoff = JOIN_RETRY_DELAY_MS * Math.pow(2, attempt);
          await delay(backoff);
          return attemptJoin(attempt + 1);
        }

        if (isRoomFull) {
          showAlert(strings.tttMultiplayer.roomFullTitle, strings.tttMultiplayer.roomFullMessage, [
            { text: strings.common.menu, onPress: () => navigation.navigate('Home') },
          ]);
        } else if (isRoomMissing) {
          setRoomActionError(strings.tttMultiplayer.roomNotFoundMessage);
          setRoomId(null);
        } else {
          console.error('Failed to join game', error);
          if (isFirebaseError) {
            showAlert(strings.tttMultiplayer.joinFailedTitle, strings.tttMultiplayer.joinFailedMessage);
          }
        }
      }
    };

    try {
      await attemptJoin(0);
    } finally {
      joinInFlightRef.current = false;
    }
  }, [navigation, playerId, playerSlot, roomDocRef]);

  useEffect(() => {
    if (leavingRoomRef.current) {
      return;
    }
    if (playerId && !playerSlot && roomDocRef) {
      void joinGame();
    }
  }, [joinGame, playerId, playerSlot, roomDocRef]);

  const handleTap = useCallback(
    async (index: number) => {
      if (!playerSlot || !roomDocRef) {
        return;
      }
      try {
        await runWithRetry(async () => {
          await runTransaction(db, async transaction => {
            const snapshot = await transaction.get(roomDocRef);
            if (!snapshot.exists()) {
              return;
            }
            const remote = normalizeRemoteState(
              parseGameDocument(snapshot.data({ serverTimestamps: 'estimate' }) as DocumentData),
            );
            if (remote.status !== 'playing' || remote.currentTurn !== playerSlot || remote.board[index] !== '') {
              return;
            }
            const timestampValue = serverTimestamp();
            const board = [...remote.board];
            board[index] = playerSlot;
            const winner = evaluateBoardWinner(board);
            const update: Record<string, unknown> = {
              board,
              rematchVotes: { X: false, O: false },
              updatedAt: timestampValue,
              lastActivityAt: timestampValue,
            };
            if (winner) {
              update.status = 'finished';
              update.winner = winner;
              update.resultAt = timestampValue;
            } else {
              update.currentTurn = getOpponentSlot(playerSlot);
            }
            transaction.set(roomDocRef, update, { merge: true });
          });
        });
      } catch (error) {
        console.error('Failed to make move', error);
      }
    },
    [playerSlot, roomDocRef],
  );

  const handleRematchVote = useCallback(async () => {
    if (!playerSlot || !roomDocRef) {
      return;
    }
    try {
      await runWithRetry(async () => {
        await runTransaction(db, async transaction => {
          const snapshot = await transaction.get(roomDocRef);
          if (!snapshot.exists()) {
            return;
          }
          const remote = normalizeRemoteState(
            parseGameDocument(snapshot.data({ serverTimestamps: 'estimate' }) as DocumentData),
          );
          if (!remote.players[playerSlot].id) {
            return;
          }
          const votes = {
            ...remote.rematchVotes,
            [playerSlot]: true,
          };
          const timestampValue = serverTimestamp();
          const update: Record<string, unknown> = {
            rematchVotes: votes,
            updatedAt: timestampValue,
          };
          if (shouldAutoStartRematch(votes) && remote.players.X.id && remote.players.O.id) {
            const opening = remote.nextStarter ?? 'X';
            update.board = createEmptyBoard();
            update.currentTurn = opening;
            update.status = 'playing';
            update.winner = null;
            update.resultAt = null;
            update.rematchVotes = { X: false, O: false };
            update.nextStarter = getOpponentSlot(opening);
            update.lastActivityAt = timestampValue;
          }
          transaction.set(roomDocRef, update, { merge: true });
        });
      });
    } catch (error) {
      console.error('Failed to request rematch', error);
    }
  }, [playerSlot, roomDocRef]);

  useEffect(() => {
    if (!roomDocRef) {
      return;
    }
    const unsubscribeDoc = onSnapshot(roomDocRef, snapshot => {
      if (!snapshot.exists()) {
        setGameState(null);
        if (!leavingRoomRef.current) {
          showAlert(strings.tttMultiplayer.roomNotFoundTitle, strings.tttMultiplayer.roomNotFoundMessage);
          void leaveGameRef.current(true);
        }
        return;
      }
      setGameState(
        normalizeRemoteState(parseGameDocument(snapshot.data({ serverTimestamps: 'estimate' }) as DocumentData)),
      );
    });
    return unsubscribeDoc;
  }, [roomDocRef]);

  useEffect(() => {
    if (!gameState || gameState.status !== 'finished' || !gameState.resultAt) {
      return;
    }
    if (lastResultAtRef.current === gameState.resultAt) {
      return;
    }
    lastResultAtRef.current = gameState.resultAt;
    opponentDisconnectGraceUntilRef.current = gameState.resultAt + OPPONENT_DISCONNECT_GRACE_MS;
    if (gameState.winner && gameState.winner !== 'draw' && gameState.winner === playerSlot) {
      void updateTttWins();
    }
  }, [gameState, playerSlot]);

  useEffect(() => {
    if (!gameState || !playerSlot || !playerId) {
      return;
    }
    const slotInfo = gameState.players[playerSlot];
    if (slotInfo.id === playerId) {
      slotConfirmedRef.current = true;
      return;
    }
    if (!slotConfirmedRef.current) {
      return;
    }
    setPlayerSlot(null);
    slotConfirmedRef.current = false;
    previousOpponentRef.current = null;
  }, [gameState, playerId, playerSlot]);

  useEffect(() => {
    if (!gameState) {
      previousOpponentRef.current = null;
      lastOpponentHeartbeatRef.current = null;
      opponentOverrideDisconnectedRef.current = false;
      lastOpponentAlertIdRef.current = null;
      setOpponentOverrideDisconnected(false);
      return;
    }
    if (!playerSlot) {
      previousOpponentRef.current = null;
      lastOpponentHeartbeatRef.current = null;
      return;
    }
    const serverNow = computeServerAlignedNow(gameState, playerSlot);
    const opponentSlot = getOpponentSlot(playerSlot);
    const opponentInfo = gameState.players[opponentSlot];
    const opponentId = opponentInfo.id;
    const lastSeen = opponentInfo.lastSeen ?? null;
    if (opponentId) {
      const previousHeartbeat = lastOpponentHeartbeatRef.current;
      const hasNewHeartbeat = lastSeen !== null && (previousHeartbeat === null || lastSeen > previousHeartbeat);
      lastOpponentHeartbeatRef.current = lastSeen;
      previousOpponentRef.current = opponentId;
      if (hasNewHeartbeat && serverNow !== null) {
        opponentDisconnectGraceUntilRef.current = serverNow + OPPONENT_DISCONNECT_GRACE_MS;
      }
      if (opponentOverrideDisconnectedRef.current && lastOpponentAlertIdRef.current && !hasNewHeartbeat) {
        return;
      }
      opponentOverrideDisconnectedRef.current = false;
      lastOpponentAlertIdRef.current = null;
      setOpponentOverrideDisconnected(false);
      return;
    }
    if (serverNow === null) {
      previousOpponentRef.current = null;
      return;
    }
    const previousId = previousOpponentRef.current;
    const shouldAlert = shouldShowOpponentLeftAlert(
      previousId,
      opponentId,
      opponentDisconnectGraceUntilRef.current,
      serverNow,
      lastOpponentHeartbeatRef.current,
      lastSeen,
    );
    previousOpponentRef.current = null;
    if (shouldAlert && lastOpponentAlertIdRef.current !== previousId) {
      lastOpponentAlertIdRef.current = previousId ?? '__none__';
      opponentOverrideDisconnectedRef.current = true;
      setOpponentOverrideDisconnected(true);
      showAlert(strings.tttMultiplayer.opponentLeftTitle, strings.tttMultiplayer.opponentLeftMessage);
      if (gameState?.status === 'playing') {
        void clearSlot(opponentSlot, { forceForfeit: true });
      }
    }
  }, [clearSlot, gameState, playerSlot]);

  useEffect(() => {
    if (!gameState) {
      return;
    }
    const serverNow = computeServerAlignedNow(gameState, playerSlot);
    if (serverNow === null) {
      return;
    }
    if (gameState.status === 'finished' && gameState.resultAt && serverNow - gameState.resultAt < STALE_PLAYER_THRESHOLD) {
      return;
    }
    (['X', 'O'] as PlayerSymbol[]).forEach(slot => {
      const info = gameState.players[slot];
      if (info.id && info.lastSeen && serverNow - info.lastSeen > STALE_PLAYER_THRESHOLD && !clearingSlotRef.current[slot]) {
        clearingSlotRef.current[slot] = true;
        void clearSlot(slot).finally(() => {
          clearingSlotRef.current[slot] = false;
        });
      }
    });
  }, [clearSlot, gameState, playerSlot]);

  if (!roomId) {
    const lobbyHeader = (
      <View style={styles.lobbyHeader}>
        <View style={styles.headerStack}>
          <Text style={styles.title}>{strings.tttMultiplayer.lobbyTitle}</Text>
        </View>
        {roomActionError && <Text style={styles.errorText}>{roomActionError}</Text>}
        <TouchableOpacity style={styles.primaryButton} onPress={() => void handleCreateRoom()} disabled={creatingRoom}>
          {creatingRoom ? (
            <ActivityIndicator color={colors.textLight} />
          ) : (
            <Text style={styles.primaryButtonText}>{strings.tttMultiplayer.createRoom}</Text>
          )}
        </TouchableOpacity>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder={strings.tttMultiplayer.roomCodePlaceholder}
            placeholderTextColor={colors.textMuted}
            value={roomCodeInput}
            autoCapitalize="characters"
            onChangeText={text => setRoomCodeInput(sanitizeRoomCode(text))}
          />
          <TouchableOpacity style={styles.joinButton} onPress={() => void handleSelectRoom()} disabled={joiningRoom}>
            {joiningRoom ? (
              <ActivityIndicator color={colors.textLight} />
            ) : (
              <Text style={styles.joinButtonText}>{strings.tttMultiplayer.joinRoom}</Text>
            )}
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => {
            navigation.navigate('Home');
          }}
        >
          <Text style={styles.homeButtonText}>{strings.common.backToMenu}</Text>
        </TouchableOpacity>
        <Text style={styles.sectionLabel}>{strings.tttMultiplayer.roomListTitle}</Text>
      </View>
    );
    return (
      <LinearGradient colors={colors.gradient} style={styles.gradient}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.panel}>
            <FlatList
              data={rooms}
              keyExtractor={room => room.id}
              renderItem={renderLobbyRoom}
              ListHeaderComponent={lobbyHeader}
              ListEmptyComponent={<Text style={styles.emptyState}>{strings.tttMultiplayer.roomListEmpty}</Text>}
              contentContainerStyle={styles.lobbyListContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={styles.roomList}
            />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!playerSlot) {
    return (
      <LinearGradient colors={colors.gradient} style={styles.gradient}>
        <SafeAreaView style={styles.safe}>
          <View style={[styles.panel, styles.centeredPanel]}>
            <Text style={styles.waitingText}>{strings.tttMultiplayer.assigningPlayer}</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!gameState) {
    return (
      <LinearGradient colors={colors.gradient} style={styles.gradient}>
        <SafeAreaView style={styles.safe}>
          <View style={[styles.panel, styles.centeredPanel]}>
            <ActivityIndicator size="large" color={colors.quizPrimary} />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const opponentSlot = getOpponentSlot(playerSlot);
  const opponentConnected = Boolean(gameState.players[opponentSlot].id) && !opponentOverrideDisconnected;
  const effectiveStatus = opponentOverrideDisconnected ? 'waiting' : gameState.status;
  const effectiveBoard = opponentOverrideDisconnected ? createEmptyBoard() : gameState.board;
  const waitingForOpponent = effectiveStatus === 'waiting' || !opponentConnected;
  const isMyTurn = effectiveStatus === 'playing' && gameState.currentTurn === playerSlot && opponentConnected;
  const youVoted = Boolean(gameState.rematchVotes[playerSlot]);
  const activePlayers =
    (['X', 'O'] as PlayerSymbol[]).filter(slot => gameState.players[slot].id).length || 0;
  const rematchGoal = Math.max(activePlayers, 2);
  const rematchVotesCount = Number(gameState.rematchVotes.X) + Number(gameState.rematchVotes.O);
  const rematchReady = rematchVotesCount >= rematchGoal;
  const rematchStatusText = rematchReady
    ? strings.tttMultiplayer.rematchReady
    : strings.tttMultiplayer.rematchVotesLabel(rematchVotesCount, rematchGoal);
  const rematchCtaText = youVoted ? strings.tttMultiplayer.rematchPending : strings.tttMultiplayer.rematchRequest;

  return (
    <LinearGradient colors={colors.gradient} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <View style={[styles.panel, styles.gamePanel]}>
          <View style={styles.headerStack}>
            <Text style={styles.title}>{strings.tttMultiplayer.title}</Text>
            <Text style={styles.subtitle}>{strings.tttMultiplayer.currentRoom(roomId)}</Text>
          </View>
          <View style={styles.statusChips}>
            <View style={styles.statusChip}>
              <Text style={styles.statusChipText}>{strings.tttMultiplayer.youAre(playerSlot)}</Text>
            </View>
            <View style={styles.statusChip}>
              <Text style={styles.statusChipText}>{strings.tttMultiplayer.currentTurn(gameState.currentTurn)}</Text>
            </View>
          </View>
          {waitingForOpponent && (
            <Text style={styles.waitingText}>{strings.tttMultiplayer.waitingForOpponent}</Text>
          )}
          <View style={styles.boardContainer}>
            <View style={styles.board}>
              {effectiveBoard.map((cell, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.cell}
                  onPress={() => void handleTap(index)}
                  disabled={!isMyTurn || waitingForOpponent || cell !== ''}
                >
                  <Text style={styles.symbol}>{cell}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          {gameState.status === 'finished' && opponentConnected && (
            <View style={styles.rematchCard}>
              <Text style={styles.resultTitle}>{strings.tttMultiplayer.gameFinishedTitle}</Text>
              <Text style={styles.resultMessage}>
                {gameState.winner === 'draw'
                  ? strings.tttMultiplayer.drawMessage
                  : strings.tttMultiplayer.playerWins(gameState.winner ?? playerSlot ?? 'X')}
              </Text>
              <Text style={styles.rematchStatusText}>{rematchStatusText}</Text>
              <TouchableOpacity
                style={[styles.primaryButton, youVoted && styles.primaryButtonDisabled]}
                onPress={() => void handleRematchVote()}
                disabled={youVoted}
              >
                <Text style={styles.primaryButtonText}>{rematchCtaText}</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.leaveButton}
              onPress={() => {
                void leaveGame(true);
              }}
            >
              <Text style={styles.leaveButtonText}>{strings.tttMultiplayer.leaveRoom}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.homeButton}
              onPress={() => {
                void leaveGame(true);
                navigation.navigate('Home');
              }}
            >
              <Text style={styles.homeButtonText}>{strings.common.backToMenu}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1, padding: 20 },
  panel: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 24,
    ...surfaces.roundedCard,
    borderWidth: 0,
  },
  gamePanel: {
    gap: 18,
    alignItems: 'center',
  },
  centeredPanel: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  lobbyListContent: {
    paddingBottom: 32,
    gap: 12,
    alignItems: 'stretch',
  },
  lobbyHeader: {
    width: '100%',
    gap: 14,
    marginBottom: 12,
    alignItems: 'center',
  },
  headerStack: {
    alignItems: 'center',
    gap: 6,
  },
  title: { fontSize: 28, fontWeight: '800', color: colors.textLight, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  waitingText: { fontSize: 15, color: colors.textMuted, textAlign: 'center' },
  sectionLabel: {
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textMuted,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: colors.textLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: { color: colors.textLight, fontSize: 16, fontWeight: '700' },
  joinButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: colors.score,
    alignItems: 'center',
  },
  joinButtonText: { color: colors.textLight, fontSize: 15, fontWeight: '600' },
  homeButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  homeButtonText: { color: colors.textLight, fontSize: 15, fontWeight: '600' },
  roomList: { flex: 1, width: '100%' },
  roomCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 18,
    backgroundColor: colors.surface,
    ...surfaces.roundedCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roomCardInfo: {
    gap: 4,
  },
  roomCode: { fontSize: 18, fontWeight: '700', color: colors.textLight },
  roomMeta: { fontSize: 13, color: colors.textMuted },
  roomBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  roomBadgeValue: { color: colors.textLight, fontSize: 14, fontWeight: '600' },
  emptyState: { textAlign: 'center', color: colors.textMuted, paddingVertical: 24 },
  errorText: {
    color: colors.quizIncorrect,
    textAlign: 'center',
  },
  statusChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  statusChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  statusChipText: { color: colors.textLight, fontSize: 13, fontWeight: '600' },
  boardContainer: { width: '100%', alignItems: 'center' },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 300,
    height: 300,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  cell: {
    width: '33.33%',
    height: '33.33%',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbol: { fontSize: 40, color: colors.textLight, fontWeight: '700' },
  rematchCard: {
    width: '100%',
    alignItems: 'center',
    gap: 6,
    padding: 18,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  resultTitle: { fontSize: 18, fontWeight: '700', color: colors.textLight, textAlign: 'center' },
  resultMessage: { fontSize: 15, color: colors.textLight, textAlign: 'center' },
  rematchStatusText: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  actions: { width: '100%', gap: 12 },
  leaveButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(248,113,113,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.45)',
  },
  leaveButtonText: { color: colors.quizIncorrect, fontSize: 15, fontWeight: '600' },
});
