import { cn } from '@/shared/lib/utils';

type PagePlaceholderProps = {
  title: string;
  description?: string;
  body?: string;
  className?: string;
};

export function PagePlaceholder({
  title,
  description,
  body,
  className,
}: PagePlaceholderProps) {
  return (
    <section
      className={cn(
        'mx-auto w-full max-w-[1440px] px-4 py-12 md:px-8 md:py-16',
        className,
      )}
    >
      <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
        {title}
      </h1>
      {description ? (
        <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
          {description}
        </p>
      ) : null}
      {body ? (
        <p className="mt-8 max-w-2xl text-sm text-muted-foreground">{body}</p>
      ) : null}
    </section>
  );
}
