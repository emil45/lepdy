'use client';

import React, { useState } from 'react';
import { Box } from '@mui/material';
import RoundFunButton from '@/components/RoundFunButton';
import SettingsIcon from '@mui/icons-material/Settings';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SettingsDrawer from '@/components/SettingsDrawer';
import { useRouter } from 'next/navigation';
import { getLanguageSpecificRoute } from '@/utils/languageRoutes';
import { useFeatureFlagContext } from '@/contexts/FeatureFlagContext';

interface HomeHeaderProps {
  locale: string;
}

export default function HomeHeader({ locale }: HomeHeaderProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { getFlag } = useFeatureFlagContext();
  const showStickersButton = getFlag('showStickersButton');

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
        {showStickersButton && (
          <Box sx={{ display: 'flex', gap: { xs: 1, sm: 1.5 } }}>
            <RoundFunButton onClick={() => router.push(getLanguageSpecificRoute('/stickers', locale))}>
              <EmojiEventsIcon />
            </RoundFunButton>
            <RoundFunButton onClick={() => router.push(getLanguageSpecificRoute('/my-words', locale))}>
              <MenuBookIcon />
            </RoundFunButton>
          </Box>
        )}
        <Box sx={{ marginInlineStart: 'auto' }}>
          <RoundFunButton onClick={() => setOpen(true)}>
            <SettingsIcon />
          </RoundFunButton>
        </Box>
      </Box>
      <SettingsDrawer open={open} toggleDrawer={setOpen} />
    </>
  );
}
