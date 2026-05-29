import { setRequestLocale } from 'next-intl/server';
import { generatePageMetadata } from '@/lib/seo';
import MemoryMatchGameContent from './MemoryMatchGameContent';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return generatePageMetadata(locale, 'memoryGame', '/games/memory-match-game');
}

export default async function MemoryMatchGamePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <MemoryMatchGameContent />;
}
