'use client';

import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'motion/react';
import {
  ExternalLinkIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';

import { Link, useRouter } from '@/shared/config/i18n/navigation';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/shared/ui/empty';
import { Skeleton } from '@/shared/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group';

import { deletePostAction, listPostsAction, type BlogPostsPage } from '../api/posts';
import { publishPostAction, unpublishPostAction } from '../api/lifecycle';
import { useBlogErrorToast } from '../lib/use-blog-errors';
import type { BlogPostStatus, BlogPostSummary } from '../model/types';
import { CreatePostDialog } from './create-post-dialog';
import { DeletePostDialog } from './delete-post-dialog';
import { StatusBadge } from './status-badge';

type StatusFilter = 'all' | BlogPostStatus;
const PAGE_SIZE = 20;

export const blogPostsKey = (status: StatusFilter, offset: number) =>
  ['blogPosts', { status, offset }] as const;

type PostsListViewProps = {
  initialPage: BlogPostsPage;
};

export function PostsListView({ initialPage }: PostsListViewProps) {
  const t = useTranslations('blog-admin');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [offset, setOffset] = useState(0);

  const query = useQuery<BlogPostsPage, Error>({
    queryKey: blogPostsKey(status, offset),
    queryFn: async () => {
      const result = await listPostsAction({
        status: status === 'all' ? undefined : status,
        offset,
        limit: PAGE_SIZE,
      });
      if (!result.ok) throw new Error(result.reason);
      return result.data;
    },
    initialData:
      status === 'all' && offset === 0 ? initialPage : undefined,
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });

  const page = query.data;
  const total = page?.total ?? 0;
  const items = page?.items ?? [];

  return (
    <div className="mx-auto flex w-full max-w-[960px] flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <header className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {t('list.title')}
          </h1>
          <CreatePostDialog
            trigger={
              <Button size="sm">
                <PlusIcon data-icon="inline-start" />
                {t('list.newPost')}
              </Button>
            }
          />
        </div>
        <p className="text-sm text-muted-foreground">{t('list.subtitle')}</p>
      </header>

      <ToggleGroup
        size="sm"
        value={[status]}
        onValueChange={(group) => {
          const next = (group[0] as StatusFilter | undefined) ?? 'all';
          setStatus(next);
          setOffset(0);
        }}
      >
        <ToggleGroupItem value="all">{t('list.filters.all')}</ToggleGroupItem>
        <ToggleGroupItem value="draft">
          {t('list.filters.draft')}
        </ToggleGroupItem>
        <ToggleGroupItem value="published">
          {t('list.filters.published')}
        </ToggleGroupItem>
      </ToggleGroup>

      {query.isPending || query.isPlaceholderData ? (
        <ListSkeleton />
      ) : items.length === 0 ? (
        <EmptyState filtered={status !== 'all'} />
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
          {items.map((post, index) => (
            <PostRow key={post.id} post={post} index={index} />
          ))}
        </ul>
      )}

      {total > PAGE_SIZE ? (
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground tabular-nums">
            {t('list.range', {
              from: offset + 1,
              to: Math.min(offset + PAGE_SIZE, total),
              total,
            })}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={offset === 0}
              onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
            >
              {t('list.prev')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={offset + PAGE_SIZE >= total}
              onClick={() => setOffset((o) => o + PAGE_SIZE)}
            >
              {t('list.next')}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PostRow({ post, index }: { post: BlogPostSummary; index: number }) {
  const t = useTranslations('blog-admin');
  const format = useFormatter();
  const router = useRouter();
  const queryClient = useQueryClient();
  const errorToast = useBlogErrorToast();
  const reduce = useReducedMotion();
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function runLifecycle(action: 'publish' | 'unpublish') {
    setBusy(true);
    const result =
      action === 'publish'
        ? await publishPostAction(post.id)
        : await unpublishPostAction(post.id);
    setBusy(false);
    if (!result.ok) {
      errorToast(result.reason);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['blogPosts'] });
  }

  async function runDelete() {
    setBusy(true);
    const result = await deletePostAction(post.id);
    setBusy(false);
    setConfirmOpen(false);
    if (!result.ok) {
      errorToast(result.reason);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['blogPosts'] });
  }

  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.03, 0.2) }}
      className={cn(
        'flex items-center gap-3 px-4 py-3 transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-muted/40',
        busy && 'pointer-events-none opacity-60',
      )}
    >
      <Link
        href={`/admin/blog/${post.id}/edit`}
        className="flex min-w-0 flex-1 flex-col gap-1 focus-visible:outline-none"
      >
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-foreground">
            {post.title}
          </span>
          <StatusBadge status={post.status} />
        </span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="truncate font-mono">/{post.slug}</span>
          <span aria-hidden>·</span>
          <span className="shrink-0">
            {t('list.updatedAt', {
              date: format.dateTime(new Date(post.updatedAt), {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              }),
            })}
          </span>
        </span>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('list.rowActions')}
            >
              <MoreHorizontalIcon />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => router.push(`/admin/blog/${post.id}/edit`)}>
            <PencilIcon data-icon="inline-start" />
            {t('list.edit')}
          </DropdownMenuItem>
          {post.status === 'published' ? (
            <DropdownMenuItem onClick={() => runLifecycle('unpublish')}>
              {t('actions.unpublish')}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => runLifecycle('publish')}>
              {t('actions.publish')}
            </DropdownMenuItem>
          )}
          {post.status === 'published' ? (
            <DropdownMenuItem
              onClick={() =>
                window.open(`/blog/${post.slug}`, '_blank', 'noopener')
              }
            >
              <ExternalLinkIcon data-icon="inline-start" />
              {t('actions.viewPublic')}
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2Icon data-icon="inline-start" />
            {t('list.delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeletePostDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        postTitle={post.title}
        busy={busy}
        onConfirm={runDelete}
      />
    </motion.li>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  const t = useTranslations('blog-admin');
  return (
    <Empty className="rounded-xl border border-dashed border-border py-14">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <PlusIcon />
        </EmptyMedia>
        <EmptyTitle>
          {filtered ? t('list.emptyFiltered.title') : t('list.empty.title')}
        </EmptyTitle>
        <EmptyDescription>
          {filtered
            ? t('list.emptyFiltered.description')
            : t('list.empty.description')}
        </EmptyDescription>
      </EmptyHeader>
      {!filtered ? (
        <EmptyContent>
          <CreatePostDialog
            trigger={
              <Button size="sm">
                <PlusIcon data-icon="inline-start" />
                {t('list.newPost')}
              </Button>
            }
          />
        </EmptyContent>
      ) : null}
    </Empty>
  );
}

function ListSkeleton() {
  return (
    <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
      {[0, 1, 2, 3, 4].map((i) => (
        <li key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="size-8 rounded-md" />
        </li>
      ))}
    </ul>
  );
}
