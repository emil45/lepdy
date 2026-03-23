'use client';

import { useState, useEffect, useCallback } from 'react';

export type BoardThemeName = 'classic' | 'ocean' | 'candy' | 'forest';

export interface BoardColors {
  light: string;
  dark: string;
}

export const BOARD_THEMES: Record<BoardThemeName, BoardColors> = {
  classic: { light: '#f5ede1', dark: '#dbc3e2' },
  ocean: { light: '#dce9f5', dark: '#7baed4' },
  candy: { light: '#fce4ec', dark: '#f48fb1' },
  forest: { light: '#e8f5e9', dark: '#81c784' },
};

export const BOARD_THEME_NAMES: BoardThemeName[] = ['classic', 'ocean', 'candy', 'forest'];

const STORAGE_KEY = 'lepdy_chess_board_theme';

export interface UseChessBoardThemeReturn {
  boardTheme: BoardThemeName;
  boardColors: BoardColors;
  selectBoardTheme: (name: BoardThemeName) => void;
}

export function useChessBoardTheme(): UseChessBoardThemeReturn {
  const [boardTheme, setBoardTheme] = useState<BoardThemeName>('classic');

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && stored in BOARD_THEMES) {
          setBoardTheme(stored as BoardThemeName);
        }
      } catch (e) {
        console.error('[chess] Failed to load board theme:', e);
      }
    }
  }, []);

  const selectBoardTheme = useCallback((name: BoardThemeName) => {
    setBoardTheme(name);
    try {
      localStorage.setItem(STORAGE_KEY, name);
    } catch (e) {
      console.error('[chess] Failed to save board theme:', e);
    }
  }, []);

  return {
    boardTheme,
    boardColors: BOARD_THEMES[boardTheme],
    selectBoardTheme,
  };
}
