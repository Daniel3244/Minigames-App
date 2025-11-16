import { PlayerSymbol, winningLines } from './ticTacToe';

export type GameStatus = 'waiting' | 'playing' | 'finished';
export type GameWinner = PlayerSymbol | 'draw' | null;

export type PlayerPresence = {
  id: string | null;
  lastSeen: number | null;
};

export type RematchVotes = Record<PlayerSymbol, boolean>;

export type RemoteGameState = {
  board: string[];
  currentTurn: PlayerSymbol;
  status: GameStatus;
  winner: GameWinner;
  resultAt: number | null;
  lastActivityAt: number | null;
  players: Record<PlayerSymbol, PlayerPresence>;
  rematchVotes: RematchVotes;
  nextStarter: PlayerSymbol;
};

const normalizePresence = (presence?: PlayerPresence): PlayerPresence => ({
  id: presence?.id ?? null,
  lastSeen: typeof presence?.lastSeen === 'number' ? presence.lastSeen : null,
});

const normalizeRematchVotes = (votes?: Partial<RematchVotes>): RematchVotes => ({
  X: Boolean(votes?.X),
  O: Boolean(votes?.O),
});

export const createEmptyBoard = () => Array(9).fill('');

export const createInitialRemoteState = (): RemoteGameState => ({
  board: createEmptyBoard(),
  currentTurn: 'X',
  status: 'waiting',
  winner: null,
  resultAt: null,
  lastActivityAt: null,
  players: {
    X: { id: null, lastSeen: null },
    O: { id: null, lastSeen: null },
  },
  rematchVotes: {
    X: false,
    O: false,
  },
  nextStarter: 'X',
});

export const createInitialRemoteDocState = () => ({ ...createInitialRemoteState() });

export const normalizeRemoteState = (state?: Partial<RemoteGameState>): RemoteGameState => {
  const defaults = createInitialRemoteState();
  return {
    board: Array.isArray(state?.board) && state?.board.length === 9 ? (state?.board as string[]) : defaults.board,
    currentTurn: state?.currentTurn === 'O' ? 'O' : 'X',
    status: state?.status ?? defaults.status,
    winner: state?.winner === 'X' || state?.winner === 'O' || state?.winner === 'draw' ? state.winner : null,
    resultAt: typeof state?.resultAt === 'number' ? state.resultAt : null,
    lastActivityAt: typeof state?.lastActivityAt === 'number' ? state.lastActivityAt : null,
    players: {
      X: normalizePresence(state?.players?.X),
      O: normalizePresence(state?.players?.O),
    },
    rematchVotes: normalizeRematchVotes(state?.rematchVotes),
    nextStarter: state?.nextStarter === 'O' ? 'O' : 'X',
  };
};

export const cleanupPlayers = (
  players: RemoteGameState['players'],
  now: number,
  threshold: number,
): RemoteGameState['players'] => {
  const result: RemoteGameState['players'] = {
    X: { ...players.X },
    O: { ...players.O },
  };

  (['X', 'O'] as PlayerSymbol[]).forEach(slot => {
    const info = result[slot];
    if (!info.id) {
      result[slot] = { id: null, lastSeen: null };
      return;
    }
    if (!info.lastSeen || now - info.lastSeen > threshold) {
      result[slot] = { id: null, lastSeen: null };
    }
  });

  return result;
};

export const chooseSlotForPlayer = (players: RemoteGameState['players'], playerId: string): PlayerSymbol | null => {
  if (players.X.id === playerId) {
    return 'X';
  }
  if (players.O.id === playerId) {
    return 'O';
  }
  if (!players.X.id) {
    return 'X';
  }
  if (!players.O.id) {
    return 'O';
  }
  return null;
};

export const shouldStartRound = (state: RemoteGameState) =>
  state.status === 'waiting' && Boolean(state.players.X.id && state.players.O.id);

export const evaluateBoardWinner = (board: string[]): GameWinner => {
  for (const [a, b, c] of winningLines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] as PlayerSymbol;
    }
  }
  return board.includes('') ? null : 'draw';
};

export const getOpponentSlot = (slot: PlayerSymbol): PlayerSymbol => (slot === 'X' ? 'O' : 'X');

export const shouldAutoStartRematch = (votes: RematchVotes) => votes.X && votes.O;

export const generateRoomCode = (length = 5) => {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i += 1) {
    const index = Math.floor(Math.random() * alphabet.length);
    result += alphabet[index];
  }
  return result;
};

export const shouldShowOpponentLeftAlert = (
  previousOpponentId: string | null,
  currentOpponentId: string | null,
  graceUntil: number,
  now: number,
  previousHeartbeatAt: number | null,
  lastHeartbeatAt: number | null,
) => {
  if (!previousOpponentId) {
    return false;
  }
  if (currentOpponentId) {
    return false;
  }
  if (previousHeartbeatAt === null || lastHeartbeatAt === null) {
    return now >= graceUntil;
  }
  return lastHeartbeatAt <= previousHeartbeatAt && now >= graceUntil;
};
