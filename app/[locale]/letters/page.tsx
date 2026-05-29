import { setRequestLocale } from 'next-intl/server';
import { generatePageMetadata } from '@/lib/seo';
import CategoryPage from '@/components/CategoryPage';
import CategorySeoSection from '@/components/CategorySeoSection';
import letters from '@/data/letters';
import Script from 'next/script';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return generatePageMetadata(locale, 'letters', '/letters');
}

export default async function LettersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Script id="letters-conversion" strategy="afterInteractive">
        {`if(typeof gtag !== 'undefined') gtag('event', 'conversion', {'send_to': 'AW-17878894842/yb27COTis-cbEPqRqc1C'});`}
      </Script>
      <CategoryPage
        pageName="letters"
        items={letters}
        translationPrefix="letters"
        audioPath="letters"
        renderMode="text"
        forceRTL={true}
        hasFullName={true}
        category="letters"
      />
      <CategorySeoSection
        locale={locale}
        titleKey="seo.pages.letters.listTitle"
        path="/letters"
        breadcrumbKey="home.buttons.letters"
        translationPrefix="letters"
        itemIds={letters.map((i) => i.id)}
        mode="symbol"
      />
    </>
  );
}
