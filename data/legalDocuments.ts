import { getLocaleUrl, getOgLocale } from '@/lib/seo';
import type { Metadata } from 'next';

type Locale = 'he' | 'en' | 'ru';

type LegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type LegalDocument = {
  title: string;
  description: string;
  intro: string;
  effectiveDateLabel: string;
  effectiveDate: string;
  contactLabel: string;
  contactEmail: string;
  sections: LegalSection[];
};

type LocalizedLegalDocument = Record<Locale, LegalDocument>;

const PRIVACY_POLICY: LocalizedLegalDocument = {
  en: {
    title: 'Privacy Policy',
    description: 'How Lepdy collects, uses, stores, and shares information.',
    intro:
      'Lepdy is an educational website for families and young children. This Privacy Policy explains what information may be collected when you use Lepdy and how that information is used.',
    effectiveDateLabel: 'Last updated',
    effectiveDate: 'May 30, 2026',
    contactLabel: 'Privacy contact',
    contactEmail: 'emil45@gmail.com',
    sections: [
      {
        title: '1. Information we collect',
        bullets: [
          'Information you choose to provide, such as emails you send to us.',
          'If a parent or guardian uses cloud sync, Google / Firebase authentication may provide basic account details such as email address, display name, profile photo, and account identifiers.',
          'Learning and progress data, such as completed activities, stickers, streaks, and saved word collections. This data is stored in browser storage and may be synced to Firebase when a parent signs in.',
          'Usage and device data collected by analytics and measurement tools we use, including Google Analytics, Google Ads conversion measurement, and Amplitude. This may include pages viewed, interactions, browser/device information, IP-based approximate location, and persistent identifiers.',
        ],
      },
      {
        title: '2. How we use information',
        bullets: [
          'To operate Lepdy, remember progress and preferences, and provide parent cloud sync.',
          'To understand usage, improve the product, debug issues, and measure site performance.',
          'To respond to questions, feedback, or support requests.',
          'To protect the security and integrity of the site.',
        ],
      },
      {
        title: '3. Children and parent-facing features',
        paragraphs: [
          'Lepdy is designed for young learners, but parent-only features such as sign-in, cloud sync, and support contact are intended for parents or guardians.',
          'We do not ask children to directly submit personal information through gameplay. If you believe a child provided personal information to us in error, please email us and we will review the request.',
        ],
      },
      {
        title: '4. Sharing of information',
        bullets: [
          'With service providers that help us operate Lepdy, such as hosting, analytics, authentication, and cloud database providers.',
          'If required by law, legal process, or to protect rights, safety, and security.',
          'As part of a business transfer such as a merger, acquisition, or asset sale.',
        ],
      },
      {
        title: '5. Cookies, local storage, and similar technologies',
        paragraphs: [
          'Lepdy uses cookies, localStorage, sessionStorage, and similar technologies to remember progress, preferences, install prompts, sign-in state, analytics events, and measurement tags.',
          'You can control some of these technologies through your browser settings, but parts of Lepdy may not function properly if storage or cookies are blocked.',
        ],
      },
      {
        title: '6. Data retention',
        bullets: [
          'Browser-stored data remains until it is cleared by you or removed by the browser.',
          'Cloud-synced progress may remain in Firebase until it is deleted, replaced, or no longer needed for the service.',
          'Emails and support messages may be retained as needed to respond, troubleshoot, and keep basic business records.',
        ],
      },
      {
        title: '7. Your choices',
        bullets: [
          'You can use Lepdy without parent sign-in if you do not want cloud sync.',
          'You can clear browser storage from your device settings to remove locally stored progress and preferences.',
          'You can contact us to ask about access, correction, or deletion requests related to information we control.',
        ],
      },
      {
        title: '8. Changes to this policy',
        paragraphs: [
          'We may update this Privacy Policy from time to time. If we make material changes, we will update the date at the top of this page.',
        ],
      },
    ],
  },
  he: {
    title: 'מדיניות פרטיות',
    description: 'איך לפדי אוספת, משתמשת, שומרת ומשתפת מידע.',
    intro:
      'לפדי הוא אתר חינוכי למשפחות ולילדים צעירים. מדיניות פרטיות זו מסבירה איזה מידע עשוי להיאסף בעת השימוש בלפדי ואיך משתמשים בו.',
    effectiveDateLabel: 'עודכן לאחרונה',
    effectiveDate: '30 במאי 2026',
    contactLabel: 'יצירת קשר בענייני פרטיות',
    contactEmail: 'emil45@gmail.com',
    sections: [
      {
        title: '1. איזה מידע אנחנו אוספים',
        bullets: [
          'מידע שאתם בוחרים למסור, למשל אימיילים שאתם שולחים אלינו.',
          'אם הורה או אפוטרופוס משתמשים בסנכרון ענן, אימות Google / Firebase עשוי לספק פרטי חשבון בסיסיים כמו כתובת אימייל, שם תצוגה, תמונת פרופיל ומזהי חשבון.',
          'נתוני למידה והתקדמות, כמו פעילויות שהושלמו, מדבקות, רצפים ואוסף מילים שמור. מידע זה נשמר באחסון הדפדפן ויכול להסתנכרן ל-Firebase כאשר הורה מתחבר.',
          'נתוני שימוש ומכשיר הנאספים באמצעות כלי אנליטיקה ומדידה שבהם אנו משתמשים, כולל Google Analytics, מדידת המרות של Google Ads ו-Amplitude. זה עשוי לכלול דפים שנצפו, אינטראקציות, מידע על הדפדפן או המכשיר, מיקום משוער המבוסס על IP ומזהים מתמשכים.',
        ],
      },
      {
        title: '2. איך אנחנו משתמשים במידע',
        bullets: [
          'כדי להפעיל את לפדי, לזכור התקדמות והעדפות, ולספק סנכרון ענן להורים.',
          'כדי להבין שימוש, לשפר את המוצר, לאתר תקלות ולמדוד ביצועי אתר.',
          'כדי לענות על שאלות, משוב או בקשות תמיכה.',
          'כדי להגן על האבטחה והשלמות של האתר.',
        ],
      },
      {
        title: '3. ילדים ופיצ׳רים המיועדים להורים',
        paragraphs: [
          'לפדי מיועד ללומדים צעירים, אך פיצ׳רים להורים בלבד כמו התחברות, סנכרון ענן ויצירת קשר לתמיכה מיועדים להורים או אפוטרופוסים.',
          'אנחנו לא מבקשים מילדים למסור לנו ישירות מידע אישי כחלק מהמשחקים. אם אתם חושבים שילד מסר לנו מידע אישי בטעות, שלחו לנו אימייל ונבדוק את הבקשה.',
        ],
      },
      {
        title: '4. שיתוף מידע',
        bullets: [
          'עם ספקי שירות שעוזרים לנו להפעיל את לפדי, כמו ספקי אחסון, אנליטיקה, אימות ומסדי נתונים בענן.',
          'אם הדבר נדרש לפי חוק, הליך משפטי, או כדי להגן על זכויות, בטיחות ואבטחה.',
          'כחלק מהעברת פעילות עסקית, כגון מיזוג, רכישה או מכירת נכסים.',
        ],
      },
      {
        title: '5. קובצי Cookie, אחסון מקומי וטכנולוגיות דומות',
        paragraphs: [
          'לפדי משתמשת ב-cookies, ב-localStorage, ב-sessionStorage ובטכנולוגיות דומות כדי לזכור התקדמות, העדפות, חלונות התקנה, מצב התחברות, אירועי אנליטיקה ותגי מדידה.',
          'אפשר לשלוט בחלק מהטכנולוגיות האלה דרך הגדרות הדפדפן, אך ייתכן שחלקים מלפדי לא יעבדו כראוי אם cookies או אחסון ייחסמו.',
        ],
      },
      {
        title: '6. שמירת מידע',
        bullets: [
          'מידע הנשמר בדפדפן נשאר עד שאתם מוחקים אותו או עד שהדפדפן מסיר אותו.',
          'נתוני התקדמות המסונכרנים לענן עשויים להישמר ב-Firebase עד שהם נמחקים, מוחלפים או אינם נחוצים עוד לשירות.',
          'אימיילים והודעות תמיכה עשויים להישמר לפי הצורך כדי להגיב, לפתור תקלות ולנהל רישומים עסקיים בסיסיים.',
        ],
      },
      {
        title: '7. הבחירות שלכם',
        bullets: [
          'אפשר להשתמש בלפדי בלי התחברות הורה אם אינכם רוצים סנכרון ענן.',
          'אפשר לנקות את אחסון הדפדפן בהגדרות המכשיר כדי להסיר התקדמות והעדפות שנשמרו מקומית.',
          'אפשר ליצור איתנו קשר כדי לבקש גישה, תיקון או מחיקה של מידע שנמצא בשליטתנו.',
        ],
      },
      {
        title: '8. שינויים במדיניות הזו',
        paragraphs: [
          'אנחנו עשויים לעדכן את מדיניות הפרטיות מעת לעת. אם נבצע שינוי מהותי, נעדכן את התאריך בראש העמוד.',
        ],
      },
    ],
  },
  ru: {
    title: 'Политика конфиденциальности',
    description: 'Как Lepdy собирает, использует, хранит и раскрывает информацию.',
    intro:
      'Lepdy — это образовательный сайт для семей и маленьких детей. В этой Политике конфиденциальности объясняется, какая информация может собираться при использовании Lepdy и как она используется.',
    effectiveDateLabel: 'Последнее обновление',
    effectiveDate: '30 мая 2026 г.',
    contactLabel: 'Контакт по вопросам конфиденциальности',
    contactEmail: 'emil45@gmail.com',
    sections: [
      {
        title: '1. Какую информацию мы собираем',
        bullets: [
          'Информацию, которую вы решаете предоставить, например письма, отправленные нам по email.',
          'Если родитель или опекун использует облачную синхронизацию, аутентификация Google / Firebase может предоставить базовые данные аккаунта, такие как email, отображаемое имя, фото профиля и идентификаторы аккаунта.',
          'Данные обучения и прогресса, например завершённые задания, стикеры, серии занятий и сохранённые коллекции слов. Эти данные хранятся в памяти браузера и могут синхронизироваться с Firebase, когда родитель входит в систему.',
          'Данные об использовании и устройстве, собираемые с помощью наших инструментов аналитики и измерения, включая Google Analytics, измерение конверсий Google Ads и Amplitude. Это может включать просмотренные страницы, взаимодействия, сведения о браузере или устройстве, примерное местоположение по IP и постоянные идентификаторы.',
        ],
      },
      {
        title: '2. Как мы используем информацию',
        bullets: [
          'Чтобы обеспечивать работу Lepdy, запоминать прогресс и настройки, а также предоставлять родительскую облачную синхронизацию.',
          'Чтобы понимать использование, улучшать продукт, устранять ошибки и измерять производительность сайта.',
          'Чтобы отвечать на вопросы, отзывы и запросы в поддержку.',
          'Чтобы защищать безопасность и целостность сайта.',
        ],
      },
      {
        title: '3. Дети и функции для родителей',
        paragraphs: [
          'Lepdy предназначен для маленьких учеников, но функции только для родителей, такие как вход, облачная синхронизация и связь с поддержкой, предназначены для родителей или опекунов.',
          'Мы не просим детей напрямую предоставлять личную информацию в процессе игры. Если вы считаете, что ребёнок по ошибке предоставил нам личную информацию, напишите нам, и мы рассмотрим запрос.',
        ],
      },
      {
        title: '4. Передача информации',
        bullets: [
          'Поставщикам услуг, которые помогают нам поддерживать Lepdy, включая хостинг, аналитику, аутентификацию и облачную базу данных.',
          'Если это требуется законом, юридическим процессом или для защиты прав, безопасности и целостности.',
          'В рамках корпоративной сделки, например слияния, покупки или продажи активов.',
        ],
      },
      {
        title: '5. Cookies, локальное хранилище и похожие технологии',
        paragraphs: [
          'Lepdy использует cookies, localStorage, sessionStorage и похожие технологии, чтобы запоминать прогресс, настройки, состояние установочных подсказок, статус входа, аналитические события и измерительные теги.',
          'Вы можете управлять частью этих технологий через настройки браузера, но некоторые части Lepdy могут работать некорректно, если cookies или хранилище отключены.',
        ],
      },
      {
        title: '6. Срок хранения данных',
        bullets: [
          'Данные, сохранённые в браузере, остаются там, пока вы их не удалите или пока браузер их не очистит.',
          'Данные прогресса, синхронизированные в облако, могут храниться в Firebase, пока они не будут удалены, заменены или пока они нужны для работы сервиса.',
          'Письма и сообщения в поддержку могут храниться столько, сколько нужно для ответа, устранения проблем и ведения базовых деловых записей.',
        ],
      },
      {
        title: '7. Ваш выбор',
        bullets: [
          'Вы можете пользоваться Lepdy без родительского входа, если не хотите использовать облачную синхронизацию.',
          'Вы можете очистить хранилище браузера в настройках устройства, чтобы удалить локально сохранённый прогресс и настройки.',
          'Вы можете связаться с нами, чтобы запросить доступ, исправление или удаление информации, которая находится под нашим контролем.',
        ],
      },
      {
        title: '8. Изменения этой политики',
        paragraphs: [
          'Мы можем время от времени обновлять эту Политику конфиденциальности. Если изменения будут существенными, мы обновим дату в верхней части страницы.',
        ],
      },
    ],
  },
};

const TERMS_OF_USE: LocalizedLegalDocument = {
  en: {
    title: 'Terms of Use',
    description: 'The basic rules for using Lepdy.',
    intro:
      'These Terms of Use govern your access to and use of Lepdy. By using Lepdy, you agree to these terms.',
    effectiveDateLabel: 'Last updated',
    effectiveDate: 'May 30, 2026',
    contactLabel: 'Legal contact',
    contactEmail: 'emil45@gmail.com',
    sections: [
      {
        title: '1. Family use',
        paragraphs: [
          'Lepdy is intended for families and young learners. Parent-facing features, including sign-in, support, and settings that affect saved data, should be used by a parent or guardian.',
        ],
      },
      {
        title: '2. Permitted use',
        bullets: [
          'You may use Lepdy for personal, family, and non-commercial educational use.',
          'You may not misuse the service, interfere with its operation, attempt unauthorized access, scrape the site at scale, or use Lepdy in a way that violates law or the rights of others.',
        ],
      },
      {
        title: '3. Accounts and cloud sync',
        paragraphs: [
          'If you choose to use parent sign-in and cloud sync, you are responsible for the Google account you use and for activity that occurs through that account.',
          'We may change, limit, or discontinue cloud sync features at any time.',
        ],
      },
      {
        title: '4. Intellectual property',
        paragraphs: [
          'Lepdy, including its design, text, graphics, audio, games, and software, is protected by intellectual property laws. Except where law allows otherwise, you may not copy, resell, or distribute substantial parts of Lepdy without permission.',
        ],
      },
      {
        title: '5. Third-party services',
        paragraphs: [
          'Lepdy relies on third-party services such as Google, Firebase, and Amplitude. Those services are governed by their own terms and privacy practices.',
        ],
      },
      {
        title: '6. Availability and changes',
        paragraphs: [
          'We may update, suspend, or stop any part of Lepdy at any time. We do not guarantee that Lepdy will always be available, error-free, or suitable for every device or use case.',
        ],
      },
      {
        title: '7. Educational information only',
        paragraphs: [
          'Lepdy is provided for general educational purposes. It is not professional educational, medical, legal, or therapeutic advice.',
        ],
      },
      {
        title: '8. Disclaimers and limitation of liability',
        paragraphs: [
          'To the maximum extent permitted by law, Lepdy is provided "as is" and "as available" without warranties of any kind. To the maximum extent permitted by law, we are not liable for indirect, incidental, special, consequential, or punitive damages, or for loss of data, use, or goodwill arising from your use of Lepdy.',
        ],
      },
      {
        title: '9. Changes to these terms',
        paragraphs: [
          'We may update these Terms of Use from time to time. Continued use of Lepdy after updated terms are posted means you accept the updated terms.',
        ],
      },
    ],
  },
  he: {
    title: 'תנאי שימוש',
    description: 'הכללים הבסיסיים לשימוש בלפדי.',
    intro:
      'תנאי שימוש אלה מסדירים את הגישה שלכם ללפדי ואת השימוש בה. בעצם השימוש בלפדי אתם מסכימים לתנאים אלה.',
    effectiveDateLabel: 'עודכן לאחרונה',
    effectiveDate: '30 במאי 2026',
    contactLabel: 'יצירת קשר בעניינים משפטיים',
    contactEmail: 'emil45@gmail.com',
    sections: [
      {
        title: '1. שימוש משפחתי',
        paragraphs: [
          'לפדי מיועדת למשפחות וללומדים צעירים. פיצ׳רים המיועדים להורים, כולל התחברות, תמיכה והגדרות המשפיעות על נתונים שמורים, צריכים לשמש הורה או אפוטרופוס.',
        ],
      },
      {
        title: '2. שימוש מותר',
        bullets: [
          'מותר להשתמש בלפדי לשימוש אישי, משפחתי וחינוכי שאינו מסחרי.',
          'אסור לעשות שימוש לרעה בשירות, להפריע לפעולתו, לנסות להשיג גישה לא מורשית, לגרד את האתר בהיקף רחב, או להשתמש בלפדי בניגוד לחוק או לזכויות של אחרים.',
        ],
      },
      {
        title: '3. חשבונות וסנכרון ענן',
        paragraphs: [
          'אם תבחרו להשתמש בהתחברות הורה ובסנכרון ענן, אתם אחראים לחשבון Google שבו אתם משתמשים ולכל פעילות המתרחשת דרך אותו חשבון.',
          'אנחנו רשאים לשנות, להגביל או להפסיק פיצ׳רים של סנכרון ענן בכל עת.',
        ],
      },
      {
        title: '4. קניין רוחני',
        paragraphs: [
          'לפדי, כולל העיצוב, הטקסטים, הגרפיקה, האודיו, המשחקים והתוכנה שלה, מוגנת בדיני קניין רוחני. למעט אם הדין מתיר אחרת, אין להעתיק, למכור מחדש או להפיץ חלקים מהותיים מלפדי ללא רשות.',
        ],
      },
      {
        title: '5. שירותי צד שלישי',
        paragraphs: [
          'לפדי מסתמכת על שירותי צד שלישי כגון Google, Firebase ו-Amplitude. שירותים אלה כפופים לתנאים ולנוהלי הפרטיות שלהם עצמם.',
        ],
      },
      {
        title: '6. זמינות ושינויים',
        paragraphs: [
          'אנחנו רשאים לעדכן, להשעות או להפסיק כל חלק מלפדי בכל עת. איננו מתחייבים שלפדי תהיה זמינה תמיד, חפה משגיאות או מתאימה לכל מכשיר או מקרה שימוש.',
        ],
      },
      {
        title: '7. מידע חינוכי בלבד',
        paragraphs: [
          'לפדי ניתנת למטרות חינוכיות כלליות בלבד. היא אינה ייעוץ מקצועי חינוכי, רפואי, משפטי או טיפולי.',
        ],
      },
      {
        title: '8. הסתייגויות והגבלת אחריות',
        paragraphs: [
          'במידה המרבית שהדין מתיר, לפדי ניתנת "כמות שהיא" ו"כפי שהיא זמינה" ללא אחריות מכל סוג. במידה המרבית שהדין מתיר, לא נהיה אחראים לנזקים עקיפים, נלווים, מיוחדים, תוצאתיים או עונשיים, או לאובדן נתונים, שימוש או מוניטין הנובעים מהשימוש שלכם בלפדי.',
        ],
      },
      {
        title: '9. שינויים בתנאים אלה',
        paragraphs: [
          'אנחנו עשויים לעדכן את תנאי השימוש מעת לעת. המשך השימוש בלפדי לאחר פרסום תנאים מעודכנים פירושו שאתם מסכימים לתנאים המעודכנים.',
        ],
      },
    ],
  },
  ru: {
    title: 'Условия использования',
    description: 'Основные правила использования Lepdy.',
    intro:
      'Эти Условия использования регулируют ваш доступ к Lepdy и использование сервиса. Используя Lepdy, вы соглашаетесь с этими условиями.',
    effectiveDateLabel: 'Последнее обновление',
    effectiveDate: '30 мая 2026 г.',
    contactLabel: 'Юридический контакт',
    contactEmail: 'emil45@gmail.com',
    sections: [
      {
        title: '1. Семейное использование',
        paragraphs: [
          'Lepdy предназначен для семей и маленьких учеников. Функции для родителей, включая вход, поддержку и настройки, влияющие на сохранённые данные, должны использоваться родителем или опекуном.',
        ],
      },
      {
        title: '2. Разрешённое использование',
        bullets: [
          'Вы можете использовать Lepdy в личных, семейных и некоммерческих образовательных целях.',
          'Вы не можете злоупотреблять сервисом, мешать его работе, пытаться получить несанкционированный доступ, массово сканировать сайт или использовать Lepdy с нарушением закона или прав других лиц.',
        ],
      },
      {
        title: '3. Аккаунты и облачная синхронизация',
        paragraphs: [
          'Если вы решите использовать родительский вход и облачную синхронизацию, вы несёте ответственность за аккаунт Google, который используете, и за действия, совершаемые через него.',
          'Мы можем изменить, ограничить или прекратить функции облачной синхронизации в любое время.',
        ],
      },
      {
        title: '4. Интеллектуальная собственность',
        paragraphs: [
          'Lepdy, включая дизайн, тексты, графику, аудио, игры и программное обеспечение, защищён законами об интеллектуальной собственности. Если закон прямо не разрешает иное, вы не можете копировать, перепродавать или распространять существенные части Lepdy без разрешения.',
        ],
      },
      {
        title: '5. Сторонние сервисы',
        paragraphs: [
          'Lepdy использует сторонние сервисы, такие как Google, Firebase и Amplitude. Эти сервисы регулируются собственными условиями и правилами конфиденциальности.',
        ],
      },
      {
        title: '6. Доступность и изменения',
        paragraphs: [
          'Мы можем обновлять, приостанавливать или прекращать любую часть Lepdy в любое время. Мы не гарантируем, что Lepdy всегда будет доступен, не будет содержать ошибок или подойдёт для любого устройства или сценария использования.',
        ],
      },
      {
        title: '7. Только образовательная информация',
        paragraphs: [
          'Lepdy предоставляется только для общих образовательных целей. Это не профессиональная образовательная, медицинская, юридическая или терапевтическая консультация.',
        ],
      },
      {
        title: '8. Отказ от гарантий и ограничение ответственности',
        paragraphs: [
          'В максимально допустимой законом степени Lepdy предоставляется "как есть" и "по мере доступности" без каких-либо гарантий. В максимально допустимой законом степени мы не несем ответственности за косвенные, случайные, специальные, последующие или штрафные убытки, а также за потерю данных, использования или деловой репутации, возникающие из-за использования Lepdy.',
        ],
      },
      {
        title: '9. Изменения этих условий',
        paragraphs: [
          'Мы можем время от времени обновлять эти Условия использования. Продолжая использовать Lepdy после публикации обновлённых условий, вы принимаете обновлённые условия.',
        ],
      },
    ],
  },
};

const DOCUMENTS = {
  privacy: PRIVACY_POLICY,
  terms: TERMS_OF_USE,
} as const;

export type LegalDocumentKind = keyof typeof DOCUMENTS;

export function getLegalDocument(
  kind: LegalDocumentKind,
  locale: Locale
): LegalDocument {
  return DOCUMENTS[kind][locale];
}

export function generateLegalMetadata(
  kind: LegalDocumentKind,
  locale: Locale,
  path: string
): Metadata {
  const doc = getLegalDocument(kind, locale);
  const currentUrl = getLocaleUrl(locale, path);

  return {
    title: doc.title,
    description: doc.description,
    alternates: {
      canonical: currentUrl,
      languages: {
        he: getLocaleUrl('he', path),
        en: getLocaleUrl('en', path),
        ru: getLocaleUrl('ru', path),
        'x-default': getLocaleUrl('he', path),
      },
    },
    openGraph: {
      title: doc.title,
      description: doc.description,
      url: currentUrl,
      siteName: 'Lepdy',
      locale: getOgLocale(locale),
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: doc.title,
      description: doc.description,
    },
  };
}
