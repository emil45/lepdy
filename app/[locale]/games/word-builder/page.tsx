import { setRequestLocale } from 'next-intl/server';
import { generatePageMetadata } from '@/lib/seo';
import WordBuilderContent from './WordBuilderContent';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return generatePageMetadata(locale, 'wordBuilder', '/games/word-builder');
}

export default async function WordBuilderPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <WordBuilderContent />;
}
