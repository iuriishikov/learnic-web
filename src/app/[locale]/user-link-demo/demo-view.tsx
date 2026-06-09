'use client';

import { RotateCwIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';

import type { UserPreview } from '@/features/user-profile';
import type { ApiFile } from '@/shared/types/user';
import { Button } from '@/shared/ui/button';
import { UserAvatar } from '@/shared/ui/user-avatar';
import { UserLink, type UserLinkPreviewLoader } from '@/shared/ui/user-link';

/**
 * Avatars come from picsum.photos — a public placeholder service — so the
 * demo works without hitting the real S3 storage. `UserAvatar` renders a
 * plain `<img>`, so no next.config whitelisting is needed.
 */
function demoAvatar(seed: string): ApiFile {
  return {
    oid: `demo-avatar-${seed}`,
    contentType: 'image/jpeg',
    sizeBytes: 1,
    url: `https://picsum.photos/seed/${seed}/200`,
  };
}

/** Wide banner crop matching the hover-card cover slot (288×80 @2x). */
function demoCover(seed: string): ApiFile {
  return {
    oid: `demo-cover-${seed}`,
    contentType: 'image/jpeg',
    sizeBytes: 1,
    url: `https://picsum.photos/seed/${seed}/576/160`,
  };
}

/** Resolves with `preview` after `delayMs` — a fake network round-trip. */
function delayedLoader(
  preview: UserPreview,
  delayMs: number,
): UserLinkPreviewLoader {
  return () =>
    new Promise((resolve) => {
      setTimeout(() => resolve(preview), delayMs);
    });
}

/** Never settles — keeps the preview skeleton on screen indefinitely. */
const neverLoader: UserLinkPreviewLoader = () => new Promise(() => {});

/** Always rejects — drives the preview into its error + retry state. */
const failingLoader: UserLinkPreviewLoader = () =>
  Promise.reject(new Error('user-link-demo: simulated network failure'));

/* -------------------------------------------------------------------------- */
/* Demo wrappers                                                              */
/* -------------------------------------------------------------------------- */

/**
 * `UserLink` caches previews per `userId`, so the same id must not be reused
 * with different loaders. Each demo instance therefore gets its own
 * `instanceId` (section-suffixed), and the preview is rebound to it so the
 * cache entries stay independent.
 */
function DemoUserLink({
  preview,
  instanceId,
  delayMs,
  className,
  children,
}: {
  preview: UserPreview;
  instanceId: string;
  delayMs: number;
  className?: string;
  children: React.ReactNode;
}) {
  const scoped = { ...preview, id: instanceId };
  return (
    <UserLink
      userId={instanceId}
      loadPreview={delayedLoader(scoped, delayMs)}
      className={className}
    >
      {children}
    </UserLink>
  );
}

function DemoCard({
  title,
  description,
  action,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6"
    >
      <header className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between md:gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div className="flex flex-col gap-4">{children}</div>
    </motion.section>
  );
}

function DemoTile({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-background p-4">
      <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {label}
      </span>
      <div className="text-sm">{children}</div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* View                                                                       */
/* -------------------------------------------------------------------------- */

export function UserLinkDemoView() {
  const t = useTranslations('user-link-demo');

  // Bumping the key changes the demo userIds, which invalidates the
  // react-query cache entries — hover again to watch the states replay.
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((n) => n + 1), []);

  const makePreview = (
    key: 'anna' | 'mikhail' | 'elena' | 'dmitry' | 'polina' | 'longBio',
    opts: {
      avatarSeed?: string;
      coverSeed?: string;
      isVerified?: boolean;
      withBio?: boolean;
      withLinks?: boolean;
      withPublicEmail?: boolean;
    } = {},
  ): UserPreview => ({
    id: `demo-${key}`,
    fullName: t(`users.${key}.name`),
    email: t(`users.${key}.email`),
    publicEmail: opts.withPublicEmail ? t(`users.${key}.publicEmail`) : null,
    avatar: opts.avatarSeed ? demoAvatar(opts.avatarSeed) : null,
    cover: opts.coverSeed ? demoCover(opts.coverSeed) : null,
    isVerified: opts.isVerified ?? false,
    description: opts.withBio ? t(`users.${key}.bio`) : null,
    websiteUrl: opts.withLinks ? 'https://example.com' : null,
    portfolioUrl: opts.withLinks ? 'https://example.com/portfolio' : null,
  });

  const anna = makePreview('anna', {
    avatarSeed: 'user-anna',
    coverSeed: 'cover-anna',
    isVerified: true,
    withBio: true,
    withLinks: true,
  });
  const mikhail = makePreview('mikhail', {
    avatarSeed: 'user-mikhail',
    withBio: true,
    withPublicEmail: true,
  });
  const elena = makePreview('elena');
  const polina = makePreview('polina', {
    avatarSeed: 'user-polina',
    withBio: true,
  });
  const longBio = makePreview('longBio', { withBio: true });

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 md:px-6 md:py-12">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-semibold text-foreground md:text-3xl">
          {t('title')}
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
          {t('description')}
        </p>
      </header>

      <DemoCard
        title={t('sections.inline.title')}
        description={t('sections.inline.description')}
      >
        <p className="max-w-3xl text-sm leading-relaxed text-foreground md:text-base">
          {t.rich('sections.inline.paragraph', {
            anna: (chunks) => (
              <DemoUserLink
                preview={anna}
                instanceId="demo-anna-inline"
                delayMs={900}
              >
                {chunks}
              </DemoUserLink>
            ),
            mikhail: (chunks) => (
              <DemoUserLink
                preview={mikhail}
                instanceId="demo-mikhail-inline"
                delayMs={900}
              >
                {chunks}
              </DemoUserLink>
            ),
            elena: (chunks) => (
              <DemoUserLink
                preview={elena}
                instanceId="demo-elena-inline"
                delayMs={900}
              >
                {chunks}
              </DemoUserLink>
            ),
          })}
        </p>
      </DemoCard>

      <DemoCard
        title={t('sections.states.title')}
        description={t('sections.states.description')}
        action={
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={reload}
            className="gap-1.5"
          >
            <RotateCwIcon className="size-3.5" />
            {t('sections.states.reload')}
          </Button>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <DemoTile
            label={t('sections.states.loading.label')}
            hint={t('sections.states.loading.hint')}
          >
            <UserLink
              userId={`demo-loading-${reloadKey}`}
              loadPreview={neverLoader}
            >
              {t('users.dmitry.name')}
            </UserLink>
          </DemoTile>
          <DemoTile
            label={t('sections.states.success.label')}
            hint={t('sections.states.success.hint')}
          >
            <UserLink
              userId={`demo-success-${reloadKey}`}
              loadPreview={delayedLoader(polina, 1500)}
            >
              {t('users.polina.name')}
            </UserLink>
          </DemoTile>
          <DemoTile
            label={t('sections.states.error.label')}
            hint={t('sections.states.error.hint')}
          >
            <UserLink
              userId={`demo-error-${reloadKey}`}
              loadPreview={failingLoader}
            >
              {t('users.elena.name')}
            </UserLink>
          </DemoTile>
        </div>
      </DemoCard>

      <DemoCard
        title={t('sections.variants.title')}
        description={t('sections.variants.description')}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DemoTile label={t('sections.variants.verified')}>
            <DemoUserLink
              preview={anna}
              instanceId="demo-anna-variants"
              delayMs={600}
            >
              {t('users.anna.name')}
            </DemoUserLink>
          </DemoTile>
          <DemoTile label={t('sections.variants.photo')}>
            <DemoUserLink
              preview={polina}
              instanceId="demo-polina-variants"
              delayMs={600}
            >
              {t('users.polina.name')}
            </DemoUserLink>
          </DemoTile>
          <DemoTile label={t('sections.variants.initials')}>
            <DemoUserLink
              preview={elena}
              instanceId="demo-elena-variants"
              delayMs={600}
            >
              {t('users.elena.name')}
            </DemoUserLink>
          </DemoTile>
          <DemoTile label={t('sections.variants.longBio')}>
            <DemoUserLink
              preview={longBio}
              instanceId="demo-longBio-variants"
              delayMs={600}
            >
              {t('users.longBio.name')}
            </DemoUserLink>
          </DemoTile>
        </div>
      </DemoCard>

      <DemoCard
        title={t('sections.custom.title')}
        description={t('sections.custom.description')}
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
            <UserAvatar
              size="default"
              showStatus={false}
              user={{
                id: anna.id,
                fullName: anna.fullName,
                avatar: anna.avatar,
                isVerified: anna.isVerified,
              }}
            />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">
                {t('sections.custom.byline')}
              </span>
              <DemoUserLink
                preview={anna}
                instanceId="demo-anna-custom"
                delayMs={700}
                className="text-sm"
              >
                {t('users.anna.name')}
              </DemoUserLink>
            </div>
          </div>

          <DemoUserLink
            preview={mikhail}
            instanceId="demo-mikhail-custom"
            delayMs={700}
            className="inline-flex items-center gap-1.5 text-sm"
          >
            <UserAvatar
              size="sm"
              showStatus={false}
              user={{
                id: mikhail.id,
                fullName: mikhail.fullName,
                avatar: mikhail.avatar,
              }}
            />
            {t('users.mikhail.name')}
          </DemoUserLink>
        </div>
      </DemoCard>
    </main>
  );
}
