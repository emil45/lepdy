import { setRequestLocale } from 'next-intl/server';
import { generatePageMetadata } from '@/lib/seo';
import CategoryPage from '@/components/CategoryPage';
import CategorySeoSection from '@/components/CategorySeoSection';
import food from '@/data/food';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return generatePageMetadata(locale, 'food', '/food');
}

export default async function FoodPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <CategoryPage
        pageName="food"
        items={food}
        translationPrefix="food"
        audioPath="food"
        renderMode="image"
        category="food"
      />
      <CategorySeoSection
        locale={locale}
        titleKey="seo.pages.food.listTitle"
        path="/food"
        breadcrumbKey="home.buttons.food"
        translationPrefix="food"
        itemIds={food.map((i) => i.id)}
        mode="vocab"
      />
    </>
  );
}
