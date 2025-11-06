export type PlayerSymbol = 'X' | 'O';
export type Board = string[];

export const winningLines: Array<[number, number, number]> = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export const preferredMoves = [4, 0, 2, 6, 8, 1, 3, 5, 7];

export const checkWinner = (board: Board, symbol: PlayerSymbol) =>
  winningLines.some(([a, b, c]) => board[a] === symbol && board[b] === symbol && board[c] === symbol);

export const getEmptyIndices = (board: Board) =>
  board
    .map((value, index) => (value === '' ? index : null))
    .filter((value): value is number => value !== null);

export const findBestMove = (board: Board, symbol: PlayerSymbol) => {
  for (const [a, b, c] of winningLines) {
    if (board[a] === symbol && board[b] === symbol && board[c] === '') return c;
    if (board[a] === symbol && board[c] === symbol && board[b] === '') return b;
    if (board[b] === symbol && board[c] === symbol && board[a] === '') return a;
  }
  return null;
};

export const bestAvailableMove = (board: Board) => preferredMoves.find(index => board[index] === '') ?? null;

export const randomMove = (board: Board, rng: () => number = Math.random) => {
  const empty = getEmptyIndices(board);
  if (empty.length === 0) {
    return null;
  }
  const randomIndex = Math.floor(rng() * empty.length);
  return empty[randomIndex];
};
