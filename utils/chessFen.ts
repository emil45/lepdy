/**
 * chessFen.ts — FEN piece-placement string manipulation utilities
 *
 * Works with the piece-placement field of FEN notation (first field only),
 * e.g. "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"
 */

/** Files a–h mapped to column index 0–7 */
const FILES = 'abcdefgh';

/**
 * Convert algebraic square notation (e.g. "e4") to [row, col] grid indices.
 * Row 0 = rank 8 (top of board), row 7 = rank 1 (bottom).
 */
function squareToIndex(square: string): [number, number] {
  const col = FILES.indexOf(square[0]);
  const row = 8 - parseInt(square[1], 10);
  return [row, col];
}

/**
 * Expand a single FEN rank string (e.g. "4R3") into an array of 8 chars
 * where empty squares are represented as '.'.
 */
function expandRank(rank: string): string[] {
  const cells: string[] = [];
  for (const ch of rank) {
    if (ch >= '1' && ch <= '8') {
      const empties = parseInt(ch, 10);
      for (let i = 0; i < empties; i++) cells.push('.');
    } else {
      cells.push(ch);
    }
  }
  return cells;
}

/**
 * Collapse an array of 8 chars back into a FEN rank string.
 * Consecutive '.' entries are replaced by a digit.
 */
function collapseRank(cells: string[]): string {
  let result = '';
  let emptyCount = 0;
  for (const ch of cells) {
    if (ch === '.') {
      emptyCount++;
    } else {
      if (emptyCount > 0) {
        result += emptyCount;
        emptyCount = 0;
      }
      result += ch;
    }
  }
  if (emptyCount > 0) result += emptyCount;
  return result;
}

/**
 * Move a piece from one square to another in a FEN piece-placement string.
 *
 * - If fromSquare is empty, returns the original FEN unchanged.
 * - If toSquare contains a piece, it is replaced (captures are supported).
 * - If fromSquare === toSquare, returns the original FEN unchanged.
 *
 * @param fen        FEN piece-placement string (first field only, no spaces)
 * @param fromSquare Algebraic notation of the square to move FROM (e.g. "e4")
 * @param toSquare   Algebraic notation of the square to move TO (e.g. "e7")
 * @returns New FEN piece-placement string with the piece moved
 */
export function moveFenPiece(fen: string, fromSquare: string, toSquare: string): string {
  // Parse FEN into 8x8 grid
  const ranks = fen.split('/');
  const grid: string[][] = ranks.map(expandRank);

  const [fromRow, fromCol] = squareToIndex(fromSquare);
  const [toRow, toCol] = squareToIndex(toSquare);

  const piece = grid[fromRow][fromCol];

  // If from-square is empty or same square, return unchanged
  if (piece === '.' || (fromRow === toRow && fromCol === toCol)) {
    return fen;
  }

  // Move piece
  grid[fromRow][fromCol] = '.';
  grid[toRow][toCol] = piece;

  // Collapse grid back into FEN
  return grid.map(collapseRank).join('/');
}
