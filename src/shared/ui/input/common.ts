/**
 * Shared types for every input variant.
 *
 * `CommonInputProps` are the per-shell concerns (visual state, help
 * tooltip slot, class override) that every wrapper in `input/`
 * accepts uniformly.
 *
 * `InputVariantProps` is the canonical "I wrap a single <input>"
 * base: each concrete variant (Text, Email, Date, Website, …) owns
 * its `type`, `disabled` and `className`, so those are omitted from
 * the native input attributes and re-exposed through the shell.
 */
import type * as React from 'react';

export type CommonInputProps = {
  invalid?: boolean;
  disabled?: boolean;
  /** Force the visual focused state (for showcases / previews). */
  previewFocused?: boolean;
  helpTooltip?: React.ReactNode;
  className?: string;
};

export type InputVariantProps = Omit<
  React.ComponentProps<'input'>,
  'type' | 'disabled' | 'className'
> &
  CommonInputProps;
