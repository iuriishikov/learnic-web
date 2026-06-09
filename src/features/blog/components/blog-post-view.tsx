import { getFormatter } from 'next-intl/server';

import { cn } from '@/shared/lib/utils';
import { UserAvatar } from '@/shared/ui/user-avatar';

import type { PublishedPost, PublishedPostBlock } from '../model/types';

type BlogPostViewProps = {
  post: PublishedPost;
};

/**
 * Public reading page for a single published post — a centered layout:
 * topic label, title, short description, and the author byline above a
 * wide edge-to-edge cover (square corners, wider than the text), then
 * the ordered content blocks in a narrow 720px reading column.
 */
export async function BlogPostView({ post }: BlogPostViewProps) {
  const format = await getFormatter();
  const date = post.publishedAt
    ? format.dateTime(new Date(post.publishedAt), {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <article className="w-full pb-16 pt-10 md:pb-24 md:pt-14 lg:pt-16">
      <div className="px-4 md:px-6">
        <header className="mx-auto flex w-full max-w-[45rem] flex-col items-center text-center">
          {post.topic ? (
            <p className="text-sm font-semibold text-brand">{post.topic}</p>
          ) : null}

          <h1 className="mt-3 font-heading text-3xl font-semibold leading-[1.2] tracking-tight text-foreground md:text-4xl md:leading-[1.15] lg:text-5xl">
            {post.title}
          </h1>

          {post.subtitle ? (
            <p className="mt-4 text-lg leading-[1.5] text-muted-foreground md:mt-6 md:text-xl">
              {post.subtitle}
            </p>
          ) : null}

          {post.author ? (
            <AuthorByline author={post.author} date={date} />
          ) : null}
        </header>
      </div>

      {post.cover ? (
        <div className="mt-10 md:mt-16 md:px-6">
          <div className="mx-auto w-full max-w-5xl bg-muted">
            {/* Presigned S3 URL (expiring, off-domain) — next/image would need
                per-host remote config and gives no SEO benefit here. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.cover.url}
              alt=""
              className="aspect-[16/9] w-full object-cover"
            />
          </div>
        </div>
      ) : null}

      <div className="px-4 md:px-6">
        <div className="mx-auto mt-12 flex w-full max-w-[45rem] flex-col gap-8 md:mt-16 lg:mt-24">
          {post.blocks.map((block, index) => (
            <BlockRenderer key={index} block={block} />
          ))}
        </div>
      </div>
    </article>
  );
}

function AuthorByline({
  author,
  date,
}: {
  author: NonNullable<PublishedPost['author']>;
  date: string | null;
}) {
  return (
    <div className="mt-6 flex items-center justify-center gap-2.5 md:mt-8">
      <UserAvatar
        user={{ id: author.name, fullName: author.name, avatar: null }}
        imageUrl={author.avatarUrl}
        showStatus={false}
        shape="circle"
        size="lg"
      />
      <div className="flex flex-col text-left">
        <span className="text-sm font-semibold text-foreground">
          {author.name}
        </span>
        {date ? (
          <span className="text-sm text-muted-foreground">{date}</span>
        ) : null}
      </div>
    </div>
  );
}

function BlockRenderer({ block }: { block: PublishedPostBlock }) {
  if (block.type === 'html') {
    return (
      <div
        className={cn(
          'rich-editor-content text-lg leading-7 text-muted-foreground',
          // Reading-page typographic overrides on top of the editor
          // defaults: roomier paragraphs, large section headings, and a
          // quiet full-width divider — matching the post-page design.
          '[&_p]:my-[1em] [&_p:first-child]:mt-0 [&_p:last-child]:mb-0',
          '[&_h1]:text-4xl [&_h2]:text-3xl [&_h3]:text-2xl',
          '[&_:is(h1,h2,h3)]:mb-5 [&_:is(h1,h2,h3)]:mt-12',
          '[&_:is(h1,h2,h3):first-child]:mt-0',
          '[&_hr]:my-9 [&_hr]:border-border',
        )}
        // Server-sanitized HTML from the backend (see BlogHtmlBlock).
        dangerouslySetInnerHTML={{ __html: block.html }}
      />
    );
  }

  if (block.type === 'image') {
    return (
      <figure className="flex flex-col gap-2.5">
        <MediaFrame>
          {block.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={block.url}
              alt={block.caption ?? ''}
              className="w-full"
            />
          ) : (
            <MissingMedia />
          )}
        </MediaFrame>
        {block.caption ? <Caption>{block.caption}</Caption> : null}
      </figure>
    );
  }

  return (
    <figure className="flex flex-col gap-2.5">
      <MediaFrame>
        {block.url ? (
          <video
            src={block.url}
            controls
            className="aspect-video w-full bg-black"
          />
        ) : (
          <MissingMedia />
        )}
      </MediaFrame>
      {block.title ? <Caption>{block.title}</Caption> : null}
    </figure>
  );
}

function MediaFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('overflow-hidden bg-muted', className)}>
      {children}
    </div>
  );
}

function MissingMedia() {
  return (
    <div className="aspect-video w-full bg-muted" aria-hidden />
  );
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <figcaption className="text-center text-sm text-muted-foreground">
      {children}
    </figcaption>
  );
}
