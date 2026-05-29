'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, Paper, IconButton, keyframes, Slide } from '@mui/material';
import { useTranslations } from 'next-intl';
import CloseIcon from '@mui/icons-material/Close';
import GetAppIcon from '@mui/icons-material/GetApp';
import IosShareIcon from '@mui/icons-material/IosShare';
import AddBoxIcon from '@mui/icons-material/AddBox';
import { playSound, AudioSounds } from '@/utils/audio';

const VISIT_COUNT_KEY = 'lepdy_visit_count';
const INSTALL_DISMISSED_KEY = 'lepdy_install_dismissed';
const SESSION_VISIT_TRACKED_KEY = 'lepdy_install_visit_tracked';
const VISITS_BEFORE_PROMPT = 3;

// Bouncy animation for the icon
const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
`;

// Sparkle effect
const sparkle = keyframes`
  0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
  50% { opacity: 1; transform: scale(1) rotate(180deg); }
`;

// Pulse glow effect
const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 4px 20px rgba(123, 31, 162, 0.3); }
  50% { box-shadow: 0 4px 30px rgba(123, 31, 162, 0.5); }
`;

// Interface for the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Deterministic sparkle positions to avoid re-render issues
const SPARKLE_POSITIONS = [
  { top: 25, left: 15, duration: 2.0, delay: 0 },
  { top: 45, left: 75, duration: 2.2, delay: 0.4 },
  { top: 35, left: 45, duration: 2.4, delay: 0.8 },
  { top: 65, left: 25, duration: 2.1, delay: 1.2 },
  { top: 55, left: 85, duration: 2.3, delay: 1.6 },
];

function isPromptDismissed() {
  return localStorage.getItem(INSTALL_DISMISSED_KEY) !== null;
}

function isStandaloneMode() {
  return window.matchMedia('(display-mode: standalone)').matches;
}

export default function InstallPrompt() {
  const t = useTranslations('installPrompt');
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);

  // Register service worker and track visits
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.error('Service worker registration failed:', error);
      });
    }

    try {
      // Check if already dismissed
      if (isPromptDismissed()) return;

      // Check if app is already installed (standalone mode)
      if (isStandaloneMode()) return;

      const alreadyTrackedThisSession = sessionStorage.getItem(SESSION_VISIT_TRACKED_KEY);
      let newCount = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || '0', 10);

      if (!alreadyTrackedThisSession) {
        newCount += 1;
        localStorage.setItem(VISIT_COUNT_KEY, String(newCount));
        sessionStorage.setItem(SESSION_VISIT_TRACKED_KEY, 'true');
      }

      // Only show after required visits
      if (newCount < VISITS_BEFORE_PROMPT) return;

      // Detect iOS
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
      setIsIOS(isIOSDevice);

      // On iOS, show manual instructions immediately
      if (isIOSDevice) {
        if (isPromptDismissed() || isStandaloneMode()) return;
        setShowPrompt(true);
        return;
      }

      // On other platforms, listen for beforeinstallprompt
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        if (isPromptDismissed() || isStandaloneMode()) return;
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setShowPrompt(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    } catch {
      // localStorage may be unavailable (private browsing, disabled, quota exceeded)
      // Gracefully degrade by not showing the install prompt
    }
  }, []);

  // Listen for app installed event to hide prompt
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleAppInstalled = () => {
      setShowPrompt(false);
      setDeferredPrompt(null);

      try {
        localStorage.setItem(INSTALL_DISMISSED_KEY, new Date().toISOString());
      } catch {
        // localStorage may be unavailable
      }
    };

    window.addEventListener('appinstalled', handleAppInstalled);
    return () => window.removeEventListener('appinstalled', handleAppInstalled);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);
    playSound(AudioSounds.POP);

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        playSound(AudioSounds.CELEBRATION);
        setShowPrompt(false);
      }
    } catch (error) {
      console.error('Install prompt error:', error);
    } finally {
      setIsInstalling(false);
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    setDeferredPrompt(null);

    try {
      localStorage.setItem(INSTALL_DISMISSED_KEY, new Date().toISOString());
    } catch {
      // localStorage may fail - prompt will reappear next visit
    }

    playSound(AudioSounds.POP);
  }, []);

  if (!showPrompt) return null;

  return (
    <Slide direction="up" in={showPrompt} mountOnEnter unmountOnExit>
      <Paper
        elevation={12}
        sx={{
          position: 'fixed',
          bottom: { xs: 16, sm: 24 },
          left: { xs: 16, sm: 'auto' },
          right: { xs: 16, sm: 24 },
          width: { xs: 'calc(100% - 32px)', sm: 'auto' },
          maxWidth: { sm: 380 },
          p: 3,
          borderRadius: 4,
          background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
          zIndex: 1300,
          animation: `${pulseGlow} 3s ease-in-out infinite`,
          overflow: 'hidden',
        }}
      >
        {/* Sparkle decorations */}
        {SPARKLE_POSITIONS.map((pos, i) => (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              width: 12,
              height: 12,
              top: `${pos.top}%`,
              left: `${pos.left}%`,
              animation: `${sparkle} ${pos.duration}s ease-in-out infinite`,
              animationDelay: `${pos.delay}s`,
              '&::before': {
                content: '"✨"',
                fontSize: '14px',
              },
            }}
          />
        ))}

        {/* Close button */}
        <IconButton
          onClick={handleDismiss}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: '#7b1fa2',
            '&:hover': {
              backgroundColor: 'rgba(123, 31, 162, 0.1)',
            },
          }}
          aria-label={t('close')}
        >
          <CloseIcon />
        </IconButton>

        {/* Icon with bounce animation */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 2,
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: '#7b1fa2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: `${bounce} 2s ease-in-out infinite`,
            }}
          >
            <GetAppIcon sx={{ fontSize: 36, color: 'white' }} />
          </Box>
        </Box>

        {/* Title */}
        <Typography
          variant="h5"
          component="h2"
          sx={{
            textAlign: 'center',
            fontWeight: 'bold',
            color: '#6a1b9a',
            mb: 1,
          }}
        >
          {t('title')}
        </Typography>

        {/* Description */}
        <Typography
          variant="body1"
          sx={{
            textAlign: 'center',
            color: '#5d4037',
            mb: 2,
          }}
        >
          {t('description')}
        </Typography>

        {/* iOS Instructions */}
        {isIOS ? (
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="body2"
              sx={{
                textAlign: 'center',
                color: '#5d4037',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5,
                flexWrap: 'wrap',
              }}
            >
              {t('iosStep1')}
              <IosShareIcon sx={{ fontSize: 20, color: '#007AFF', mx: 0.5 }} />
              {t('iosStep2')}
              <AddBoxIcon sx={{ fontSize: 20, color: '#007AFF', mx: 0.5 }} />
            </Typography>
          </Box>
        ) : (
          /* Install button for non-iOS */
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleInstall}
            disabled={isInstalling || !deferredPrompt}
            startIcon={<GetAppIcon />}
            sx={{
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 'bold',
              borderRadius: 3,
              backgroundColor: '#7b1fa2',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#6a1b9a',
                transform: 'scale(1.02)',
              },
              '&:active': {
                transform: 'scale(0.98)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            {isInstalling ? t('installing') : t('install')}
          </Button>
        )}

        {/* Benefits text */}
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textAlign: 'center',
            color: '#8e24aa',
            mt: 2,
          }}
        >
          {t('benefits')}
        </Typography>
      </Paper>
    </Slide>
  );
}
