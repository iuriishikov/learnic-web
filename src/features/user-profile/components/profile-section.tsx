import { cn } from '@/shared/lib/utils';

type ProfileSectionProps = {
  label: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
};

/**
 * Reference-faithful "label on the left, content on the right" layout
 * for sections inside the public profile (About me, Experience, …).
 * Collapses to a stacked layout under `md:` so the label doesn't steal
 * a column from narrow viewports.
 */
export function ProfileSection({
  label,
  children,
  className,
  id,
}: ProfileSectionProps) {
  return (
    <section
      id={id}
      className={cn(
        'grid gap-3 md:grid-cols-[180px_1fr] md:gap-8 lg:grid-cols-[220px_1fr]',
        className,
      )}
    >
      <h2 className="text-sm font-semibold text-muted-foreground md:pt-1">
        {label}
      </h2>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
