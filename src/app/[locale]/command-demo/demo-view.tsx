'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import {
  ArrowLeftIcon,
  BadgeCheckIcon,
  CornerDownLeftIcon,
  FilePlusIcon,
  FileTextIcon,
  FolderIcon,
  GlobeIcon,
  HelpCircleIcon,
  KeyboardIcon,
  LayersIcon,
  LifeBuoyIcon,
  LinkIcon,
  PlusIcon,
  SettingsIcon,
  Share2Icon,
  UserIcon,
  UserPlusIcon,
  UsersIcon,
} from 'lucide-react';

import { AppSubHeader } from '@/widgets/app-header';

import { Link } from '@/shared/config/i18n/navigation';
import { cn } from '@/shared/lib/utils';
import { useCommandMenu } from '@/shared/hooks/use-command-menu';
import { Avatar, AvatarFallback, avatarHaloClasses } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import {
  CommandMenu,
  CommandMenuEmpty,
  CommandMenuFooter,
  CommandMenuGroup,
  CommandMenuHint,
  CommandMenuInput,
  CommandMenuItem,
  CommandMenuList,
  CommandMenuOrbit,
  CommandMenuPaneDetail,
  CommandMenuPanes,
  CommandMenuSeparator,
  CommandMenuShortcut,
  CommandSearchTrigger,
} from '@/shared/ui/command-menu';
import { Placeholder } from '@/shared/ui/placeholder';
import { Switch } from '@/shared/ui/switch';
import { ThemeToggle } from '@/shared/ui/theme-toggle';

// ────────────────────────────────────────────────────────────────────────────
// Sample data — proper-noun entities (names, handles, brands, domains) are
// identifiers, kept as constants; all descriptive copy goes through next-intl.

type Person = { id: string; name: string; handle: string; tone: string };

const PEOPLE: Person[] = [
  { id: 'phoenix', name: 'Phoenix Baker', handle: '@phoenix', tone: 'bg-avatar-1' },
  { id: 'olivia', name: 'Olivia Rhye', handle: '@olivia', tone: 'bg-avatar-6' },
  { id: 'lana', name: 'Lana Steiner', handle: '@lana', tone: 'bg-avatar-3' },
  { id: 'demi', name: 'Demi Wilkinson', handle: '@demi', tone: 'bg-avatar-5' },
  { id: 'candice', name: 'Candice Wu', handle: '@candice', tone: 'bg-avatar-8' },
  { id: 'natali', name: 'Natali Craig', handle: '@natali', tone: 'bg-avatar-2' },
  { id: 'drew', name: 'Drew Cano', handle: '@drew', tone: 'bg-avatar-7' },
  { id: 'sienna', name: 'Sienna Hewitt', handle: '@sienna', tone: 'bg-avatar-4' },
];

type Integration = {
  id: string;
  name: string;
  domain: string;
  tone: string;
  descKey: string;
};

const INTEGRATIONS: Integration[] = [
  { id: 'github', name: 'GitHub', domain: 'github.com', tone: 'bg-avatar-1', descKey: 'github' },
  { id: 'linear', name: 'Linear', domain: 'linear.app', tone: 'bg-brand', descKey: 'linear' },
  { id: 'figma', name: 'Figma', domain: 'figma.com', tone: 'bg-avatar-5', descKey: 'figma' },
  { id: 'notion', name: 'Notion', domain: 'notion.so', tone: 'bg-avatar-3', descKey: 'notion' },
  { id: 'slack', name: 'Slack', domain: 'slack.com', tone: 'bg-avatar-8', descKey: 'slack' },
  { id: 'dropbox', name: 'Dropbox', domain: 'dropbox.com', tone: 'bg-avatar-6', descKey: 'dropbox' },
];

type Course = { id: string; title: string; author: string; hours: number };

const COURSES: Course[] = [
  { id: 'react', title: 'React с нуля до продакшена', author: 'Олег Кузнецов', hours: 18 },
  { id: 'python-data', title: 'Python для анализа данных', author: 'Мария Лебедева', hours: 24 },
  { id: 'ux-ui', title: 'UX/UI-дизайн: основы интерфейсов', author: 'Анна Соколова', hours: 12 },
  { id: 'sql-db', title: 'SQL и базы данных с нуля', author: 'Игорь Петров', hours: 9 },
  { id: 'ml-intro', title: 'Введение в машинное обучение', author: 'Дмитрий Орлов', hours: 30 },
  { id: 'marketing', title: 'Цифровой маркетинг для старта', author: 'Елена Васильева', hours: 14 },
];

// ────────────────────────────────────────────────────────────────────────────
// Small presentational helpers

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
}

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const avatarSizeClass: Record<AvatarSize, string> = {
  xs: 'size-6 text-[10px]',
  sm: 'size-7 text-[11px]',
  md: 'size-9 text-xs',
  lg: 'size-12 text-sm',
  xl: 'size-16 text-lg',
};

function PersonAvatar({
  name,
  tone,
  size = 'md',
  className,
}: {
  name: string;
  tone: string;
  size?: AvatarSize;
  className?: string;
}) {
  return (
    <Avatar className={cn(avatarSizeClass[size], className)}>
      <AvatarFallback className={cn(tone, 'font-semibold text-avatar-foreground')}>
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}

function LogoTile({
  name,
  tone,
  size = 'md',
}: {
  name: string;
  tone: string;
  size?: 'md' | 'lg';
}) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-lg font-semibold text-avatar-foreground',
        tone,
        size === 'lg' ? 'size-14 rounded-xl text-xl' : 'size-9 text-sm',
      )}
    >
      {name[0]}
    </span>
  );
}

/** Mini product cover — the same soft-accent placeholder used on product cards. */
function CourseCover({ seed }: { seed: string }) {
  return (
    <span className="relative block size-11 shrink-0 overflow-hidden rounded-md ring-1 ring-foreground/10">
      <Placeholder variant="soft" seed={seed} />
    </span>
  );
}

/** "Курс" type pill — mirrors the violet course pill from `ProductShowcaseCard`. */
function CourseTypePill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-6 items-center rounded-full bg-violet-200 px-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-violet-950">
      {children}
    </span>
  );
}

function SocialButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&_svg]:size-4"
    >
      {children}
    </button>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Demo card + opener

function DemoCard({
  title,
  description,
  className,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.4 }}
      className={cn(
        'flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6',
        className,
      )}
    >
      <header className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </header>
      {children}
    </motion.section>
  );
}

/** A card whose body is a `CommandSearchTrigger` that opens the given palette. */
function PaletteCard({
  title,
  description,
  render,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  render: (ctx: { open: boolean; setOpen: (open: boolean) => void }) => React.ReactNode;
}) {
  const t = useTranslations('command-demo');
  const [open, setOpen] = React.useState(false);
  return (
    <DemoCard title={title} description={description}>
      <CommandSearchTrigger
        placeholder={t('open')}
        shortcut={null}
        className="w-full md:w-full lg:w-full"
        onClick={() => setOpen(true)}
      />
      {render({ open, setOpen })}
    </DemoCard>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Palette 1 — Commands (icon + title + trailing shortcut)

function CommandsPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations('command-demo');
  const close = () => onOpenChange(false);

  return (
    <CommandMenu open={open} onOpenChange={onOpenChange} size="lg" title={t('open')}>
      <CommandMenuInput placeholder={t('placeholders.search')} />
      <CommandMenuList>
        <CommandMenuEmpty title={t('empty.nothing')} />
        <CommandMenuGroup heading={t('groups.recent')}>
          <CommandMenuItem
            value="marketing site redesign редизайн маркетинг"
            leading={<FolderIcon />}
            onSelect={close}
          >
            {t('commands.marketing')}
          </CommandMenuItem>
          <CommandMenuItem
            value="new document новый документ"
            leading={<FilePlusIcon />}
            trailing={<CommandMenuShortcut keys={['⌘N']} />}
            onSelect={close}
          >
            {t('commands.newDocument')}
          </CommandMenuItem>
          <CommandMenuItem
            value="invite colleagues пригласить коллег"
            leading={<UserPlusIcon />}
            trailing={<CommandMenuShortcut keys={['⌘I']} />}
            onSelect={close}
          >
            {t('commands.invite')}
          </CommandMenuItem>
        </CommandMenuGroup>

        <CommandMenuSeparator />

        <CommandMenuGroup heading={t('groups.navigation')}>
          <CommandMenuItem
            value="my profile мой профиль"
            leading={<UserIcon />}
            trailing={<CommandMenuShortcut keys={['⌘K', 'P']} sequence />}
            onSelect={close}
          >
            {t('commands.myProfile')}
          </CommandMenuItem>
          <CommandMenuItem
            value="team profile профиль команды"
            leading={<UsersIcon />}
            trailing={<CommandMenuShortcut keys={['⌘K', 'T']} sequence />}
            onSelect={close}
          >
            {t('commands.teamProfile')}
          </CommandMenuItem>
          <CommandMenuItem
            value="create new project создать проект"
            leading={<FilePlusIcon />}
            trailing={<CommandMenuShortcut keys={['⌘N']} />}
            onSelect={close}
          >
            {t('commands.newProject')}
          </CommandMenuItem>
          <CommandMenuItem
            value="support поддержка"
            leading={<LifeBuoyIcon />}
            trailing={<CommandMenuShortcut keys={['⌘H']} />}
            onSelect={close}
          >
            {t('commands.support')}
          </CommandMenuItem>
          <CommandMenuItem
            value="changelog что нового"
            leading={<LayersIcon />}
            trailing={<CommandMenuShortcut keys={['⌘C']} />}
            onSelect={close}
          >
            {t('commands.changelog')}
          </CommandMenuItem>
          <CommandMenuItem
            value="keyboard shortcuts горячие клавиши"
            leading={<KeyboardIcon />}
            trailing={<CommandMenuShortcut keys={['⌘?']} />}
            onSelect={close}
          >
            {t('commands.shortcuts')}
          </CommandMenuItem>
        </CommandMenuGroup>
      </CommandMenuList>
    </CommandMenu>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Palette 2 — Commands rich (title + description + trailing shortcut)

function CommandsRichPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations('command-demo');
  const close = () => onOpenChange(false);

  return (
    <CommandMenu open={open} onOpenChange={onOpenChange} size="lg" title={t('open')}>
      <CommandMenuInput placeholder={t('placeholders.search')} />
      <CommandMenuList>
        <CommandMenuEmpty title={t('empty.nothing')} />
        <CommandMenuGroup heading={t('groups.recent')}>
          <CommandMenuItem
            value="marketing site redesign редизайн"
            leading={<FolderIcon />}
            description={t('commands.marketingDesc')}
            onSelect={close}
          >
            {t('commands.marketing')}
          </CommandMenuItem>
          <CommandMenuItem
            value="new document документ"
            leading={<FilePlusIcon />}
            description={t('commands.newDocumentDesc')}
            trailing={<CommandMenuShortcut keys={['⌘N']} />}
            onSelect={close}
          >
            {t('commands.newDocument')}
          </CommandMenuItem>
          <CommandMenuItem
            value="invite colleagues пригласить"
            leading={<UserPlusIcon />}
            description={t('commands.inviteDesc')}
            trailing={<CommandMenuShortcut keys={['⌘I']} />}
            onSelect={close}
          >
            {t('commands.invite')}
          </CommandMenuItem>
        </CommandMenuGroup>

        <CommandMenuSeparator />

        <CommandMenuGroup heading={t('groups.navigation')}>
          <CommandMenuItem
            value="my profile профиль"
            leading={<UserIcon />}
            description={t('commands.myProfileDesc')}
            trailing={<CommandMenuShortcut keys={['⌘K', 'P']} sequence />}
            onSelect={close}
          >
            {t('commands.myProfile')}
          </CommandMenuItem>
          <CommandMenuItem
            value="team profile команда"
            leading={<UsersIcon />}
            description={t('commands.teamProfileDesc')}
            trailing={<CommandMenuShortcut keys={['⌘K', 'T']} sequence />}
            onSelect={close}
          >
            {t('commands.teamProfile')}
          </CommandMenuItem>
          <CommandMenuItem
            value="create new project проект"
            leading={<FilePlusIcon />}
            description={t('commands.newProjectDesc')}
            trailing={<CommandMenuShortcut keys={['⌘N']} />}
            onSelect={close}
          >
            {t('commands.newProject')}
          </CommandMenuItem>
          <CommandMenuItem
            value="support поддержка"
            leading={<LifeBuoyIcon />}
            onSelect={close}
          >
            {t('commands.support')}
          </CommandMenuItem>
        </CommandMenuGroup>
      </CommandMenuList>
    </CommandMenu>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// People list rows (reused by grouped / compact)

function PeopleItems({
  people,
  stacked,
  onSelect,
}: {
  people: Person[];
  stacked: boolean;
  onSelect: () => void;
}) {
  return (
    <>
      {people.map((person) => (
        <CommandMenuItem
          key={person.id}
          value={`${person.name} ${person.handle}`}
          className={stacked ? undefined : 'py-2'}
          leading={
            <PersonAvatar
              name={person.name}
              tone={person.tone}
              size={stacked ? 'md' : 'sm'}
            />
          }
          description={stacked ? person.handle : undefined}
          onSelect={onSelect}
        >
          {stacked ? (
            person.name
          ) : (
            <span className="flex items-baseline gap-2">
              {person.name}
              <span className="font-normal text-muted-foreground">
                {person.handle}
              </span>
            </span>
          )}
        </CommandMenuItem>
      ))}
    </>
  );
}

function NavFooter() {
  const t = useTranslations('command-demo');
  return (
    <CommandMenuFooter action={<SettingsIcon className="size-4" aria-hidden />}>
      <CommandMenuHint keys={['↑', '↓']} label={t('footer.navigate')} />
      <CommandMenuHint
        keys={[<CornerDownLeftIcon key="enter" />]}
        label={t('footer.select')}
      />
      <CommandMenuHint keys={['esc']} label={t('footer.close')} />
      <CommandMenuHint keys={['←']} label={t('footer.parent')} />
    </CommandMenuFooter>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Palette 3 — People grouped (two-line rows + footer)

function PeopleGroupedPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations('command-demo');
  const close = () => onOpenChange(false);

  return (
    <CommandMenu open={open} onOpenChange={onOpenChange} size="lg" title={t('open')}>
      <CommandMenuInput placeholder={t('placeholders.people')} />
      <CommandMenuList>
        <CommandMenuEmpty title={t('empty.nothing')} />
        <CommandMenuGroup heading={t('groups.recent')}>
          <PeopleItems people={PEOPLE.slice(0, 2)} stacked onSelect={close} />
        </CommandMenuGroup>
        <CommandMenuSeparator />
        <CommandMenuGroup heading={t('groups.recent')}>
          <PeopleItems people={PEOPLE} stacked onSelect={close} />
        </CommandMenuGroup>
      </CommandMenuList>
      <NavFooter />
    </CommandMenu>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Palette 4 — People compact (single-line rows + footer)

function PeopleCompactPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations('command-demo');
  const close = () => onOpenChange(false);

  return (
    <CommandMenu open={open} onOpenChange={onOpenChange} size="lg" title={t('open')}>
      <CommandMenuInput placeholder={t('placeholders.people')} />
      <CommandMenuList>
        <CommandMenuEmpty title={t('empty.nothing')} />
        <CommandMenuGroup heading={t('groups.recent')}>
          <PeopleItems people={PEOPLE.slice(0, 2)} stacked={false} onSelect={close} />
        </CommandMenuGroup>
        <CommandMenuSeparator />
        <CommandMenuGroup heading={t('groups.recent')}>
          <PeopleItems people={PEOPLE} stacked={false} onSelect={close} />
        </CommandMenuGroup>
      </CommandMenuList>
      <NavFooter />
    </CommandMenu>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Palette 5 — Integrations (two-pane master/detail)

function IntegrationsPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations('command-demo');
  const [value, setValue] = React.useState('linear');
  const [enabled, setEnabled] = React.useState(true);
  const selected =
    INTEGRATIONS.find((item) => item.id === value) ?? INTEGRATIONS[0];

  return (
    <CommandMenu
      open={open}
      onOpenChange={onOpenChange}
      size="xl"
      value={value}
      onValueChange={setValue}
      title={t('placeholders.integrations')}
    >
      <CommandMenuInput
        placeholder={t('placeholders.integrations')}
        hint={<HelpCircleIcon className="size-5 text-muted-foreground" />}
      />
      <CommandMenuPanes>
        <CommandMenuList className="max-h-none w-full flex-none sm:w-[44%]">
          <CommandMenuGroup heading={t('groups.recent')}>
            {INTEGRATIONS.map((item) => (
              <CommandMenuItem
                key={item.id}
                value={item.id}
                keywords={[item.name, item.domain]}
                leading={<LogoTile name={item.name} tone={item.tone} />}
                description={item.domain}
                onSelect={() => setValue(item.id)}
              >
                {item.name}
              </CommandMenuItem>
            ))}
          </CommandMenuGroup>
        </CommandMenuList>
        <CommandMenuPaneDetail>
          <div className="flex items-start justify-between">
            <LogoTile name={selected.name} tone={selected.tone} size="lg" />
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
          <h4 className="mt-4 text-lg font-semibold text-foreground">
            {selected.name}
          </h4>
          <p className="mt-1 text-sm text-muted-foreground">
            {t(`integrations.desc.${selected.descKey}`)}
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <Button size="lg" className="w-full">
              {t('integrations.viewIntegration')}
            </Button>
            <Button variant="outline" size="lg" className="w-full">
              {t('integrations.learnMore')}
            </Button>
          </div>
        </CommandMenuPaneDetail>
      </CommandMenuPanes>
    </CommandMenu>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Palette 6 — Profile (two-pane master/detail)

function ProfilePalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations('command-demo');
  const [value, setValue] = React.useState('olivia');
  const selected = PEOPLE.find((person) => person.id === value) ?? PEOPLE[0];

  return (
    <CommandMenu
      open={open}
      onOpenChange={onOpenChange}
      size="xl"
      value={value}
      onValueChange={setValue}
      title={t('placeholders.people')}
    >
      <CommandMenuInput placeholder={t('placeholders.people')} />
      <CommandMenuPanes>
        <CommandMenuList className="max-h-none w-full flex-none sm:w-[44%]">
          <CommandMenuGroup heading={t('groups.recent')}>
            {PEOPLE.slice(0, 7).map((person) => (
              <CommandMenuItem
                key={person.id}
                value={person.id}
                keywords={[person.name, person.handle]}
                leading={
                  <PersonAvatar name={person.name} tone={person.tone} size="sm" />
                }
                onSelect={() => setValue(person.id)}
              >
                <span className="flex items-baseline gap-2">
                  {person.name}
                  <span className="font-normal text-muted-foreground">
                    {person.handle}
                  </span>
                </span>
              </CommandMenuItem>
            ))}
          </CommandMenuGroup>
        </CommandMenuList>
        <CommandMenuPaneDetail className="p-0">
          <div className="h-24 w-full bg-gradient-to-r from-brand/40 via-brand/15 to-avatar-6/40" />
          <div className="flex flex-col items-center px-5 pb-5 text-center">
            <PersonAvatar
              name={selected.name}
              tone={selected.tone}
              size="xl"
              className="-mt-8 ring-4 ring-popover"
            />
            <div className="mt-3 flex items-center gap-1.5">
              <span className="text-base font-semibold text-foreground">
                {selected.name}
              </span>
              <BadgeCheckIcon className="size-4 text-brand" />
            </div>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              {t('profile.bio')}
            </p>
            <div className="mt-4 flex items-center gap-2.5">
              <SocialButton>
                <GlobeIcon />
              </SocialButton>
              <SocialButton>
                <Share2Icon />
              </SocialButton>
              <SocialButton>
                <LinkIcon />
              </SocialButton>
            </div>
            <div className="mt-5 flex w-full items-center gap-2">
              <Button variant="outline" size="lg" className="flex-1">
                {t('profile.viewPortfolio')}
              </Button>
              <Button size="lg" className="flex-1">
                <PlusIcon />
                {t('profile.follow')}
              </Button>
            </div>
          </div>
        </CommandMenuPaneDetail>
      </CommandMenuPanes>
    </CommandMenu>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Palette 7 — Empty: no projects

function EmptyProjectsPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations('command-demo');
  const [query, setQuery] = React.useState('Landing page design');
  const close = () => onOpenChange(false);

  return (
    <CommandMenu open={open} onOpenChange={onOpenChange} size="lg" title={t('open')}>
      <CommandMenuInput
        value={query}
        onValueChange={setQuery}
        placeholder={t('placeholders.search')}
      />
      <CommandMenuList>
        <CommandMenuEmpty
          title={t('empty.projectsTitle')}
          description={t('empty.projectsDescription', { query })}
        >
          <Button variant="outline" size="lg" onClick={() => setQuery('')}>
            {t('empty.clear')}
          </Button>
          <Button size="lg" onClick={close}>
            <PlusIcon />
            {t('empty.newProject')}
          </Button>
        </CommandMenuEmpty>
        <CommandMenuGroup heading={t('groups.recent')}>
          <CommandMenuItem
            value="marketing site redesign"
            leading={<FolderIcon />}
            onSelect={close}
          >
            {t('commands.marketing')}
          </CommandMenuItem>
          <CommandMenuItem
            value="new document"
            leading={<FileTextIcon />}
            onSelect={close}
          >
            {t('commands.newDocument')}
          </CommandMenuItem>
        </CommandMenuGroup>
      </CommandMenuList>
    </CommandMenu>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Palette 8 — Empty: no users (orbit illustration)

function EmptyUsersPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations('command-demo');
  const [query, setQuery] = React.useState('Ava Green');
  const close = () => onOpenChange(false);

  return (
    <CommandMenu open={open} onOpenChange={onOpenChange} size="lg" title={t('open')}>
      <CommandMenuInput
        value={query}
        onValueChange={setQuery}
        placeholder={t('placeholders.people')}
      />
      <CommandMenuList>
        <CommandMenuEmpty
          illustration={
            <CommandMenuOrbit
              avatars={PEOPLE.map((person) => (
                <PersonAvatar
                  key={person.id}
                  name={person.name}
                  tone={person.tone}
                  size="md"
                  className={avatarHaloClasses}
                />
              ))}
            />
          }
          title={t('empty.usersTitle')}
          description={t('empty.usersDescription')}
        >
          <Button variant="outline" size="lg" onClick={() => setQuery('')}>
            {t('empty.clear')}
          </Button>
          <Button size="lg" onClick={close}>
            <PlusIcon />
            {t('empty.addUser')}
          </Button>
        </CommandMenuEmpty>
        <CommandMenuGroup heading={t('groups.recent')}>
          <PeopleItems people={PEOPLE.slice(0, 4)} stacked onSelect={close} />
        </CommandMenuGroup>
      </CommandMenuList>
    </CommandMenu>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Palette — Product search (styled in the product-card visual language)

function ProductsSearchPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations('command-demo');
  const [query, setQuery] = React.useState('');
  const close = () => onOpenChange(false);

  return (
    <CommandMenu
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={t('placeholders.products')}
    >
      <CommandMenuInput
        value={query}
        onValueChange={setQuery}
        placeholder={t('placeholders.products')}
      />
      <CommandMenuList>
        <CommandMenuEmpty
          title={t('products.emptyTitle')}
          description={
            query
              ? t('products.emptyDescription', { query })
              : t('empty.nothing')
          }
        >
          <Button variant="outline" size="lg" onClick={() => setQuery('')}>
            {t('empty.clear')}
          </Button>
          <Button size="lg" onClick={close}>
            <PlusIcon />
            {t('products.createCourse')}
          </Button>
        </CommandMenuEmpty>
        <CommandMenuGroup heading={t('products.group')}>
          {COURSES.map((course) => (
            <CommandMenuItem
              key={course.id}
              value={`${course.title} ${course.author}`}
              keywords={[course.author]}
              leading={<CourseCover seed={course.title} />}
              description={`${course.author} · ${t('products.durationHours', {
                count: course.hours,
              })}`}
              trailing={<CourseTypePill>{t('products.typeCourse')}</CourseTypePill>}
              onSelect={close}
            >
              {course.title}
            </CommandMenuItem>
          ))}
        </CommandMenuGroup>
      </CommandMenuList>
    </CommandMenu>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// AppSubHeader showcase — the search field lives on the tab row and opens the
// command palette on click or via ⌘K.

function SubHeaderShowcase() {
  const t = useTranslations('command-demo');
  const tS = useTranslations('command-demo.sections');
  const cmd = useCommandMenu();

  const tabs = [
    { key: 'overview', label: t('subheader.tabs.overview'), href: '/command-demo' },
    { key: 'notifications', label: t('subheader.tabs.notifications'), href: '/command-demo' },
    { key: 'analytics', label: t('subheader.tabs.analytics'), href: '/command-demo' },
    { key: 'saved', label: t('subheader.tabs.saved'), href: '/command-demo' },
    { key: 'scheduled', label: t('subheader.tabs.scheduled'), href: '/command-demo' },
    { key: 'users', label: t('subheader.tabs.users'), href: '/command-demo' },
  ];

  return (
    <DemoCard title={tS('subheader.title')} description={tS('subheader.description')}>
      <p className="text-sm text-muted-foreground">{t('subheader.hint')}</p>
      <div className="overflow-hidden rounded-xl border border-border bg-background">
        <AppSubHeader
          sectionKey="command-demo"
          ariaLabel={t('subheader.ariaLabel')}
          tabs={tabs}
          activeKey="overview"
          endSlot={
            <CommandSearchTrigger
              placeholder={t('subheader.searchPlaceholder')}
              onClick={cmd.openMenu}
            />
          }
          className="static top-auto z-auto border-b-0"
        />
      </div>
      <CommandsPalette open={cmd.open} onOpenChange={cmd.setOpen} />
    </DemoCard>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Page

export function CommandDemoView() {
  const t = useTranslations('command-demo');
  const tS = useTranslations('command-demo.sections');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex h-8 items-center gap-2 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeftIcon className="size-4" />
            {t('back')}
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-8 md:px-6 md:py-12 lg:px-8 lg:py-16">
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-3"
        >
          <span className="w-fit rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium uppercase tracking-[0.12em] text-brand">
            {t('badge')}
          </span>
          <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
            {t('title')}
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
            {t('description')}
          </p>
        </motion.header>

        <SubHeaderShowcase />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <PaletteCard
            title={tS('products.title')}
            description={tS('products.description')}
            render={({ open, setOpen }) => (
              <ProductsSearchPalette open={open} onOpenChange={setOpen} />
            )}
          />
          <PaletteCard
            title={tS('commands.title')}
            description={tS('commands.description')}
            render={({ open, setOpen }) => (
              <CommandsPalette open={open} onOpenChange={setOpen} />
            )}
          />
          <PaletteCard
            title={tS('commandsRich.title')}
            description={tS('commandsRich.description')}
            render={({ open, setOpen }) => (
              <CommandsRichPalette open={open} onOpenChange={setOpen} />
            )}
          />
          <PaletteCard
            title={tS('peopleGrouped.title')}
            description={tS('peopleGrouped.description')}
            render={({ open, setOpen }) => (
              <PeopleGroupedPalette open={open} onOpenChange={setOpen} />
            )}
          />
          <PaletteCard
            title={tS('peopleCompact.title')}
            description={tS('peopleCompact.description')}
            render={({ open, setOpen }) => (
              <PeopleCompactPalette open={open} onOpenChange={setOpen} />
            )}
          />
          <PaletteCard
            title={tS('integrations.title')}
            description={tS('integrations.description')}
            render={({ open, setOpen }) => (
              <IntegrationsPalette open={open} onOpenChange={setOpen} />
            )}
          />
          <PaletteCard
            title={tS('profile.title')}
            description={tS('profile.description')}
            render={({ open, setOpen }) => (
              <ProfilePalette open={open} onOpenChange={setOpen} />
            )}
          />
          <PaletteCard
            title={tS('emptyProjects.title')}
            description={tS('emptyProjects.description')}
            render={({ open, setOpen }) => (
              <EmptyProjectsPalette open={open} onOpenChange={setOpen} />
            )}
          />
          <PaletteCard
            title={tS('emptyUsers.title')}
            description={tS('emptyUsers.description')}
            render={({ open, setOpen }) => (
              <EmptyUsersPalette open={open} onOpenChange={setOpen} />
            )}
          />
        </div>
      </main>
    </div>
  );
}
