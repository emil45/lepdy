'use client';

import { Avatar, Box, Button, Divider, Drawer, IconButton, Skeleton, Typography } from '@mui/material';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import CloseIcon from '@mui/icons-material/Close';
import GoogleIcon from '@mui/icons-material/Google';
import React, { useState, useEffect } from 'react';
import { useDirection } from '@/hooks/useDirection';
import { getDirection } from '@/i18n/config';
import { useStreakContext } from '@/contexts/StreakContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { useFeatureFlagContext } from '@/contexts/FeatureFlagContext';

interface SettingsDrawerProps {
  open: boolean;
  toggleDrawer: (newOpen: boolean) => void;
}

const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ open, toggleDrawer }) => {
  const t = useTranslations();
  const locale = useLocale();
  const direction = useDirection();
  const router = useRouter();
  const pathname = usePathname();
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);
  const [drawerDirection, setDrawerDirection] = useState(direction);
  const { streakData } = useStreakContext();
  const tStreak = useTranslations('streakIndicator');
  const { getFlag } = useFeatureFlagContext();
  const cloudSyncEnabled = getFlag('cloudSyncEnabled');
  const { user, loading, signInWithGoogle, signOut } = useAuthContext();
  const [signInError, setSignInError] = useState(false);

  // Update drawer direction when drawer opens (but not during language changes)
  useEffect(() => {
    if (open && !isChangingLanguage) {
      setDrawerDirection(direction);
    }
  }, [open, direction, isChangingLanguage]);

  const handleLanguageChange = (lang: string) => {
    // Skip if already on the selected language
    if (locale === lang) {
      toggleDrawer(false);
      return;
    }

    // Show loading state
    setIsChangingLanguage(true);

    // Get current route without language prefix
    let currentRoute = pathname;
    // Remove existing language prefix if present
    if (pathname.startsWith('/en')) {
      currentRoute = pathname.replace('/en', '') || '/';
    } else if (pathname.startsWith('/ru')) {
      currentRoute = pathname.replace('/ru', '') || '/';
    }

    // Build new route with new language
    const newRoute = lang === 'he' ? currentRoute : `/${lang}${currentRoute}`;

    // Close drawer first for smoother UX
    toggleDrawer(false);

    // Navigate after a short delay to allow drawer to close
    setTimeout(() => {
      router.push(newRoute);
      // Reset loading state and update drawer direction after navigation
      setTimeout(() => {
        setIsChangingLanguage(false);
        setDrawerDirection(getDirection(lang));
      }, 100);
    }, 150);
  };

  const handleClose = () => {
    toggleDrawer(false);
  };

  const handleSignIn = async () => {
    setSignInError(false);
    try {
      await signInWithGoogle();
    } catch {
      setSignInError(true);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      anchor={drawerDirection === 'rtl' ? 'left' : 'right'}
      PaperProps={{
        sx: {
          width: 300,
          borderTopRightRadius: drawerDirection === 'rtl' ? 13 : undefined,
          borderEndEndRadius: drawerDirection === 'rtl' ? 13 : undefined,
          borderTopLeftRadius: drawerDirection === 'ltr' ? 13 : undefined,
          borderEndStartRadius: drawerDirection === 'ltr' ? 13 : undefined,
          backgroundColor: 'beigePastel',
        },
      }}
      SlideProps={{ direction: drawerDirection === 'rtl' ? 'right' : 'left' }}
    >
      <Box
        sx={{
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
        role="presentation"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography
            color="primary.light"
            variant="h6"
            sx={{
              textAlign: direction === 'rtl' ? 'right' : 'left',
              width: '100%',
            }}
          >
            {t('home.settings.title')}
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Streak Display */}
        {streakData.currentStreak > 0 && (
          <>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1.5,
                py: 2,
                px: 2,
                my: 2,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
                border: '2px solid #ffb74d',
              }}
            >
              <Typography sx={{ fontSize: '2.5rem', lineHeight: 1 }}>🔥</Typography>
              <Box sx={{ textAlign: direction === 'rtl' ? 'right' : 'left' }}>
                <Typography
                  sx={{
                    fontSize: '1.8rem',
                    fontWeight: 'bold',
                    color: '#e65100',
                    lineHeight: 1,
                  }}
                >
                  {streakData.currentStreak}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.85rem',
                    color: '#f57c00',
                    fontWeight: 500,
                  }}
                >
                  {streakData.currentStreak === 1 ? tStreak('day') : tStreak('days')}
                </Typography>
              </Box>
              {streakData.longestStreak > streakData.currentStreak && (
                <Box
                  sx={{
                    borderLeft: '1px solid #ffb74d',
                    pl: 1.5,
                    ml: 0.5,
                    textAlign: direction === 'rtl' ? 'right' : 'left',
                  }}
                >
                  <Typography sx={{ fontSize: '0.7rem', color: '#8d6e63' }}>
                    {tStreak('longestStreak')}
                  </Typography>
                  <Typography sx={{ fontSize: '1rem', fontWeight: 'bold', color: '#8d6e63' }}>
                    {streakData.longestStreak}
                  </Typography>
                </Box>
              )}
            </Box>
          </>
        )}

        {cloudSyncEnabled && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ width: '100%' }}>
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Skeleton variant="circular" width={32} height={32} />
                  <Skeleton variant="text" width={120} height={24} />
                </Box>
              ) : user ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                  <Avatar
                    src={user.photoURL ?? undefined}
                    sx={{ width: 32, height: 32 }}
                  >
                    {user.displayName?.[0] ?? '?'}
                  </Avatar>
                  <Typography
                    variant="body2"
                    color="secondary.main"
                    sx={{ flex: 1, textAlign: direction === 'rtl' ? 'right' : 'left' }}
                  >
                    {user.displayName}
                  </Typography>
                  <Button
                    variant="text"
                    size="small"
                    onClick={signOut}
                    sx={{ color: 'secondary.main' }}
                  >
                    {t('home.cloudSync.signOutButton')}
                  </Button>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: direction === 'rtl' ? 'flex-end' : 'flex-start',
                    gap: 1,
                    width: '100%',
                  }}
                >
                  <Button
                    variant="outlined"
                    size="medium"
                    startIcon={<GoogleIcon />}
                    onClick={handleSignIn}
                    sx={{ textTransform: 'none' }}
                  >
                    {t('home.cloudSync.signInButton')}
                  </Button>
                  {signInError && (
                    <Typography variant="caption" color="error">
                      {t('home.cloudSync.signInTitle')}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          </>
        )}

        <Divider sx={{ my: 2 }} />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: direction === 'rtl' ? 'flex-end' : 'flex-start',
            gap: 1,
            mb: 'auto',
            width: '100%',
          }}
        >
          <Typography
            fontWeight="bold"
            variant="button"
            color="secondary.main"
            sx={{
              textAlign: direction === 'rtl' ? 'right' : 'left',
              width: '100%',
              alignSelf: direction === 'rtl' ? 'flex-end' : 'flex-start',
            }}
          >
            {t('home.settings.language')}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              alignItems: direction === 'rtl' ? 'flex-end' : 'flex-start',
              width: '100%',
              direction: direction,
              '& > *': {
                alignSelf: direction === 'rtl' ? 'flex-end' : 'flex-start',
              },
            }}
          >
            <Button
              size="medium"
              variant={locale === 'en' ? 'contained' : 'outlined'}
              onClick={() => handleLanguageChange('en')}
              disabled={isChangingLanguage}
              sx={{
                minWidth: '120px',
                textAlign: 'center',
                alignSelf: direction === 'rtl' ? 'flex-end' : 'flex-start',
                marginLeft: direction === 'rtl' ? 'auto' : 0,
                marginRight: direction === 'rtl' ? 0 : 'auto',
              }}
            >
              English
            </Button>
            <Button
              size="medium"
              variant={locale === 'he' ? 'contained' : 'outlined'}
              onClick={() => handleLanguageChange('he')}
              disabled={isChangingLanguage}
              sx={{
                minWidth: '120px',
                textAlign: 'center',
                alignSelf: direction === 'rtl' ? 'flex-end' : 'flex-start',
                marginLeft: direction === 'rtl' ? 'auto' : 0,
                marginRight: direction === 'rtl' ? 0 : 'auto',
              }}
            >
              עברית
            </Button>
            <Button
              size="medium"
              variant={locale === 'ru' ? 'contained' : 'outlined'}
              onClick={() => handleLanguageChange('ru')}
              disabled={isChangingLanguage}
              sx={{
                minWidth: '120px',
                textAlign: 'center',
                alignSelf: direction === 'rtl' ? 'flex-end' : 'flex-start',
                marginLeft: direction === 'rtl' ? 'auto' : 0,
                marginRight: direction === 'rtl' ? 0 : 'auto',
              }}
            >
              Русский
            </Button>
          </Box>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: direction === 'rtl' ? 'flex-end' : 'flex-start',
            width: '100%',
          }}
        >
          <Typography
            color="secondary.main"
            sx={{
              textAlign: direction === 'rtl' ? 'right' : 'left',
              width: '100%',
            }}
          >
            {t('home.settings.voices')}
          </Typography>
          <Typography
            color="secondary.main"
            sx={{
              textAlign: direction === 'rtl' ? 'right' : 'left',
              width: '100%',
            }}
          >
            {t('home.settings.code')}
          </Typography>
          <Typography
            color="secondary.main"
            sx={{
              textAlign: direction === 'rtl' ? 'right' : 'left',
              width: '100%',
            }}
          >
            {t('home.settings.contact')}
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
};

export default SettingsDrawer;
