'use client';

import { Box, Typography, Link as MuiLink } from '@mui/material';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';

export default function Footer() {
  const t = useTranslations('footer');
  const locale = useLocale();
  const getPath = (page: string) => locale === 'he' ? `/${page}` : `/${locale}/${page}`;

  const linkSx = {
    color: 'text.secondary',
    textDecoration: 'none',
    fontSize: '0.875rem',
    '&:hover': { textDecoration: 'underline' },
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: '25px' }}>
      <MuiLink component={Link} href={getPath('about')} sx={linkSx}>{t('about')}</MuiLink>
      <Typography color="textSecondary">·</Typography>
      <MuiLink component={Link} href={getPath('safety')} sx={linkSx}>{t('safety')}</MuiLink>
      <Typography color="textSecondary">·</Typography>
      <MuiLink component={Link} href={getPath('privacy')} sx={linkSx}>{t('privacy')}</MuiLink>
      <Typography color="textSecondary">·</Typography>
      <MuiLink component={Link} href={getPath('terms')} sx={linkSx}>{t('terms')}</MuiLink>
      <Typography color="textSecondary">·</Typography>
      <Typography variant="body2" color="textSecondary">
        Noa © {new Date().getFullYear()}
      </Typography>
    </Box>
  );
}
