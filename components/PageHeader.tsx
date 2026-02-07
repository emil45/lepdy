'use client';

import React from 'react';
import { Box } from '@mui/material';
import RoundFunButton from '@/components/RoundFunButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { defaultLocale } from '@/i18n/config';
import { getLanguageSpecificRoute } from '@/utils/languageRoutes';
import { useFeatureFlagContext } from '@/contexts/FeatureFlagContext';

interface PageHeaderProps {
  backHref?: string;
}

export default function PageHeader({ backHref = '/' }: PageHeaderProps) {
  const router = useRouter();
  const locale = useLocale();
  const { getFlag } = useFeatureFlagContext();
  const showStickersButton = getFlag('showStickersButton');

  const handleBackClick = () => {
    const path = locale === defaultLocale ? backHref : `/${locale}${backHref}`;
    setTimeout(() => {
      router.push(path);
    }, 500);
  };

  return (
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
        <RoundFunButton onClick={handleBackClick}>
          <ArrowBackIcon />
        </RoundFunButton>
      </Box>
    </Box>
  );
}
