import type { Locale } from '@/i18n/config';
import { setRequestLocale } from 'next-intl/server';
import LegalDocumentPage from '@/components/LegalDocumentPage';
import { generateLegalMetadata, getLegalDocument } from '@/data/legalDocuments';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return generateLegalMetadata('privacy', locale as Locale, '/privacy');
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LegalDocumentPage document={getLegalDocument('privacy', locale as Locale)} />;
}
