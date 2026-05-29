'use client';

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useStickers, UseStickersReturn } from '@/hooks/useStickers';
import { useStickerUnlockDetector } from '@/hooks/useStickerUnlockDetector';
import { useProgressSync } from '@/hooks/useProgressSync';
import { useAuthContext } from '@/contexts/AuthContext';
import { useSyncStatusContext } from '@/contexts/SyncStatusContext';

const StickerContext = createContext<UseStickersReturn | null>(null);

/**
 * Internal component that runs the unlock detector.
 * Must be rendered inside StickerContext.Provider to access sticker state.
 */
function StickerUnlockDetector() {
  useStickerUnlockDetector();
  return null;
}

interface StickerProviderProps {
  children: ReactNode;
}

export function StickerProvider({ children }: StickerProviderProps) {
  // No toast callback here - toast only shows from unlock detector,
  // not when peeling (user is already looking at the sticker!)
  const stickerValue = useStickers();
  const { user } = useAuthContext();
  const { notifySaved } = useSyncStatusContext();

  const syncData = useMemo(() => ({
    earnedStickerIds: Array.from(stickerValue.earnedStickerIds),
  }), [stickerValue.earnedStickerIds]);

  useProgressSync(
    user?.uid ?? null,
    'progress/stickers',
    syncData,
    notifySaved,
    {
      debounceMs: 0,
      flushOnBackground: true,
    }
  );

  return (
    <StickerContext.Provider value={stickerValue}>
      <StickerUnlockDetector />
      {children}
    </StickerContext.Provider>
  );
}

export function useStickerContext(): UseStickersReturn {
  const context = useContext(StickerContext);
  if (!context) {
    throw new Error('useStickerContext must be used within a StickerProvider');
  }
  return context;
}

export default StickerContext;
