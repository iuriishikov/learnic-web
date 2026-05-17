'use client';

import { CheckIcon, ChevronDownIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import type { CodeLanguage } from '@/shared/ui/code-block-tokenize';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

import {
  LANGUAGE_DOT_CLASSES,
  LANGUAGE_GROUPS,
  LANGUAGE_LOOKUP,
} from './constants';

type LanguagePickerProps = {
  value: CodeLanguage;
  onChange: (next: CodeLanguage) => void;
};

export function LanguagePicker({ value, onChange }: LanguagePickerProps) {
  const t = useTranslations('code-block.editor');
  const triggerId = useId();
  const label = LANGUAGE_LOOKUP.get(value) ?? value;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            id={triggerId}
            type="button"
            variant="ghost"
            size="sm"
            aria-label={t('languageAria')}
            className={cn(
              'h-7 shrink-0 gap-1.5 rounded-md border border-transparent px-2 text-[12px] font-medium text-muted-foreground',
              'hover:border-border hover:bg-background hover:text-foreground',
              'data-[state=open]:border-border data-[state=open]:bg-background data-[state=open]:text-foreground',
            )}
          />
        }
      >
        <LanguageDot language={value} />
        <span className="font-mono">{label}</span>
        <ChevronDownIcon className="size-3 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="w-56 p-1">
        {LANGUAGE_GROUPS.map((group, idx) => (
          <DropdownMenuGroup key={group.heading}>
            {idx > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuLabel className="px-2 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t(`languageGroup.${group.heading}`)}
            </DropdownMenuLabel>
            {group.options.map((opt) => {
              const isActive = opt.value === value;
              return (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => onChange(opt.value)}
                  className={cn(
                    'group/lang flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[13px]',
                    isActive && 'bg-brand/10 text-brand',
                  )}
                >
                  <LanguageDot language={opt.value} />
                  <span className="flex-1 font-mono">{opt.label}</span>
                  <AnimatePresence>
                    {isActive ? (
                      <motion.span
                        key="check"
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.6 }}
                        transition={{ duration: 0.12 }}
                        aria-hidden
                      >
                        <CheckIcon className="size-3.5 text-brand" />
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function LanguageDot({ language }: { language: CodeLanguage }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-block size-2 shrink-0 rounded-full',
        LANGUAGE_DOT_CLASSES[language],
      )}
    />
  );
}
