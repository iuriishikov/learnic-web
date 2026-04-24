import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Link } from '@/shared/config/i18n/navigation';
import { Button } from '@/shared/ui/button';

type LoginPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LoginPage({ params }: LoginPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('auth');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16">
      <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
        <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
          {t('login.title')}
        </h1>
        <p className="text-muted-foreground">{t('login.description')}</p>
        <Button
          variant="outline"
          className="mt-4 h-10 rounded-lg px-4"
          render={<Link href="/" />}
          nativeButton={false}
        >
          {t('backToHome')}
        </Button>
      </div>
    </main>
  );
}
