'use client';

import React from 'react';
import {
  Box,
  Link,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import BackButton from '@/components/BackButton';
import type { LegalDocument } from '@/data/legalDocuments';

interface LegalDocumentPageProps {
  document: LegalDocument;
}

export default function LegalDocumentPage({
  document,
}: LegalDocumentPageProps) {
  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 3 }}>
      <BackButton />

      <Paper elevation={3} sx={{ p: { xs: 3, md: 5 }, mt: 3, borderRadius: 3 }}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{ color: '#6a1b9a', fontWeight: 'bold' }}
        >
          {document.title}
        </Typography>

        <Typography
          variant="body2"
          sx={{ color: 'text.secondary', mb: 1.5, fontWeight: 600 }}
        >
          {document.effectiveDateLabel}: {document.effectiveDate}
        </Typography>

        <Typography
          variant="body1"
          paragraph
          sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 4 }}
        >
          {document.intro}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {document.sections.map((section) => (
            <Box key={section.title}>
              <Typography
                variant="h5"
                component="h2"
                sx={{ fontWeight: 'bold', mb: 1.5 }}
              >
                {section.title}
              </Typography>

              {section.paragraphs?.map((paragraph) => (
                <Typography
                  key={paragraph}
                  variant="body1"
                  paragraph
                  sx={{ lineHeight: 1.8, mb: 1.5 }}
                >
                  {paragraph}
                </Typography>
              ))}

              {section.bullets && (
                <List sx={{ listStyleType: 'disc', pl: 3, py: 0 }}>
                  {section.bullets.map((bullet) => (
                    <ListItem
                      key={bullet}
                      sx={{ display: 'list-item', py: 0.25, pl: 0 }}
                    >
                      <ListItemText
                        primary={bullet}
                        slotProps={{
                          primary: {
                            sx: { lineHeight: 1.7 },
                          },
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          ))}
        </Box>

        <Box sx={{ mt: 5, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body1">
            {document.contactLabel}:{' '}
            <Link
              href={`mailto:${document.contactEmail}`}
              sx={{
                color: '#1565c0',
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              {document.contactEmail}
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
