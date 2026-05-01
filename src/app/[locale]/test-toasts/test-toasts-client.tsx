'use client';

import {
  ArrowLeftIcon,
  BoltIcon,
  CircleAlertIcon,
  HelpCircleIcon,
  KeyRoundIcon,
  PencilIcon,
  SearchXIcon,
  WifiOffIcon,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Link } from '@/shared/config/i18n/navigation';
import {
  useNotifyApiError,
  type ApiErrorReason,
} from '@/shared/lib/notify-api-error';
import { Button } from '@/shared/ui/button';
import { Toaster } from '@/shared/ui/sonner';

type StandardCase = {
  reason: ApiErrorReason;
  icon: LucideIcon;
  labelKey: string;
};

const CODE_SNIPPET = `const notifyApiError = useNotifyApiError();

async function onSubmit(values) {
  const result = await myAction(values);
  if (result.ok) { /* success */ return; }
  notifyApiError(result.reason);
}`;

const STANDARD_CASES: StandardCase[] = [
  { reason: 'network', icon: WifiOffIcon, labelKey: 'network' },
  { reason: 'unauthorized', icon: KeyRoundIcon, labelKey: 'unauthorized' },
  { reason: 'notFound', icon: SearchXIcon, labelKey: 'notFound' },
  { reason: 'validation', icon: PencilIcon, labelKey: 'validation' },
  { reason: 'unknown', icon: HelpCircleIcon, labelKey: 'unknown' },
];

export function TestToastsClient() {
  const t = useTranslations('test-toasts');
  const notifyApiError = useNotifyApiError();
  const [pending, setPending] = useState(false);

  async function simulateAsync() {
    setPending(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      notifyApiError('network');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 md:px-6 md:py-4">
          <Button
            size="icon-sm"
            variant="ghost"
            render={<Link href="/" aria-label={t('back')} />}
            nativeButton={false}
          >
            <ArrowLeftIcon className="size-4" />
          </Button>
          <div className="flex flex-col">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              demo
            </span>
            <h1 className="font-heading text-base font-semibold tracking-tight text-foreground">
              {t('title')}
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 md:px-6 md:py-10">
        <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
          {t('description')}
        </p>

        <Section
          title={t('sections.standard.title')}
          subtitle={t('sections.standard.subtitle')}
        >
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {STANDARD_CASES.map(({ reason, icon: Icon, labelKey }) => (
              <Button
                key={reason}
                variant="outline"
                size="lg"
                onClick={() => notifyApiError(reason)}
                className="h-11 justify-start gap-2 text-[15px]"
              >
                <Icon />
                {t(`buttons.${labelKey}`)}
              </Button>
            ))}
          </div>
        </Section>

        <Section
          title={t('sections.advanced.title')}
          subtitle={t('sections.advanced.subtitle')}
        >
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button
              variant="outline"
              size="lg"
              onClick={() =>
                notifyApiError(
                  'unknown',
                  'Не удалось опубликовать продукт «Дизайн-система с нуля» — это override-сообщение.',
                )
              }
              className="h-11 justify-start gap-2 text-[15px]"
            >
              <CircleAlertIcon />
              {t('buttons.override')}
            </Button>
            <Button
              variant="outline"
              size="lg"
              disabled={pending}
              onClick={simulateAsync}
              className="h-11 justify-start gap-2 text-[15px]"
            >
              <BoltIcon />
              {pending ? t('buttons.asyncRunning') : t('buttons.async')}
            </Button>
          </div>
        </Section>

        <Section title={t('code.title')}>
          <pre className="overflow-x-auto rounded-xl bg-muted/60 p-4 font-mono text-xs leading-relaxed text-foreground ring-1 ring-foreground/10">
            <code>{CODE_SNIPPET}</code>
          </pre>
        </Section>
      </main>

      <Toaster />
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {subtitle ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
