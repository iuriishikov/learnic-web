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
 * full-width cover, then the ordered content blocks in a narrower
 * reading column.
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
    <article className="mx-auto w-full max-w-3xl px-4 pb-20 pt-10 md:px-6 md:pt-14 lg:pt-16">
      <header className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center md:gap-5">
        {post.topic ? (
          <p className="text-sm font-semibold text-brand">{post.topic}</p>
        ) : null}

        <h1 className="font-heading text-[2rem] font-semibold leading-[1.15] tracking-tight text-foreground md:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
          {post.title}
        </h1>

        {post.subtitle ? (
          <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
            {post.subtitle}
          </p>
        ) : null}

        {post.author ? (
          <AuthorByline author={post.author} date={date} />
        ) : null}
      </header>

      {post.cover ? (
        <div className="mt-10 overflow-hidden rounded-2xl bg-muted ring-1 ring-foreground/5 md:mt-12">
          {/* Presigned S3 URL (expiring, off-domain) — next/image would need
              per-host remote config and gives no SEO benefit here. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.cover.url}
            alt=""
            className="aspect-[16/9] w-full object-cover"
          />
        </div>
      ) : null}

      <div className="mx-auto mt-10 flex max-w-2xl flex-col gap-7 md:mt-12 md:gap-8">
        {post.blocks.map((block, index) => (
          <BlockRenderer key={index} block={block} />
        ))}
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
    <div className="flex items-center justify-center gap-2.5 pt-1">
      <UserAvatar
        user={{ id: author.name, fullName: author.name, avatar: null }}
        imageUrl={author.avatarUrl}
        statusType={null}
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
        className="rich-editor-content text-base leading-relaxed text-foreground md:text-[1.0625rem]"
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
              className="w-full object-cover"
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
    <div
      className={cn(
        'overflow-hidden rounded-2xl bg-muted ring-1 ring-foreground/5',
        className,
      )}
    >
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
