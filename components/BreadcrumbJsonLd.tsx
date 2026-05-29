'use client';

import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Script from 'next/script';

const BASE_URL = 'https://www.lepdy.com';

// Pages that should have breadcrumbs here. Category pages (letters, numbers,
// colors, shapes, animals, food) emit their own breadcrumb + ItemList schema
// server-side via CategorySeoSection, so they are intentionally excluded to
// avoid duplicate BreadcrumbList structured data.
const BREADCRUMB_PAGES: Record<string, string> = {
  games: 'home.buttons.games',
  stickers: 'home.buttons.stickers',
};

export default function BreadcrumbJsonLd() {
  const pathname = usePathname();
  const t = useTranslations();

  // Remove locale prefix if present
  const pathWithoutLocale = pathname.replace(/^\/(en|ru)/, '') || '/';
  const firstSegment = pathWithoutLocale.split('/').filter(Boolean)[0];

  // Only show breadcrumbs for main category pages
  if (!firstSegment || !BREADCRUMB_PAGES[firstSegment]) {
    return null;
  }

  const pageName = t(BREADCRUMB_PAGES[firstSegment]).replace(/\s*[\u{1F300}-\u{1F9FF}]+\s*/gu, '').trim();

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Lepdy',
        item: BASE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: pageName,
        item: `${BASE_URL}/${firstSegment}`,
      },
    ],
  };

  return (
    <Script
      id="breadcrumb-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
