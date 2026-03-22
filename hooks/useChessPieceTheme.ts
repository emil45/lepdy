'use client';

import { useState, useEffect, useCallback } from 'react';
import { type ThemeName, pieceThemes } from '@/app/[locale]/games/chess-game/pieceThemes';
import type { PieceRenderObject } from 'react-chessboard/dist/types';

const STORAGE_KEY = 'lepdy_chess_piece_theme';

export interface UseChessPieceThemeReturn {
  theme: ThemeName;
  pieces: PieceRenderObject;
  selectTheme: (name: ThemeName) => void;
}

export function useChessPieceTheme(): UseChessPieceThemeReturn {
  const [theme, setTheme] = useState<ThemeName>('staunty');

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && stored in pieceThemes) {
          setTheme(stored as ThemeName);
        }
      } catch (e) {
        console.error('[chess] Failed to load piece theme:', e);
      }
    }
  }, []);

  const selectTheme = useCallback((name: ThemeName) => {
    setTheme(name);
    try {
      localStorage.setItem(STORAGE_KEY, name);
    } catch (e) {
      console.error('[chess] Failed to save piece theme:', e);
    }
  }, []);

  return {
    theme,
    pieces: pieceThemes[theme],
    selectTheme,
  };
}
