import { setRequestLocale, getTranslations } from 'next-intl/server';
import { generatePageMetadata } from '@/lib/seo';
import AboutContent from './AboutContent';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return generatePageMetadata(locale, 'about', '/about');
}

// Generate FAQ Schema for rich snippets
async function generateFAQSchema(locale: string) {
  const t = await getTranslations({ locale, namespace: 'seo' });

  const faqIds = ['faq1', 'faq2', 'faq3', 'faq4', 'faq5', 'faq6'];

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqIds.map((faq) => ({
      '@type': 'Question',
      name: t(`faq.${faq}.question`),
      acceptedAnswer: {
        '@type': 'Answer',
        text: t(`faq.${faq}.answer`),
      },
    })),
  };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const faqSchema = await generateFAQSchema(locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <AboutContent />
    </>
  );
}
