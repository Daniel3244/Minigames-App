import {
  chooseSlotForPlayer,
  cleanupPlayers,
  createEmptyBoard,
  createInitialRemoteDocState,
  createInitialRemoteState,
  evaluateBoardWinner,
  generateRoomCode,
  getOpponentSlot,
  normalizeRemoteState,
  shouldAutoStartRematch,
  shouldShowOpponentLeftAlert,
  shouldStartRound,
} from '../logic/ticTacToeMultiplayer';

describe('tic-tac-toe multiplayer helpers', () => {
  it('chooses an available slot or preserves an existing assignment', () => {
    const base = createInitialRemoteState();
    expect(chooseSlotForPlayer(base.players, 'user-a')).toBe('X');
    const occupied = {
      ...base.players,
      X: { id: 'user-a', lastSeen: 1 },
      O: { id: 'user-b', lastSeen: 1 },
    };
    expect(chooseSlotForPlayer(occupied, 'user-a')).toBe('X');
    expect(chooseSlotForPlayer(occupied, 'user-b')).toBe('O');
    expect(chooseSlotForPlayer(occupied, 'user-c')).toBeNull();
  });

  it('cleans up stale players based on last seen timestamp', () => {
    const now = 10_000;
    const cleaned = cleanupPlayers(
      {
        X: { id: 'user-a', lastSeen: now - 1_000 },
        O: { id: 'user-b', lastSeen: now - 20_000 },
      },
      now,
      5_000,
    );
    expect(cleaned.X.id).toBe('user-a');
    expect(cleaned.O.id).toBeNull();
  });

  it('determines when a round should start', () => {
    const state = createInitialRemoteState();
    expect(shouldStartRound(state)).toBe(false);
    state.players.X.id = 'user-a';
    state.players.O.id = 'user-b';
    expect(shouldStartRound(state)).toBe(true);
    state.status = 'playing';
    expect(shouldStartRound(state)).toBe(false);
  });

  it('evaluates board winners and draws', () => {
    expect(evaluateBoardWinner(['X', 'X', 'X', '', '', '', '', '', ''])).toBe('X');
    expect(evaluateBoardWinner(['X', 'O', 'X', 'O', 'O', 'X', 'X', 'X', 'O'])).toBe('draw');
    expect(evaluateBoardWinner(['X', 'O', 'X', '', '', '', '', '', ''])).toBeNull();
  });

  it('normalizes remote state data defensively', () => {
    const normalized = normalizeRemoteState({
      board: ['X', 'O', 'X'] as any,
      currentTurn: 'O',
      status: 'playing',
      winner: 'X',
      resultAt: 123,
      players: {
        X: { id: 'user-a', lastSeen: 1 },
        O: { id: 'user-b', lastSeen: 2 },
      },
      nextStarter: 'O',
    });
    expect(normalized.board).toHaveLength(9);
    expect(normalized.currentTurn).toBe('O');
    expect(normalized.status).toBe('playing');
    expect(normalized.players.X.id).toBe('user-a');
    expect(normalized.players.X.lastSeen).toBe(1);
    expect(normalized.nextStarter).toBe('O');
  });

  it('returns opponent slot utility', () => {
    expect(getOpponentSlot('X')).toBe('O');
    expect(getOpponentSlot('O')).toBe('X');
  });

  it('provides helpers for rematch and rooms', () => {
    const docState = createInitialRemoteDocState();
    expect(docState.rematchVotes.X).toBe(false);
    expect(docState.nextStarter).toBe('X');
    expect(shouldAutoStartRematch({ X: true, O: true })).toBe(true);
    expect(shouldAutoStartRematch({ X: true, O: false })).toBe(false);
    const code = generateRoomCode();
    expect(code).toHaveLength(5);
    expect(code).toMatch(/^[A-Z0-9]+$/);
  });

  it('determines when to show opponent disconnect alerts', () => {
    const grace = Date.now() + 5_000;
    expect(shouldShowOpponentLeftAlert(null, null, grace, grace + 10, null, null)).toBe(false);
    expect(shouldShowOpponentLeftAlert('user-a', null, grace, grace - 1, 10, 5)).toBe(false);
    expect(shouldShowOpponentLeftAlert('user-a', null, grace, grace + 1, 10, 5)).toBe(true);
    expect(shouldShowOpponentLeftAlert('user-a', 'user-a', grace, grace + 1, 10, 15)).toBe(false);
    expect(shouldShowOpponentLeftAlert('user-a', null, grace, grace + 1, 10, 20)).toBe(false);
  });

  it('simulates a full multiplayer session with two players', () => {
    const playerA = 'alpha';
    const playerB = 'bravo';
    const now = 10_000;

    let state = createInitialRemoteState();
    expect(state.nextStarter).toBe('X');
    let players = cleanupPlayers(state.players, now, 5_000);
    const slotA = chooseSlotForPlayer(players, playerA);
    expect(slotA).toBe('X');
    players[slotA!] = { id: playerA, lastSeen: now };
    state = { ...state, players };

    players = cleanupPlayers(state.players, now + 2_000, 5_000);
    const slotB = chooseSlotForPlayer(players, playerB);
    expect(slotB).toBe('O');
    players[slotB!] = { id: playerB, lastSeen: now + 2_000 };
    state = { ...state, players };

    expect(shouldStartRound(state)).toBe(true);
    const opening = state.nextStarter;
    state = {
      ...state,
      status: 'playing',
      board: createEmptyBoard(),
      currentTurn: opening,
      nextStarter: getOpponentSlot(opening),
    };

    const plannedMoves: Array<{ slot: 'X' | 'O'; index: number }> = [
      { slot: 'X', index: 0 },
      { slot: 'O', index: 3 },
      { slot: 'X', index: 1 },
      { slot: 'O', index: 4 },
      { slot: 'X', index: 2 },
    ];

    let board = [...state.board];
    let turn: 'X' | 'O' = state.currentTurn;
    let winner = null;

    plannedMoves.forEach(move => {
      expect(move.slot).toBe(turn);
      expect(board[move.index]).toBe('');
      board[move.index] = move.slot;
      winner = evaluateBoardWinner(board);
      if (!winner) {
        turn = getOpponentSlot(turn);
      }
    });

    expect(winner).toBe('X');
    expect(board).toEqual(['X', 'X', 'X', 'O', 'O', '', '', '', '']);

    const rematchVotes = { X: true, O: true };
    expect(shouldAutoStartRematch(rematchVotes)).toBe(true);
  });

  it('allows a fresh player to claim a stale room slot', () => {
    const state = createInitialRemoteState();
    const now = 1_000;
    const stale = {
      X: { id: 'old-player', lastSeen: now - 10_000 },
      O: { id: null, lastSeen: null },
    };
    const cleaned = cleanupPlayers(stale, now, 5_000);
    expect(cleaned.X.id).toBeNull();
    cleaned.X = { id: 'new-player', lastSeen: now };
    const refreshed = { ...state, players: cleaned };
    expect(shouldStartRound(refreshed)).toBe(false);
    cleaned.O = { id: 'second-player', lastSeen: now + 1_000 };
    expect(shouldStartRound({ ...refreshed, players: cleaned })).toBe(true);
  });
});
