import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale, getTranslations } from 'next-intl/server';
import { locales, getDirection, type Locale } from '@/i18n/config';
import Providers from '../providers';
import type { Metadata } from 'next';
import { Box, Typography } from '@mui/material';
import Script from 'next/script';
import { BASE_URL } from '@/lib/seo';
import { Roboto } from 'next/font/google';
import Footer from '@/components/Footer';
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';

// Optimized font loading with next/font
const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin', 'latin-ext'],
  display: 'swap', // Prevents FOIT (Flash of Invisible Text)
  preload: true,
});

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

// JSON-LD structured data for SEO
function generateJsonLd(locale: string) {
  const names: Record<string, string> = {
    he: 'לפדי - לימוד עברית לילדים',
    en: 'Lepdy - Hebrew Learning for Kids',
    ru: 'Lepdy - Изучение иврита для детей',
  };

  const descriptions: Record<string, string> = {
    he: 'אתר חינוכי אינטראקטיבי לילדים - לימוד אותיות עברית, מספרים, צבעים, צורות ומשחקים חינוכיים. עם הגיית ילדה ישראלית אמיתית.',
    en: 'Interactive educational website for children - learn Hebrew letters, numbers, colors, shapes and educational games. With real Israeli child pronunciation.',
    ru: 'Интерактивный образовательный сайт для детей - изучение ивритских букв, цифр, цветов, форм и развивающие игры. С реальным произношением израильского ребенка.',
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': `${BASE_URL}/#application`,
        name: names[locale] || names.he,
        description: descriptions[locale] || descriptions.he,
        url: locale === 'he' ? BASE_URL : `${BASE_URL}/${locale}`,
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Web Browser',
        browserRequirements: 'Requires JavaScript',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'ILS',
        },
        inLanguage: ['he', 'en', 'ru'],
        audience: {
          '@type': 'EducationalAudience',
          educationalRole: 'student',
          audienceType: 'Children',
        },
        author: {
          '@type': 'Organization',
          '@id': `${BASE_URL}/#organization`,
        },
      },
      {
        '@type': 'Organization',
        '@id': `${BASE_URL}/#organization`,
        name: 'Lepdy',
        alternateName: 'לפדי',
        url: BASE_URL,
        logo: {
          '@type': 'ImageObject',
          url: `${BASE_URL}/android-chrome-512x512.png`,
        },
        sameAs: [],
      },
      {
        '@type': 'WebSite',
        '@id': `${BASE_URL}/#website`,
        url: BASE_URL,
        name: 'Lepdy',
        alternateName: 'לפדי',
        inLanguage: ['he', 'en', 'ru'],
        publisher: {
          '@type': 'Organization',
          '@id': `${BASE_URL}/#organization`,
        },
      },
    ],
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });

  const currentUrl = locale === 'he' ? BASE_URL : `${BASE_URL}/${locale}`;

  return {
    title: t('siteTitle'),
    description: t('siteDescription'),
    keywords: locale === 'he'
      ? ['לימוד עברית לילדים', 'אלף בית לילדים', 'לומדים אותיות', 'משחקים חינוכיים לגיל הרך', 'לימוד אותיות ומספרים', 'עברית לגן']
      : locale === 'ru'
      ? ['иврит для детей', 'алфавит иврита для детей', 'учим буквы иврита', 'развивающие игры', 'алеф бет']
      : ['hebrew for kids', 'learn alef bet', 'hebrew alphabet for toddlers', 'hebrew letters for children', 'learn hebrew for kids', 'hebrew games for kids'],
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: 'any' },
        { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      ],
      apple: [
        { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      ],
    },
    alternates: {
      canonical: currentUrl,
      languages: {
        he: BASE_URL,
        en: `${BASE_URL}/en`,
        ru: `${BASE_URL}/ru`,
        'x-default': BASE_URL,
      },
    },
    openGraph: {
      title: t('siteTitle'),
      description: t('siteDescription'),
      url: currentUrl,
      siteName: 'Lepdy',
      locale: locale === 'he' ? 'he_IL' : locale === 'ru' ? 'ru_RU' : 'en_US',
      type: 'website',
      images: [
        {
          url: `${BASE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: t('siteTitle'),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('siteTitle'),
      description: t('siteDescription'),
      images: [`${BASE_URL}/og-image.png`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();
  const direction = getDirection(locale);

  const jsonLd = generateJsonLd(locale);

  return (
    <html lang={locale} dir={direction}>
      <head>
        {/* Responsive background preloading - load appropriate size for device */}
        <link
          rel="preload"
          href="/images/background-640.webp"
          as="image"
          type="image/webp"
          media="(max-width: 640px)"
        />
        <link
          rel="preload"
          href="/images/background-1024.webp"
          as="image"
          type="image/webp"
          media="(min-width: 641px) and (max-width: 1024px)"
        />
        <link
          rel="preload"
          href="/images/background-1920.webp"
          as="image"
          type="image/webp"
          media="(min-width: 1025px)"
        />
        {/* Responsive background CSS - applied to body for consistent positioning across pages */}
        <style dangerouslySetInnerHTML={{ __html: `
          body {
            background-color: #f0d5c8;
            background-image: url("/images/background-640.webp");
            background-size: cover;
            background-repeat: no-repeat;
            background-position: center center;
            background-attachment: fixed;
          }
          @media (min-width: 641px) {
            body {
              background-image: url("/images/background-1024.webp");
            }
          }
          @media (min-width: 1025px) {
            body {
              background-image: url("/images/background-1920.webp");
            }
          }
          /* Disable fixed attachment on mobile to avoid repaint performance issues */
          @media (max-width: 768px) {
            body {
              background-attachment: scroll;
            }
          }
        `}} />
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={roboto.className} style={{ margin: 0 }}>
        {/* Google Analytics + Google Ads - lazyOnload to not block LCP */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-XMN00ZGJH4"
          strategy="lazyOnload"
        />
        <Script id="gtag-init" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            if (window.location.hostname !== 'localhost') {
              gtag('config', 'G-XMN00ZGJH4');
              gtag('config', 'AW-17878894842');
            }
          `}
        </Script>
        <NextIntlClientProvider messages={messages}>
          <BreadcrumbJsonLd />
          <Providers direction={direction} locale={locale as 'he' | 'en' | 'ru'}>
            <Box
              sx={{
                padding: '20px',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '30px',
                position: 'relative',
                overflowX: 'hidden',
              }}
            >
              {children}
              <Footer />
            </Box>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
