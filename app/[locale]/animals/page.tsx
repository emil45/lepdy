import { setRequestLocale } from 'next-intl/server';
import { generatePageMetadata } from '@/lib/seo';
import CategoryPage from '@/components/CategoryPage';
import CategorySeoSection from '@/components/CategorySeoSection';
import animals from '@/data/animals';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return generatePageMetadata(locale, 'animals', '/animals');
}

export default async function AnimalsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <CategoryPage
        pageName="animals"
        items={animals}
        translationPrefix="animals"
        audioPath="animals"
        renderMode="image"
        category="animals"
      />
      <CategorySeoSection
        locale={locale}
        titleKey="seo.pages.animals.listTitle"
        path="/animals"
        breadcrumbKey="home.buttons.animals"
        translationPrefix="animals"
        itemIds={animals.map((i) => i.id)}
        mode="vocab"
      />
    </>
  );
}
