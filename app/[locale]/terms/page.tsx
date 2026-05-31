import type { Locale } from '@/i18n/config';
import { setRequestLocale } from 'next-intl/server';
import LegalDocumentPage from '@/components/LegalDocumentPage';
import { generateLegalMetadata, getLegalDocument } from '@/data/legalDocuments';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return generateLegalMetadata('terms', locale as Locale, '/terms');
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LegalDocumentPage document={getLegalDocument('terms', locale as Locale)} />;
}
