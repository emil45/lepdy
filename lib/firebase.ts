import type { Database } from 'firebase/database';
import { getFirebaseApp } from './firebaseApp';

let database: Database | null = null;

// Lazy initialization - only loads Firebase when first needed
export async function getFirebaseDatabase(): Promise<Database> {
  if (!database) {
    const app = await getFirebaseApp();
    const { getDatabase } = await import('firebase/database');
    database = getDatabase(app);
  }
  return database;
}

export interface LeaderboardEntry {
  score: number;
  timestamp: number;
}

export async function submitScore(game: string, score: number): Promise<void> {
  try {
    const db = await getFirebaseDatabase();
    const { ref, set } = await import('firebase/database');
    const recordRef = ref(db, `leaderboard/${game}`);
    await set(recordRef, { score, timestamp: Date.now() });
    console.log('Score submitted:', score);
  } catch (error) {
    console.error('Failed to submit score:', error);
  }
}

export async function getTopScore(game: string): Promise<LeaderboardEntry | null> {
  try {
    const db = await getFirebaseDatabase();
    const { ref, get } = await import('firebase/database');
    const recordRef = ref(db, `leaderboard/${game}`);
    const snapshot = await get(recordRef);
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error('Failed to get score:', error);
    return null;
  }
}
