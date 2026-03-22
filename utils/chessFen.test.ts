/**
 * chessFen.test.ts — unit tests for moveFenPiece
 *
 * Run with: npx tsx utils/chessFen.test.ts
 */

import { moveFenPiece } from './chessFen';

let passed = 0;
let failed = 0;

function test(description: string, fn: () => void) {
  try {
    fn();
    console.log(`  PASS: ${description}`);
    passed++;
  } catch (err) {
    console.log(`  FAIL: ${description}`);
    console.log(`    ${(err as Error).message}`);
    failed++;
  }
}

function assertEqual(actual: string, expected: string) {
  if (actual !== expected) {
    throw new Error(`Expected "${expected}" but got "${actual}"`);
  }
}

console.log('\nmoveFenPiece tests\n');

// Rook e4 → e7 (same file, vertical move)
test('rook moves from e4 to e7 (same file)', () => {
  const result = moveFenPiece('8/8/8/8/4R3/8/8/8', 'e4', 'e7');
  assertEqual(result, '8/4R3/8/8/8/8/8/8');
});

// Rook e4 → a4 (same rank, horizontal move)
test('rook moves from e4 to a4 (same rank)', () => {
  const result = moveFenPiece('8/8/8/8/4R3/8/8/8', 'e4', 'a4');
  assertEqual(result, '8/8/8/8/R7/8/8/8');
});

// Pawn e2 → e4 (standard pawn advance from starting position)
test('pawn moves from e2 to e4 (standard opening)', () => {
  const result = moveFenPiece('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR', 'e2', 'e4');
  assertEqual(result, 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR');
});

// Capture: destination piece is replaced by moving piece
test('capture: destination piece replaced by source piece', () => {
  const result = moveFenPiece('8/8/8/8/4Rr2/8/8/8', 'e4', 'f4');
  assertEqual(result, '8/8/8/8/5R2/8/8/8');
});

// Empty from-square: returns original FEN unchanged
test('empty from-square returns original FEN unchanged', () => {
  const fen = '8/8/8/8/4R3/8/8/8';
  const result = moveFenPiece(fen, 'a1', 'a2');
  assertEqual(result, fen);
});

// Move to same square: piece stays in place
test('move to same square: piece stays (no-op)', () => {
  const fen = '8/8/8/8/4R3/8/8/8';
  const result = moveFenPiece(fen, 'e4', 'e4');
  assertEqual(result, fen);
});

// Corner case: a1 → h8
test('rook moves from a1 to h8 (opposite corners)', () => {
  const result = moveFenPiece('8/8/8/8/8/8/8/R7', 'a1', 'h8');
  assertEqual(result, '7R/8/8/8/8/8/8/8');
});

console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
