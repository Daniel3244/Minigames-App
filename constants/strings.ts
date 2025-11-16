export type LocaleKey = 'en' | 'pl';

type Strings = {
  common: {
    menu: string;
    backToMenu: string;
    playAgain: string;
    tryAgain: string;
    reset: string;
    ok: string;
  };
  home: {
    title: string;
    menuItems: {
      memory: string;
      quiz: string;
      hangman: string;
      tap: string;
      ttt: string;
      tttMultiplayer: string;
      scoreboard: string;
    };
  };
  memoryGame: {
    scoreboard: (score: number, total: number) => string;
    winTitle: string;
    winMessage: string;
  };
  hangman: {
    title: (attempts: number, maxAttempts: number) => string;
    winTitle: string;
    winMessage: (word: string) => string;
    loseTitle: string;
    loseMessage: (word: string) => string;
  };
  quiz: {
    score: (value: number) => string;
    highScore: (value: number) => string;
    finishTitle: string;
    finishMessage: (score: number, total: number) => string;
    error: string;
    retry: string;
  };
  tap: {
    time: (seconds: number) => string;
    taps: (count: number) => string;
    best: (value: number) => string;
    start: string;
    tap: string;
    timeUpTitle: string;
    timeUpMessage: (count: number) => string;
  };
  ttt: {
    title: string;
    playerWin: string;
    computerWin: string;
    draw: string;
  };
  tttMultiplayer: {
    title: string;
    youAre: (symbol: string) => string;
    currentTurn: (symbol: string) => string;
    currentRoom: (code: string) => string;
    lobbyTitle: string;
    createRoom: string;
    joinRoom: string;
    roomCodeLabel: string;
    roomCodePlaceholder: string;
    roomListTitle: string;
    roomListEmpty: string;
    roomStatusWaiting: string;
    roomStatusPlaying: string;
    roomFullTitle: string;
    roomFullMessage: string;
    joinFailedTitle: string;
    joinFailedMessage: string;
    roomNotFoundTitle: string;
    roomNotFoundMessage: string;
    roomCodeTakenMessage: string;
    roomLimitReached: (limit: number) => string;
    opponentLeftTitle: string;
    opponentLeftMessage: string;
    gameFinishedTitle: string;
    playerWins: (symbol: string) => string;
    drawTitle: string;
    drawMessage: string;
    assigningPlayer: string;
    waitingForOpponent: string;
    rematchVotesLabel: (count: number, total: number) => string;
    rematchRequest: string;
    rematchPending: string;
    rematchReady: string;
    leaveRoom: string;
  };
  scoreboard: {
    title: string;
    labels: {
      memory: string;
      quiz: string;
      tap: string;
      ttt: string;
      tttMultiplayer: string;
    };
    values: {
      memory: (wins: number) => string;
      quiz: (score: number) => string;
      tap: (score: number) => string;
      ttt: (wins: number) => string;
      tttMultiplayer: (wins: number) => string;
    };
  };
};

const base: Strings = {
  common: {
    menu: 'Menu',
    backToMenu: 'Back to menu',
    playAgain: 'Play again',
    tryAgain: 'Try again',
    reset: 'Reset',
    ok: 'OK',
  },
  home: {
    title: 'Mini Games',
    menuItems: {
      memory: 'Memory Game',
      quiz: 'Quiz',
      hangman: 'Hangman',
      tap: 'Tap Challenge',
      ttt: 'Tic Tac Toe',
      tttMultiplayer: 'Tic Tac Toe Multiplayer',
      scoreboard: 'Scoreboard',
    },
  },
  memoryGame: {
    scoreboard: (score, total) => `Pairs: ${score}/${total}`,
    winTitle: 'You win!',
    winMessage: 'Great job!',
  },
  hangman: {
    title: (attempts, max) => `Hangman (${attempts}/${max})`,
    winTitle: 'You win!',
    winMessage: word => `You guessed the word: ${word}`,
    loseTitle: 'You lost!',
    loseMessage: word => `The word was: ${word}`,
  },
  quiz: {
    score: score => `Score: ${score}`,
    highScore: score => `Best: ${score}`,
    finishTitle: 'Game finished',
    finishMessage: (score, total) => `Your score: ${score} / ${total}`,
    error: 'Could not load questions. Please try again.',
    retry: 'Retry',
  },
  tap: {
    time: seconds => `Time: ${seconds}s`,
    taps: count => `Taps: ${count}`,
    best: value => `Best: ${value}`,
    start: 'Start',
    tap: 'Tap!',
    timeUpTitle: 'Time is up!',
    timeUpMessage: count => `Your score: ${count}`,
  },
  ttt: {
    title: 'Tic Tac Toe',
    playerWin: 'You win!',
    computerWin: 'Computer wins',
    draw: 'Draw',
  },
  tttMultiplayer: {
    title: 'Tic Tac Toe Multiplayer',
    youAre: symbol => `You are: ${symbol}`,
    currentTurn: symbol => `Current turn: ${symbol}`,
    currentRoom: code => `Room code: ${code}`,
    lobbyTitle: 'Online Lobby',
    createRoom: 'Create new room',
    joinRoom: 'Join room',
    roomCodeLabel: 'Room code',
    roomCodePlaceholder: 'Enter code (e.g. ABCD1)',
    roomListTitle: 'Active rooms',
    roomListEmpty: 'No rooms available right now. Create one!',
    roomStatusWaiting: 'Waiting for players',
    roomStatusPlaying: 'In progress',
    roomFullTitle: 'Room full',
    roomFullMessage: 'Two players are already connected.',
    joinFailedTitle: 'Joining failed',
    joinFailedMessage: 'Something interfered while joining the lobby. Please try again in a moment.',
    roomNotFoundTitle: 'Room not found',
    roomNotFoundMessage: 'We could not find a room with that code.',
    roomCodeTakenMessage: 'That code is already in use. Try another value.',
    roomLimitReached: limit => `Room limit reached. Please wait for another lobby to close (max ${limit}).`,
    opponentLeftTitle: 'Opponent disconnected',
    opponentLeftMessage: 'The other player left the game.',
    gameFinishedTitle: 'Game finished',
    playerWins: symbol => `Player ${symbol} wins`,
    drawTitle: 'Draw',
    drawMessage: 'No more moves left.',
    assigningPlayer: 'Assigning player...',
    waitingForOpponent: 'Waiting for another player...',
    rematchVotesLabel: (count, total) => `Rematch votes: ${count}/${total}`,
    rematchRequest: 'Request rematch',
    rematchPending: 'Waiting for your opponent...',
    rematchReady: 'Rematch ready! Board will reset shortly...',
    leaveRoom: 'Leave room',
  },
  scoreboard: {
    title: 'Your Results',
    labels: {
      memory: 'Memory Game',
      quiz: 'Quiz',
      tap: 'Tap Challenge',
      ttt: 'Tic Tac Toe',
      tttMultiplayer: 'Tic Tac Toe Multiplayer',
    },
    values: {
      memory: wins => `${wins} wins`,
      quiz: score => `${score} points`,
      tap: score => `${score} taps`,
      ttt: wins => `${wins} wins`,
      tttMultiplayer: wins => `${wins} wins`,
    },
  },
};

const translations: Record<LocaleKey, Strings> = {
  en: base,
  pl: base,
};

export const strings = translations.en;
