'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { SearchIcon, UserIcon } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import { Kbd } from '@/shared/ui/kbd';
import {
  MultiSelect,
  type MultiSelectOption,
} from '@/shared/ui/multi-select';
import {
  SingleSelectV2,
  type SingleOption,
} from '@/shared/ui/single-select-v2';
import { TagSearch, type TagSearchOption } from '@/shared/ui/tag-search';

// ────────────────────────────────────────────────────────────────────────────
// Data

type TeamKey =
  | 'engineering'
  | 'design'
  | 'product'
  | 'marketing'
  | 'sales'
  | 'customerSuccess'
  | 'operations'
  | 'finance';

const TEAM_USER_COUNTS: Record<TeamKey, number> = {
  engineering: 12,
  design: 10,
  product: 6,
  marketing: 8,
  sales: 12,
  customerSuccess: 4,
  operations: 2,
  finance: 2,
};

const TEAM_KEYS: TeamKey[] = [
  'engineering',
  'design',
  'product',
  'marketing',
  'sales',
  'customerSuccess',
  'operations',
  'finance',
];

type Person = {
  id: string;
  name: string;
  handle: string;
  avatarTone: string;
};

const PEOPLE: Person[] = [
  { id: 'phoenix', name: 'Phoenix Baker', handle: '@phoenix', avatarTone: 'bg-avatar-1' },
  { id: 'olivia', name: 'Olivia Rhye', handle: '@olivia', avatarTone: 'bg-avatar-6' },
  { id: 'lana', name: 'Lana Steiner', handle: '@lana', avatarTone: 'bg-avatar-3' },
  { id: 'demi', name: 'Demi Wilkinson', handle: '@demi', avatarTone: 'bg-avatar-5' },
  { id: 'candice', name: 'Candice Wu', handle: '@candice', avatarTone: 'bg-avatar-8' },
  { id: 'natali', name: 'Natali Craig', handle: '@natali', avatarTone: 'bg-avatar-2' },
  { id: 'drew', name: 'Drew Cano', handle: '@drew', avatarTone: 'bg-avatar-7' },
];

function initials(name: string): string {
  const parts = name.split(' ');
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
}

// ────────────────────────────────────────────────────────────────────────────
// Leading decorators

function StatusDot() {
  return (
    <span className="block size-2 shrink-0 rounded-full bg-[var(--online)]" />
  );
}

function PersonAvatar({ tone, name }: { tone: string; name: string }) {
  return (
    <Avatar size="sm" className="size-5">
      <AvatarFallback
        className={`${tone} text-[10px] font-semibold text-avatar-foreground`}
      >
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}

function CmdKHint() {
  return (
    <Kbd className="bg-muted px-1.5 py-0 text-[11px] font-medium tracking-tight">
      ⌘K
    </Kbd>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Hooks

function useTeamOptions(): MultiSelectOption[] {
  const t = useTranslations('select-demo.teams');
  return React.useMemo(
    () =>
      TEAM_KEYS.map((key) => ({
        value: key,
        label: t(`options.${key}`),
        meta: t('usersFmt', { count: TEAM_USER_COUNTS[key] }),
        searchValue: t(`options.${key}`),
      })),
    [t]
  );
}

function buildPersonOption(
  person: Person,
  leading: React.ReactNode | null,
): SingleOption {
  return {
    value: person.id,
    label: person.name,
    meta: person.handle,
    leading: leading ?? undefined,
    searchValue: `${person.name} ${person.handle}`,
  };
}

function usePersonOptions(
  leadingMode: 'none' | 'icon' | 'avatar' | 'dot',
): SingleOption[] {
  return React.useMemo(
    () =>
      PEOPLE.map((person) => {
        let leading: React.ReactNode | null = null;
        if (leadingMode === 'icon') leading = <UserIcon className="size-4" />;
        else if (leadingMode === 'avatar')
          leading = <PersonAvatar tone={person.avatarTone} name={person.name} />;
        else if (leadingMode === 'dot') leading = <StatusDot />;
        return buildPersonOption(person, leading);
      }),
    [leadingMode],
  );
}

function useTagOptions(): TagSearchOption[] {
  return React.useMemo(
    () =>
      PEOPLE.map((person) => ({
        ...buildPersonOption(
          person,
          <PersonAvatar tone={person.avatarTone} name={person.name} />,
        ),
        chipLabel: person.name.split(' ')[0],
        chipLeading: <PersonAvatar tone={person.avatarTone} name={person.name} />,
      })),
    [],
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Layout helpers

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-1.5"
    >
      {eyebrow && (
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-brand">
          {eyebrow}
        </span>
      )}
      <h2 className="text-xl font-semibold text-foreground md:text-2xl">
        {title}
      </h2>
      {description && (
        <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
          {description}
        </p>
      )}
    </motion.header>
  );
}

function StateLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
      {children}
    </p>
  );
}

function ColumnHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b border-border pb-2 text-xs font-semibold text-foreground">
      {children}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// MultiSelect showcase

function MultiSelectShowcase() {
  const t = useTranslations('select-demo');
  const tTeams = useTranslations('select-demo.teams');
  const tStates = useTranslations('select-demo.showcase.states');
  const options = useTeamOptions();

  const formatSummary = React.useCallback(
    (selected: MultiSelectOption[]) => {
      const totalUsers = selected.reduce(
        (sum, o) => sum + (TEAM_USER_COUNTS[o.value as TeamKey] ?? 0),
        0,
      );
      return {
        primary: tTeams('selectedFmt', { count: selected.length }),
        meta: tTeams('usersFmt', { count: totalUsers }),
      };
    },
    [tTeams],
  );

  const labels = {
    searchPlaceholder: tTeams('searchPlaceholder'),
    resetLabel: tTeams('resetLabel'),
    selectAllLabel: tTeams('selectAllLabel'),
    emptyTitle: tTeams('emptyTitle'),
    emptyDescription: tTeams('emptyDescription'),
    clearSearchLabel: tTeams('clearSearchLabel'),
  };

  const partial = ['design', 'product'];

  const common = {
    label: tTeams('label'),
    required: true,
    helpTooltip: t('helpTooltip'),
    hint: t('hint'),
    placeholder: tTeams('placeholder'),
    options,
    formatSummary,
    labels,
  };

  type Row = {
    label: string;
    value: string[];
    forceFocus?: boolean;
    previewOpen?: boolean;
    previewEmptySearch?: boolean;
    disabled?: boolean;
  };

  const rows: Row[] = [
    { label: tStates('filledOpen'), value: partial, forceFocus: true, previewOpen: true },
    { label: tStates('default'), value: partial },
    { label: tStates('emptySearch'), value: partial, forceFocus: true, previewOpen: true, previewEmptySearch: true },
    { label: tStates('placeholder'), value: [] },
    { label: tStates('focused'), value: [], forceFocus: true },
    { label: tStates('placeholderDisabled'), value: [], disabled: true },
  ];

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-7 md:grid-cols-2 lg:grid-cols-3">
      {rows.map((row, i) => (
        <div key={i} className="flex flex-col">
          <StateLabel>{row.label}</StateLabel>
          <MultiSelect
            {...common}
            value={row.value}
            onChange={() => {}}
            forceFocus={row.forceFocus}
            previewOpen={row.previewOpen}
            previewEmptySearch={row.previewEmptySearch}
            disabled={row.disabled}
          />
        </div>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Single-select / TagSearch showcase

type VariantKey = 'plain' | 'icon' | 'avatar' | 'dot' | 'search' | 'tags';
type StateKey =
  | 'placeholder'
  | 'placeholderDisabled'
  | 'placeholderFocused'
  | 'filled'
  | 'filledFocused'
  | 'filledOpen';

const SINGLE_VARIANTS: VariantKey[] = [
  'plain',
  'icon',
  'avatar',
  'dot',
  'search',
  'tags',
];

const STATE_ORDER: StateKey[] = [
  'placeholder',
  'placeholderDisabled',
  'placeholderFocused',
  'filled',
  'filledFocused',
  'filledOpen',
];

function SingleCell({
  variant,
  state,
  label,
  placeholder,
  searchPlaceholder,
  hint,
  helpTooltip,
  required,
  plainOptions,
  iconOptions,
  avatarOptions,
  dotOptions,
  tagOptions,
}: {
  variant: VariantKey;
  state: StateKey;
  label: React.ReactNode;
  placeholder: string;
  searchPlaceholder: string;
  hint: React.ReactNode;
  helpTooltip: React.ReactNode;
  required: boolean;
  plainOptions: SingleOption[];
  iconOptions: SingleOption[];
  avatarOptions: SingleOption[];
  dotOptions: SingleOption[];
  tagOptions: TagSearchOption[];
}) {
  const disabled = state === 'placeholderDisabled';
  const forceFocus =
    state === 'placeholderFocused' ||
    state === 'filledFocused' ||
    state === 'filledOpen';
  const previewOpen = state === 'filledOpen';
  const isFilled = state.startsWith('filled');

  const triggerLabel =
    variant === 'search' || variant === 'tags' ? 'Search' : label;
  const triggerPlaceholder =
    variant === 'search' || variant === 'tags' ? searchPlaceholder : placeholder;

  const common = {
    label: triggerLabel,
    placeholder: triggerPlaceholder,
    hint,
    helpTooltip,
    required,
    disabled,
    forceFocus,
    previewOpen,
  };

  if (variant === 'tags') {
    const tagValue = isFilled ? ['olivia', 'phoenix'] : [];
    return (
      <TagSearch
        {...common}
        options={tagOptions}
        value={tagValue}
        onChange={() => {}}
        endAdornment={<CmdKHint />}
      />
    );
  }

  if (variant === 'search') {
    return (
      <SingleSelectV2
        {...common}
        options={plainOptions}
        value={isFilled ? 'olivia' : null}
        onChange={() => {}}
        triggerLeading={<SearchIcon className="size-4" />}
        endAdornment={<CmdKHint />}
        hideChevron
      />
    );
  }

  const optionsByVariant: Record<
    Exclude<VariantKey, 'tags' | 'search'>,
    SingleOption[]
  > = {
    plain: plainOptions,
    icon: iconOptions,
    avatar: avatarOptions,
    dot: dotOptions,
  };

  const triggerLeading =
    variant === 'icon' ? (
      <UserIcon className="size-4" />
    ) : variant === 'avatar' ? (
      <UserIcon className="size-4" />
    ) : variant === 'dot' ? (
      <StatusDot />
    ) : undefined;

  return (
    <SingleSelectV2
      {...common}
      options={optionsByVariant[variant]}
      value={isFilled ? 'olivia' : null}
      onChange={() => {}}
      triggerLeading={triggerLeading}
      mirrorOptionLeading={variant === 'avatar' || variant === 'dot'}
    />
  );
}

function SingleSelectShowcase() {
  const t = useTranslations('select-demo');
  const tMember = useTranslations('select-demo.teamMember');
  const tStates = useTranslations('select-demo.showcase.states');
  const tVariants = useTranslations('select-demo.showcase.variants');

  const plainOptions = usePersonOptions('none');
  const iconOptions = usePersonOptions('icon');
  const avatarOptions = usePersonOptions('avatar');
  const dotOptions = usePersonOptions('dot');
  const tagOptions = useTagOptions();

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[1180px] grid-cols-6 gap-x-5 gap-y-7">
        {SINGLE_VARIANTS.map((variant) => (
          <ColumnHeader key={variant}>{tVariants(variant)}</ColumnHeader>
        ))}
        {STATE_ORDER.flatMap((state) =>
          SINGLE_VARIANTS.map((variant) => (
            <div key={`${variant}-${state}`} className="flex flex-col">
              <StateLabel>{tStates(state)}</StateLabel>
              <SingleCell
                variant={variant}
                state={state}
                label={tMember('label')}
                placeholder={tMember('placeholder')}
                searchPlaceholder={tMember('searchPlaceholder')}
                hint={t('hint')}
                helpTooltip={t('helpTooltip')}
                required
                plainOptions={plainOptions}
                iconOptions={iconOptions}
                avatarOptions={avatarOptions}
                dotOptions={dotOptions}
                tagOptions={tagOptions}
              />
            </div>
          )),
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Interactive playground

function InteractivePlayground() {
  const t = useTranslations('select-demo');
  const tTeams = useTranslations('select-demo.teams');
  const tMember = useTranslations('select-demo.teamMember');
  const teamOptions = useTeamOptions();
  const personOptions = usePersonOptions('avatar');
  const tagOptions = useTagOptions();

  const [teams, setTeams] = React.useState<string[]>(['design', 'product']);
  const [member, setMember] = React.useState<string | null>('olivia');
  const [tags, setTags] = React.useState<string[]>(['olivia', 'phoenix']);

  const formatSummary = (selected: MultiSelectOption[]) => {
    const totalUsers = selected.reduce(
      (sum, o) => sum + (TEAM_USER_COUNTS[o.value as TeamKey] ?? 0),
      0,
    );
    return {
      primary: tTeams('selectedFmt', { count: selected.length }),
      meta: tTeams('usersFmt', { count: totalUsers }),
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.45 }}
      className="grid grid-cols-1 gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm md:grid-cols-2 md:p-6 lg:grid-cols-3"
    >
      <MultiSelect
        label={tTeams('label')}
        required
        helpTooltip={t('helpTooltip')}
        hint={t('hint')}
        options={teamOptions}
        value={teams}
        onChange={setTeams}
        placeholder={tTeams('placeholder')}
        formatSummary={formatSummary}
        labels={{
          searchPlaceholder: tTeams('searchPlaceholder'),
          resetLabel: tTeams('resetLabel'),
          selectAllLabel: tTeams('selectAllLabel'),
          emptyTitle: tTeams('emptyTitle'),
          emptyDescription: tTeams('emptyDescription'),
          clearSearchLabel: tTeams('clearSearchLabel'),
        }}
      />
      <SingleSelectV2
        label={tMember('label')}
        required
        helpTooltip={t('helpTooltip')}
        hint={t('hint')}
        options={personOptions}
        value={member}
        onChange={setMember}
        placeholder={tMember('placeholder')}
        triggerLeading={<UserIcon className="size-4" />}
        mirrorOptionLeading
      />
      <TagSearch
        label={tMember('searchLabel')}
        required
        helpTooltip={t('helpTooltip')}
        hint={t('hint')}
        options={tagOptions}
        value={tags}
        onChange={setTags}
        placeholder={tMember('searchPlaceholder')}
        endAdornment={<CmdKHint />}
      />
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────────────────

export function SelectDemoView() {
  const t = useTranslations('select-demo');
  const tShowcase = useTranslations('select-demo.showcase');

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-8 md:px-6 md:py-12 lg:px-8 lg:py-16">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="flex flex-col gap-3"
      >
        <span className="w-fit rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium uppercase tracking-[0.12em] text-brand">
          Select · v2
        </span>
        <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
          {t('title')}
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
          {t('description')}
        </p>
      </motion.header>

      <section className="flex flex-col gap-4">
        <SectionHeader
          eyebrow="Live"
          title={t('interactive.title')}
          description={t('interactive.description')}
        />
        <InteractivePlayground />
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeader
          eyebrow="Showcase"
          title={tShowcase('multiSelectTitle')}
          description={tShowcase('description')}
        />
        <MultiSelectShowcase />
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeader
          eyebrow="Showcase"
          title={tShowcase('singleSelectTitle')}
        />
        <SingleSelectShowcase />
      </section>
    </main>
  );
}
