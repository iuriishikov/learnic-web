type BlogMastheadProps = {
  eyebrow: string;
  title: string;
  description: string;
};

/**
 * Editorial page header for the blog index: a brand eyebrow, a display
 * title, and a one-line intro. Presentation-only (no client hooks) so it
 * renders the same on the server page and inside the client index shell.
 */
export function BlogMasthead({ eyebrow, title, description }: BlogMastheadProps) {
  return (
    <div className="flex max-w-[760px] flex-col gap-4">
      <span className="text-sm font-semibold text-brand">{eyebrow}</span>
      <h1 className="text-pretty text-3xl font-semibold leading-[1.15] tracking-tight text-foreground md:text-4xl lg:text-[44px] lg:leading-[1.1]">
        {title}
      </h1>
      <p className="text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
        {description}
      </p>
    </div>
  );
}
