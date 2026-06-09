'use client';

import {
  CheckIcon,
  ChevronDownIcon,
  MonitorIcon,
  MoonIcon,
  SunIcon,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useTransition } from 'react';

import { usePathname, useRouter } from '@/shared/config/i18n/navigation';
import { cn } from '@/shared/lib/utils';
import {
  Menu,
  MenuContent,
  MenuGroup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from '@/shared/ui/menu';
import { SettingsRow, SettingsSection } from '@/widgets/settings';

const THEME_OPTIONS = [
  { value: 'system', icon: MonitorIcon },
  { value: 'light', icon: SunIcon },
  { value: 'dark', icon: MoonIcon },
] as const;

const LOCALE_OPTIONS = [{ value: 'ru' }] as const;

export function PreferencesView() {
  const t = useTranslations('settings.preferences');
  const tTheme = useTranslations('settings.preferences.theme');
  const tLanguage = useTranslations('settings.preferences.language');
  const { theme, setTheme } = useTheme();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  // Guard against a locale without a catalog entry (e.g. a manual /en visit):
  // `options.*` only lists shipped locales, so fall back to the first option.
  const activeLocale = LOCALE_OPTIONS.some((option) => option.value === locale)
    ? (locale as (typeof LOCALE_OPTIONS)[number]['value'])
    : LOCALE_OPTIONS[0].value;

  function handleLocaleChange(next: string | null) {
    if (!next || next === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: next as 'ru' | 'en' });
    });
  }

  return (
    <SettingsSection title={t('title')} description={t('description')}>
      <SettingsRow
        label={tTheme('label')}
        description={tTheme('description')}
      >
        <div
          role="radiogroup"
          aria-label={tTheme('label')}
          className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3"
        >
          {THEME_OPTIONS.map((option) => {
            const Icon = option.icon;
            const checked = (theme ?? 'system') === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={checked}
                onClick={() => setTheme(option.value)}
                className={cn(
                  'group relative flex flex-col items-start gap-3 rounded-xl border bg-card p-4 text-left transition-all',
                  checked
                    ? 'border-brand ring-2 ring-brand/30'
                    : 'border-border hover:border-foreground/20',
                )}
              >
                <ThemePreview variant={option.value} />
                <div className="flex w-full items-center gap-2">
                  <Icon className="size-4 text-muted-foreground" aria-hidden />
                  <span className="text-sm font-semibold text-foreground">
                    {tTheme(`options.${option.value}`)}
                  </span>
                  {checked ? (
                    <CheckIcon
                      className="ml-auto size-4 text-brand"
                      aria-hidden
                    />
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </SettingsRow>

      <SettingsRow
        label={tLanguage('label')}
        description={tLanguage('description')}
        labelFor="settings-language"
      >
        <Menu>
          <MenuTrigger
            id="settings-language"
            disabled={pending}
            className="flex h-8 w-full max-w-xs items-center justify-between gap-1.5 rounded-md border border-input bg-background py-1 pr-2 pl-2.5 text-sm whitespace-nowrap text-foreground outline-none transition-colors hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 data-popup-open:border-ring data-popup-open:ring-3 data-popup-open:ring-ring/40"
          >
            <span>{tLanguage(`options.${activeLocale}`)}</span>
            <ChevronDownIcon className="size-4 text-muted-foreground" />
          </MenuTrigger>
          <MenuContent size="md" align="start">
            <MenuGroup>
              <MenuRadioGroup
                value={activeLocale}
                onValueChange={(next) => handleLocaleChange(String(next))}
              >
                {LOCALE_OPTIONS.map((option) => (
                  <MenuRadioItem key={option.value} value={option.value}>
                    {tLanguage(`options.${option.value}`)}
                  </MenuRadioItem>
                ))}
              </MenuRadioGroup>
            </MenuGroup>
          </MenuContent>
        </Menu>
      </SettingsRow>
    </SettingsSection>
  );
}

type ThemePreviewProps = {
  variant: 'system' | 'light' | 'dark';
};

function ThemePreview({ variant }: ThemePreviewProps) {
  const lightFace = (
    <div className="flex h-full flex-col gap-1.5 bg-white p-2">
      <div className="flex items-center gap-1">
        <div className="size-1.5 rounded-full bg-zinc-200" />
        <div className="size-1.5 rounded-full bg-zinc-200" />
        <div className="size-1.5 rounded-full bg-zinc-200" />
      </div>
      <div className="h-2 w-1/2 rounded bg-zinc-200" />
      <div className="h-1.5 w-3/4 rounded bg-zinc-100" />
      <div className="h-1.5 w-2/3 rounded bg-zinc-100" />
      <div className="mt-auto h-3 w-12 rounded bg-zinc-300" />
    </div>
  );

  const darkFace = (
    <div className="flex h-full flex-col gap-1.5 bg-zinc-900 p-2">
      <div className="flex items-center gap-1">
        <div className="size-1.5 rounded-full bg-zinc-700" />
        <div className="size-1.5 rounded-full bg-zinc-700" />
        <div className="size-1.5 rounded-full bg-zinc-700" />
      </div>
      <div className="h-2 w-1/2 rounded bg-zinc-700" />
      <div className="h-1.5 w-3/4 rounded bg-zinc-800" />
      <div className="h-1.5 w-2/3 rounded bg-zinc-800" />
      <div className="mt-auto h-3 w-12 rounded bg-zinc-600" />
    </div>
  );

  if (variant === 'system') {
    return (
      <div className="grid h-24 w-full grid-cols-2 overflow-hidden rounded-md border border-border">
        {lightFace}
        {darkFace}
      </div>
    );
  }

  return (
    <div className="h-24 w-full overflow-hidden rounded-md border border-border">
      {variant === 'light' ? lightFace : darkFace}
    </div>
  );
}
