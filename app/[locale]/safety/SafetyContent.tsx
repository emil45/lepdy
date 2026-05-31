'use client';

import React from 'react';
import { Box, Typography, Paper, Card, CardContent } from '@mui/material';
import { useTranslations } from 'next-intl';
import BackButton from '@/components/BackButton';
import BlockIcon from '@mui/icons-material/Block';
import SecurityIcon from '@mui/icons-material/Security';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

const safetyFeatures = [
  { key: 'noAds', icon: BlockIcon, color: '#f44336' },
  { key: 'noDataCollection', icon: SecurityIcon, color: '#2196f3' },
  { key: 'parentalControls', icon: SupervisorAccountIcon, color: '#9c27b0' },
  { key: 'offlineCapable', icon: ChildCareIcon, color: '#4caf50' },
  { key: 'coppaCompliant', icon: VerifiedUserIcon, color: '#ff9800' },
];

export default function SafetyContent() {
  const t = useTranslations('safety');

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <BackButton />

      <Paper elevation={3} sx={{ p: 4, mt: 3, borderRadius: 3 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ color: '#6a1b9a', fontWeight: 'bold' }}>
          {t('pageTitle')}
        </Typography>

        <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.8, mb: 4 }}>
          {t('intro')}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {safetyFeatures.map(({ key, icon: Icon, color }) => (
            <Card key={key} elevation={2} sx={{ borderLeft: `4px solid ${color}` }}>
              <CardContent sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Icon sx={{ color, fontSize: 40, mt: 0.5 }} />
                <Box>
                  <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {t(key)}
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                    {t(`${key}Text`)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Paper>
    </Box>
  );
}
