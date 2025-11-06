import { bestAvailableMove, checkWinner, findBestMove, randomMove } from '../logic/ticTacToe';

describe('tic-tac-toe logic', () => {
  it('detects a winning row', () => {
    const board = ['X', 'X', 'X', '', '', '', '', '', ''];
    expect(checkWinner(board, 'X')).toBe(true);
    expect(checkWinner(board, 'O')).toBe(false);
  });

  it('suggests winning move for current player', () => {
    const board = ['X', 'X', '', 'O', 'O', '', '', '', ''];
    expect(findBestMove(board, 'X')).toBe(2);
  });

  it('blocks opponent from winning', () => {
    const board = ['X', 'X', '', 'O', '', '', '', '', 'O'];
    expect(findBestMove(board, 'X')).toBe(2);
  });

  it('prefers centre when available', () => {
    const board = ['', '', '', '', '', '', '', '', ''];
    expect(bestAvailableMove(board)).toBe(4);
  });

  it('picks random empty slot when needed', () => {
    const board = ['X', 'O', 'X', 'O', 'X', '', '', '', 'O'];
    const rng = jest.fn().mockReturnValue(0.6);
    expect(randomMove(board, rng)).toBe(6);
    expect(rng).toHaveBeenCalled();
  });
});
