import { movementPuzzles, capturePuzzles } from '../data/chessPuzzles';

console.log("=== Movement Puzzles ===");
console.log("Total:", movementPuzzles.length);
const pieces = ['king', 'queen', 'rook', 'bishop', 'knight', 'pawn'] as const;
for (const p of pieces) {
  const count = movementPuzzles.filter(x => x.pieceId === p).length;
  const byTier = [1,2,3].map(t => movementPuzzles.filter(x => x.pieceId === p && x.difficulty === t).length);
  console.log(`  ${p}: ${count} total (T1:${byTier[0]}, T2:${byTier[1]}, T3:${byTier[2]})`);
}
console.log("By tier:");
for (const t of [1,2,3]) {
  console.log(`  Tier ${t}: ${movementPuzzles.filter(x => x.difficulty === t).length}`);
}

console.log("\n=== Capture Puzzles ===");
console.log("Total:", capturePuzzles.length);
for (const p of pieces) {
  const count = capturePuzzles.filter(x => x.correctPieceId === p).length;
  const byTier = [1,2,3].map(t => capturePuzzles.filter(x => x.correctPieceId === p && x.difficulty === t).length);
  console.log(`  ${p}: ${count} total (T1:${byTier[0]}, T2:${byTier[1]}, T3:${byTier[2]})`);
}
console.log("By tier:");
for (const t of [1,2,3]) {
  console.log(`  Tier ${t}: ${capturePuzzles.filter(x => x.difficulty === t).length}`);
}

