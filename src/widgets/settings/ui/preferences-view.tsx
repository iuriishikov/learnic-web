'use client';

import {
  CheckIcon,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
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
        <Select
          value={locale}
          onValueChange={handleLocaleChange}
          disabled={pending}
        >
          <SelectTrigger
            id="settings-language"
            className="w-full max-w-xs"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LOCALE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {tLanguage(`options.${option.value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
