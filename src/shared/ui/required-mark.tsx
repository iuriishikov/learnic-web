import { cn } from '@/shared/lib/utils';

/**
 * Brand-colored asterisk for marking required form fields. Decorative —
 * `aria-hidden`, since semantic requirement is communicated by the input's
 * own `required` attribute or `aria-required`.
 */
export function RequiredMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      data-slot="required-mark"
      className={cn('ml-0.5 select-none text-brand', className)}
    >
      *
    </span>
  );
}
