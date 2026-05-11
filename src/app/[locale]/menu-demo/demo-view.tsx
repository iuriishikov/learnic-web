'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BookmarkIcon,
  ChevronDownIcon,
  CodeIcon,
  CopyIcon,
  FileTextIcon,
  GitBranchIcon,
  HelpCircleIcon,
  KeyboardIcon,
  LinkIcon,
  LogOutIcon,
  MoonIcon,
  MoreVerticalIcon,
  PaintbrushIcon,
  PenIcon,
  PenLineIcon,
  PlusIcon,
  RefreshCwIcon,
  SaveIcon,
  ScissorsIcon,
  SettingsIcon,
  Share2Icon,
  ShieldIcon,
  SparklesIcon,
  StarIcon,
  TerminalIcon,
  Trash2Icon,
  UserIcon,
  WandIcon,
  ZapIcon,
} from 'lucide-react';

import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import {
  Menu,
  MenuContent,
  MenuFooter,
  MenuFooterButton,
  MenuGroup,
  MenuHeader,
  MenuItem,
  MenuCheckboxItem,
  MenuItems,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSearch,
  MenuSeparator,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuSwitchItem,
  MenuTrigger,
  MenuUserCard,
} from '@/shared/ui/menu';

// ────────────────────────────────────────────────────────────────────────────
// Helpers

type Person = {
  id: string;
  nameKey: string;
  emailKey: string;
  tone: string;
};

const PEOPLE: Person[] = [
  { id: 'olivia', nameKey: 'olivia.name', emailKey: 'olivia.email', tone: 'bg-avatar-6' },
  { id: 'sienna', nameKey: 'sienna.name', emailKey: 'sienna.email', tone: 'bg-avatar-4' },
  { id: 'phoenix', nameKey: 'phoenix.name', emailKey: 'phoenix.email', tone: 'bg-avatar-1' },
  { id: 'lana', nameKey: 'lana.name', emailKey: 'lana.email', tone: 'bg-avatar-3' },
  { id: 'demi', nameKey: 'demi.name', emailKey: 'demi.email', tone: 'bg-avatar-5' },
  { id: 'candice', nameKey: 'candice.name', emailKey: 'candice.email', tone: 'bg-avatar-8' },
  { id: 'natali', nameKey: 'natali.name', emailKey: 'natali.email', tone: 'bg-avatar-2' },
  { id: 'drew', nameKey: 'drew.name', emailKey: 'drew.email', tone: 'bg-avatar-7' },
];

function initials(name: string): string {
  const parts = name.split(' ');
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
}

function PersonAvatar({
  name,
  tone,
  size = 'sm',
  withDot,
}: {
  name: string;
  tone: string;
  size?: 'xs' | 'sm' | 'default' | 'lg';
  withDot?: boolean;
}) {
  const sizeClass =
    size === 'xs'
      ? 'size-5 text-[10px]'
      : size === 'sm'
        ? 'size-7 text-[11px]'
        : size === 'lg'
          ? 'size-10 text-sm'
          : 'size-8 text-xs';
  return (
    <span className="relative inline-flex shrink-0">
      <Avatar className={sizeClass}>
        <AvatarFallback
          className={`${tone} font-semibold text-avatar-foreground`}
        >
          {initials(name)}
        </AvatarFallback>
      </Avatar>
      {withDot && (
        <span className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full bg-[var(--online)] ring-2 ring-popover" />
      )}
    </span>
  );
}

function StatusDot() {
  return (
    <span className="block size-2 shrink-0 rounded-full bg-[var(--online)]" />
  );
}

function ChevronDown() {
  return <ChevronDownIcon className="size-4 text-muted-foreground" />;
}

// ────────────────────────────────────────────────────────────────────────────
// Demo wrapper card with header

function DemoCard({
  title,
  description,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6"
    >
      <header className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </header>
      <div className="flex flex-wrap items-start gap-6">{children}</div>
    </motion.section>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Triggers

function ActionButton({
  label,
  active,
}: {
  label?: React.ReactNode;
  active?: boolean;
}) {
  return (
    <MenuTrigger
      className={`group/menu-trigger inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-sm font-medium text-foreground outline-none transition-colors ${
        active
          ? 'border-brand ring-3 ring-brand/20'
          : 'border-input hover:bg-muted/50'
      } focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/20 data-popup-open:border-brand data-popup-open:ring-3 data-popup-open:ring-brand/20`}
    >
      {label ?? 'Actions'}
      <ChevronDown />
    </MenuTrigger>
  );
}

function KebabTrigger() {
  return (
    <MenuTrigger className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:border-brand focus-visible:bg-muted focus-visible:ring-3 focus-visible:ring-brand/20 data-popup-open:border-brand data-popup-open:bg-muted data-popup-open:text-foreground">
      <MoreVerticalIcon className="size-4" />
    </MenuTrigger>
  );
}

function AvatarTrigger({ name, tone }: { name: string; tone: string }) {
  return (
    <MenuTrigger className="inline-flex cursor-pointer rounded-full outline-none ring-offset-2 ring-offset-background transition focus-visible:ring-3 focus-visible:ring-brand/30 data-popup-open:ring-3 data-popup-open:ring-brand/30">
      <PersonAvatar name={name} tone={tone} size="default" withDot />
    </MenuTrigger>
  );
}

function UserPillTrigger({
  name,
  email,
  tone,
  withDot,
  showEmail,
}: {
  name: string;
  email?: string;
  tone: string;
  withDot?: boolean;
  showEmail?: boolean;
}) {
  return (
    <MenuTrigger className="group/menu-trigger inline-flex cursor-pointer items-center gap-2 rounded-lg border border-input bg-transparent px-2 py-1.5 text-left text-sm font-medium text-foreground outline-none transition-colors hover:bg-muted/40 focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/20 data-popup-open:border-brand data-popup-open:ring-3 data-popup-open:ring-brand/20">
      <PersonAvatar name={name} tone={tone} size="sm" withDot={withDot} />
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate">{name}</span>
        {showEmail && email && (
          <span className="truncate text-xs font-normal text-muted-foreground">
            {email}
          </span>
        )}
      </span>
      <ChevronDownIcon className="ml-1 size-3.5 text-muted-foreground" />
    </MenuTrigger>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Section: Simple actions

function ActionsSimpleDemo() {
  const t = useTranslations('menu-demo.items');
  return (
    <Menu>
      <KebabTrigger />
      <MenuContent size="md" align="end">
        <MenuGroup>
          <MenuItem leading={<ScissorsIcon />} shortcut="⌘X">
            {t('cut')}
          </MenuItem>
          <MenuItem leading={<CopyIcon />} shortcut="⌘C">
            {t('copy')}
          </MenuItem>
          <MenuItem leading={<ClipboardPaste />} shortcut="⌘V">
            {t('paste')}
          </MenuItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuGroup>
          <MenuItem leading={<PenIcon />}>{t('edit')}</MenuItem>
          <MenuItem leading={<CopyIcon />}>{t('duplicate')}</MenuItem>
          <MenuItem leading={<Trash2Icon />} variant="destructive">
            {t('delete')}
          </MenuItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuGroup>
          <MenuItem leading={<FileTextIcon />} hasSubmenuArrow>
            {t('viewDetails')}
          </MenuItem>
        </MenuGroup>
      </MenuContent>
    </Menu>
  );
}

// Tiny inline icon — lucide doesn't ship "ClipboardPaste" in every version
function ClipboardPaste(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Section: Actions rich (icons + checkboxes + status + submenu)

function ActionsRichDemo() {
  const t = useTranslations('menu-demo.items');
  const tUsers = useTranslations('menu-demo.users');
  const [showBookmarks, setShowBookmarks] = React.useState(true);
  const [showFullUrls, setShowFullUrls] = React.useState(false);

  return (
    <Menu>
      <KebabTrigger />
      <MenuContent size="md" align="end">
        <MenuGroup>
          <MenuItem leading={<ArrowLeftIcon />}>{t('back')}</MenuItem>
          <MenuItem leading={<ArrowRightIcon />}>{t('forward')}</MenuItem>
          <MenuItem leading={<RefreshCwIcon />} shortcut="⌘R">
            {t('reload')}
          </MenuItem>
          <MenuItem leading={<PenLineIcon />}>{t('editPage')}</MenuItem>
          <MenuItem leading={<StarIcon />}>{t('addToFavorites')}</MenuItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuGroup>
          <MenuCheckboxItem
            checked={showBookmarks}
            onCheckedChange={setShowBookmarks}
            indicator="leading-check"
          >
            {t('showBookmarks')}
          </MenuCheckboxItem>
          <MenuCheckboxItem
            checked={showFullUrls}
            onCheckedChange={setShowFullUrls}
            indicator="leading-check"
          >
            {t('showFullUrls')}
          </MenuCheckboxItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuGroup>
          <MenuItem leading={<StatusDot />}>{tUsers('olivia.name')}</MenuItem>
          <MenuItem leading={<span className="size-2" />}>
            {tUsers('sienna.name')}
          </MenuItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuGroup>
          <MenuSub>
            <MenuSubTrigger leading={<WandIcon />}>
              {t('moreTools')}
            </MenuSubTrigger>
            <MenuSubContent size="md">
              <MenuGroup>
                <MenuItem leading={<SaveIcon />} hasSubmenuArrow>
                  {t('saveAs')}
                </MenuItem>
                <MenuItem leading={<ScissorsIcon />} shortcut="⌘X">
                  {t('cut')}
                </MenuItem>
                <MenuItem leading={<CopyIcon />} shortcut="⌘C">
                  {t('copy')}
                </MenuItem>
                <MenuSeparator />
                <MenuSub>
                  <MenuSubTrigger leading={<TerminalIcon />}>
                    {t('developer')}
                  </MenuSubTrigger>
                  <MenuSubContent>
                    <MenuGroup>
                      <MenuItem leading={<CodeIcon />}>JavaScript</MenuItem>
                      <MenuItem leading={<CodeIcon />}>TypeScript</MenuItem>
                    </MenuGroup>
                  </MenuSubContent>
                </MenuSub>
              </MenuGroup>
            </MenuSubContent>
          </MenuSub>
        </MenuGroup>
      </MenuContent>
    </Menu>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Section: Account full menu

function AccountFullMenuDemo() {
  const t = useTranslations('menu-demo.items');
  const tUsers = useTranslations('menu-demo.users');
  const tLabels = useTranslations('menu-demo.labels');
  const tBadges = useTranslations('menu-demo.userBadges');
  const tFooter = useTranslations('menu-demo.footer');
  const [dark, setDark] = React.useState(false);
  const [account, setAccount] = React.useState('olivia');

  return (
    <Menu>
      <UserPillTrigger
        name={tUsers('olivia.name')}
        email={tUsers('olivia.email')}
        tone="bg-avatar-6"
        withDot
        showEmail
      />
      <MenuContent size="lg" align="start">
        <MenuHeader>
          <MenuUserCard
            avatar={
              <PersonAvatar
                name={tUsers('olivia.name')}
                tone="bg-avatar-6"
                size="default"
                withDot
              />
            }
            primary={tBadges('pro')}
            secondary={tUsers('olivia.email')}
          />
        </MenuHeader>
        <MenuSeparator />
        <MenuGroup>
          <MenuItem leading={<UserIcon />} shortcut="⌘K → P">
            {t('viewProfile')}
          </MenuItem>
          <MenuItem leading={<SettingsIcon />} shortcut="⌘S">
            {t('settings')}
          </MenuItem>
          <MenuSwitchItem
            leading={<MoonIcon />}
            checked={dark}
            onCheckedChange={setDark}
          >
            {t('darkMode')}
          </MenuSwitchItem>
          <MenuSub>
            <MenuSubTrigger leading={<HelpCircleIcon />}>
              {t('support')}
            </MenuSubTrigger>
            <MenuSubContent>
              <MenuGroup>
                <MenuItem leading={<FileTextIcon />}>
                  {t('documentation')}
                </MenuItem>
                <MenuItem leading={<HelpCircleIcon />}>
                  {t('contactSupport')}
                </MenuItem>
              </MenuGroup>
            </MenuSubContent>
          </MenuSub>
        </MenuGroup>
        <MenuSeparator />
        <MenuGroup>
          <MenuLabel>{tLabels('switchAccount')}</MenuLabel>
          <MenuRadioGroup value={account} onValueChange={setAccount}>
            <MenuRadioItem
              value="olivia"
              leading={
                <PersonAvatar
                  name={tUsers('olivia.name')}
                  tone="bg-avatar-6"
                  size="xs"
                />
              }
            >
              {tUsers('olivia.name')}
            </MenuRadioItem>
            <MenuRadioItem
              value="sienna"
              leading={
                <PersonAvatar
                  name={tUsers('sienna.name')}
                  tone="bg-avatar-4"
                  size="xs"
                />
              }
            >
              {tUsers('sienna.name')}
            </MenuRadioItem>
          </MenuRadioGroup>
          <MenuItem leading={<PlusIcon />}>{t('addAccount')}</MenuItem>
        </MenuGroup>
        <MenuFooterButton leading={<LogOutIcon />} hasSubmenuArrow>
          {t('signOut')}
        </MenuFooterButton>
        <MenuFooter>
          <span>{tFooter('brand')}</span>
          <span>{tFooter('version')}</span>
        </MenuFooter>
      </MenuContent>
    </Menu>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Section: Account compact (no header, no footer)

function AccountCompactDemo() {
  const t = useTranslations('menu-demo.items');
  const tUsers = useTranslations('menu-demo.users');
  const tTriggers = useTranslations('menu-demo.triggers');
  const tLabels = useTranslations('menu-demo.labels');
  const [dark, setDark] = React.useState(false);
  const [account, setAccount] = React.useState('olivia');

  return (
    <Menu>
      <ActionButton label={tTriggers('account')} />
      <MenuContent size="md" align="start">
        <MenuGroup>
          <MenuItem leading={<UserIcon />} shortcut="⌘K → P">
            {t('viewProfile')}
          </MenuItem>
          <MenuItem leading={<SettingsIcon />} shortcut="⌘S">
            {t('settings')}
          </MenuItem>
          <MenuSwitchItem
            leading={<MoonIcon />}
            checked={dark}
            onCheckedChange={setDark}
          >
            {t('darkMode')}
          </MenuSwitchItem>
          <MenuSub>
            <MenuSubTrigger leading={<HelpCircleIcon />}>
              {t('support')}
            </MenuSubTrigger>
            <MenuSubContent>
              <MenuGroup>
                <MenuItem leading={<FileTextIcon />}>
                  {t('documentation')}
                </MenuItem>
                <MenuItem leading={<HelpCircleIcon />}>
                  {t('contactSupport')}
                </MenuItem>
              </MenuGroup>
            </MenuSubContent>
          </MenuSub>
        </MenuGroup>
        <MenuSeparator />
        <MenuGroup>
          <MenuLabel>{tLabels('switchAccount')}</MenuLabel>
          <MenuRadioGroup value={account} onValueChange={setAccount}>
            <MenuRadioItem
              value="olivia"
              leading={
                <PersonAvatar
                  name={tUsers('olivia.name')}
                  tone="bg-avatar-6"
                  size="xs"
                />
              }
            >
              {tUsers('olivia.name')}
            </MenuRadioItem>
            <MenuRadioItem
              value="sienna"
              leading={
                <PersonAvatar
                  name={tUsers('sienna.name')}
                  tone="bg-avatar-4"
                  size="xs"
                />
              }
            >
              {tUsers('sienna.name')}
            </MenuRadioItem>
          </MenuRadioGroup>
          <MenuItem leading={<PlusIcon />}>{t('addAccount')}</MenuItem>
        </MenuGroup>
        <MenuFooterButton leading={<LogOutIcon />}>
          {t('signOut')}
        </MenuFooterButton>
      </MenuContent>
    </Menu>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Section: Avatar trigger menu (Changelog/Support/API variant)

function AvatarTriggerMenuDemo() {
  const t = useTranslations('menu-demo.items');
  const tUsers = useTranslations('menu-demo.users');
  const [dark, setDark] = React.useState(false);
  return (
    <Menu>
      <AvatarTrigger name={tUsers('olivia.name')} tone="bg-avatar-6" />
      <MenuContent size="md" align="end">
        <MenuHeader>
          <MenuUserCard
            avatar={
              <PersonAvatar
                name={tUsers('olivia.name')}
                tone="bg-avatar-6"
                size="default"
                withDot
              />
            }
            primary={tUsers('olivia.name')}
            secondary={tUsers('olivia.email')}
          />
        </MenuHeader>
        <MenuSeparator />
        <MenuGroup>
          <MenuItem leading={<UserIcon />} shortcut="⌘K → P">
            {t('viewProfile')}
          </MenuItem>
          <MenuItem leading={<SettingsIcon />} shortcut="⌘S">
            {t('settings')}
          </MenuItem>
          <MenuSwitchItem
            leading={<MoonIcon />}
            checked={dark}
            onCheckedChange={setDark}
          >
            {t('darkMode')}
          </MenuSwitchItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuGroup>
          <MenuItem leading={<SparklesIcon />}>{t('changelog')}</MenuItem>
          <MenuItem leading={<HelpCircleIcon />} hasSubmenuArrow>
            {t('support')}
          </MenuItem>
          <MenuItem leading={<ShieldIcon />}>{t('api')}</MenuItem>
        </MenuGroup>
        <MenuFooterButton leading={<LogOutIcon />}>
          {t('signOut')}
        </MenuFooterButton>
      </MenuContent>
    </Menu>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Section: Permission Can edit

function CanEditDemo() {
  const t = useTranslations('menu-demo.items');
  const tTriggers = useTranslations('menu-demo.triggers');
  const [perm, setPerm] = React.useState<'owner' | 'edit' | 'view'>('edit');
  return (
    <Menu>
      <ActionButton label={tTriggers('canEdit')} />
      <MenuContent size="sm" align="start">
        <MenuGroup>
          <MenuCheckboxItem
            checked={perm === 'owner'}
            onCheckedChange={() => setPerm('owner')}
            indicator="leading-check"
            closeOnClick
          >
            {t('owner')}
          </MenuCheckboxItem>
          <MenuCheckboxItem
            checked={perm === 'edit'}
            onCheckedChange={() => setPerm('edit')}
            indicator="leading-check"
            closeOnClick
          >
            {t('canEdit')}
          </MenuCheckboxItem>
          <MenuCheckboxItem
            checked={perm === 'view'}
            onCheckedChange={() => setPerm('view')}
            indicator="leading-check"
            closeOnClick
          >
            {t('canView')}
          </MenuCheckboxItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuGroup>
          <MenuItem leading={<Trash2Icon />} variant="destructive">
            {t('delete')}
          </MenuItem>
        </MenuGroup>
      </MenuContent>
    </Menu>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Section: Manage access (search + checkboxes)

function ManageAccessDemo() {
  const t = useTranslations('menu-demo.items');
  const tTriggers = useTranslations('menu-demo.triggers');
  const tUsers = useTranslations('menu-demo.users');
  const [query, setQuery] = React.useState('');
  const [selected, setSelected] = React.useState<string[]>([
    'olivia',
    'phoenix',
  ]);

  const filtered = React.useMemo(() => {
    if (!query) return PEOPLE;
    const q = query.toLowerCase();
    return PEOPLE.filter((p) =>
      tUsers(p.nameKey).toLowerCase().includes(q),
    );
  }, [query, tUsers]);

  const toggle = (id: string) => {
    setSelected((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    );
  };

  return (
    <Menu>
      <ActionButton label={tTriggers('manageAccess')} />
      <MenuContent size="md" align="start" className="overflow-visible">
        <MenuSearch
          value={query}
          onValueChange={setQuery}
          placeholder={t('search')}
        />
        <MenuItems>
          {filtered.map((person) => (
            <MenuCheckboxItem
              key={person.id}
              checked={selected.includes(person.id)}
              onCheckedChange={() => toggle(person.id)}
              indicator="leading-box"
              closeOnClick={false}
            >
              {tUsers(person.nameKey)}
            </MenuCheckboxItem>
          ))}
        </MenuItems>
        <MenuFooterButton leading={<PlusIcon />}>
          {t('createTeam')}
        </MenuFooterButton>
      </MenuContent>
    </Menu>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Section: Copy tools (icons + separators)

function CopyToolsDemo() {
  const t = useTranslations('menu-demo.items');
  const tTriggers = useTranslations('menu-demo.triggers');
  return (
    <Menu>
      <ActionButton label={tTriggers('copy')} />
      <MenuContent size="md" align="start">
        <MenuGroup>
          <MenuItem leading={<FileTextIcon />}>{t('viewAsMarkdown')}</MenuItem>
          <MenuItem leading={<CopyIcon />}>{t('copyAsMarkdown')}</MenuItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuGroup>
          <MenuItem leading={<ZapIcon />}>{t('openIn', { target: 'v0' })}</MenuItem>
          <MenuItem leading={<SparklesIcon />}>
            {t('openIn', { target: 'Claude' })}
          </MenuItem>
          <MenuItem leading={<ZapIcon />}>
            {t('openIn', { target: 'Bolt' })}
          </MenuItem>
          <MenuItem leading={<SparklesIcon />}>
            {t('openIn', { target: 'Lovable' })}
          </MenuItem>
          <MenuItem leading={<KeyboardIcon />}>
            {t('openIn', { target: 'Cursor' })}
          </MenuItem>
          <MenuItem leading={<SparklesIcon />}>
            {t('openIn', { target: 'ChatGPT' })}
          </MenuItem>
          <MenuItem leading={<SparklesIcon />}>
            {t('openIn', { target: 'Perplexity' })}
          </MenuItem>
          <MenuItem leading={<SparklesIcon />}>
            {t('openIn', { target: 'Gemini' })}
          </MenuItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuGroup>
          <MenuItem leading={<PaintbrushIcon />}>{t('openInFigma')}</MenuItem>
          <MenuItem leading={<GitBranchIcon />}>{t('createGist')}</MenuItem>
        </MenuGroup>
      </MenuContent>
    </Menu>
  );
}

// ────────────────────────────────────────────────────────────────────────────

export function MenuDemoView() {
  const t = useTranslations('menu-demo');
  const tS = useTranslations('menu-demo.sections');

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-8 md:px-6 md:py-12 lg:px-8 lg:py-16">
      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-3"
      >
        <span className="w-fit rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium uppercase tracking-[0.12em] text-brand">
          Menu · v1
        </span>
        <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
          {t('title')}
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
          {t('description')}
        </p>
      </motion.header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <DemoCard
          title={tS('actions.title')}
          description={tS('actions.description')}
        >
          <ActionsSimpleDemo />
        </DemoCard>

        <DemoCard
          title={tS('actionsRich.title')}
          description={tS('actionsRich.description')}
        >
          <ActionsRichDemo />
        </DemoCard>

        <DemoCard
          title={tS('account.title')}
          description={tS('account.description')}
        >
          <AccountFullMenuDemo />
        </DemoCard>

        <DemoCard
          title={tS('accountCompact.title')}
          description={tS('accountCompact.description')}
        >
          <AccountCompactDemo />
        </DemoCard>

        <DemoCard
          title={tS('kebabAvatar.title')}
          description={tS('kebabAvatar.description')}
        >
          <ActionsRichDemo />
          <AvatarTriggerMenuDemo />
          <AccountCompactDemo />
        </DemoCard>

        <DemoCard
          title={tS('permissionShort.title')}
          description={tS('permissionShort.description')}
        >
          <CanEditDemo />
        </DemoCard>

        <DemoCard
          title={tS('manageAccess.title')}
          description={tS('manageAccess.description')}
        >
          <ManageAccessDemo />
        </DemoCard>

        <DemoCard
          title={tS('copyTools.title')}
          description={tS('copyTools.description')}
        >
          <CopyToolsDemo />
        </DemoCard>
      </div>
    </main>
  );
}

// Suppress unused-import warnings for icons used conditionally in JSX bodies
void BookmarkIcon;
void LinkIcon;
void Share2Icon;
