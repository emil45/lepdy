import { setRequestLocale, getTranslations } from 'next-intl/server';
import { generatePageMetadata, getLocaleUrl, BASE_URL } from '@/lib/seo';
import AboutContent from './AboutContent';
import { ABOUT_LAST_UPDATED } from './constants';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return generatePageMetadata(locale, 'about', '/about');
}

const faqIds = ['faq1', 'faq2', 'faq3', 'faq4', 'faq5', 'faq6'];

// AboutPage + FAQPage graph. Freshness dates and founder strengthen E-E-A-T,
// and the FAQ entries remain eligible for rich results.
async function generateAboutSchema(locale: string) {
  const t = await getTranslations({ locale, namespace: 'about' });
  const tSeo = await getTranslations({ locale, namespace: 'seo.pages.about' });
  const url = getLocaleUrl(locale, '/about');

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'AboutPage',
        '@id': `${url}#aboutpage`,
        url,
        name: tSeo('title'),
        description: tSeo('description'),
        inLanguage: locale,
        datePublished: '2025-09-01',
        dateModified: ABOUT_LAST_UPDATED,
        isPartOf: { '@id': `${BASE_URL}/#website` },
        about: { '@id': `${BASE_URL}/#application` },
        publisher: { '@id': `${BASE_URL}/#organization` },
      },
      {
        '@type': 'FAQPage',
        '@id': `${url}#faq`,
        mainEntity: faqIds.map((faq) => ({
          '@type': 'Question',
          name: t(`faq.${faq}.question`),
          acceptedAnswer: {
            '@type': 'Answer',
            text: t(`faq.${faq}.answer`),
          },
        })),
      },
    ],
  };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const schema = await generateAboutSchema(locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <AboutContent />
    </>
  );
}
