import { setRequestLocale, getTranslations } from 'next-intl/server';
import { generatePageMetadata } from '@/lib/seo';
import LearnContent from './LearnContent';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return generatePageMetadata(locale, 'learn', '/learn');
}

// HowTo structured data for "how to teach kids Hebrew" rich results / AI answers.
async function generateHowToSchema(locale: string) {
  const t = await getTranslations({ locale, namespace: 'learnPage' });
  const steps = [1, 2, 3, 4];

  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: t('heading'),
    description: t('intro'),
    step: steps.map((n, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: t(`step${n}Title`),
      text: t(`step${n}Text`),
    })),
  };
}

export default async function LearnPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const howToSchema = await generateHowToSchema(locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <LearnContent />
    </>
  );
}
