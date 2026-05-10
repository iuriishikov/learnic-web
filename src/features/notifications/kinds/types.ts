import type { ComponentType } from 'react';

import type { ActorRef } from '../model/types';

/**
 * A single notification kind's render + parse contract.
 *
 * Generic over `R` (snake_case wire payload) and `D` (camelCase
 * domain shape). Both are co-located with the descriptor so the
 * registry can derive {@link NotificationKind},
 * {@link NotificationDetails} and {@link NotificationDetailsRaw}
 * directly from the typed registry — no parallel unions to keep
 * in sync.
 */
export type KindDescriptor<
  R extends { type: string },
  D extends { type: string },
> = {
  /**
   * i18n key under `notifications.lines.<key>.lead`. The renderer
   * picks `actor + lead + product` as the default sentence.
   */
  leadKey: string;

  /**
   * Convert the wire payload to the domain shape. The registry
   * dispatches to the right descriptor by `raw.type`, so every
   * `parseRaw` is invoked only with its own raw shape.
   */
  parseRaw: (raw: R) => D;

  /**
   * Profile actor used when `notification.actor` is null (the
   * polymorphic body sometimes carries a profile user — invitee,
   * decliner, assignee). Skip if the kind always populates the
   * top-level actor.
   */
  getFallbackActor?: (details: D) => ActorRef | null;

  /**
   * Action area rendered under the line — Accept/Revoke/etc.
   * Skip for read-only notifications. The component receives the
   * already-parsed details and an `onResolved` callback that the
   * panel wires to mark-as-read.
   */
  Action?: ComponentType<{
    details: D;
    onResolved: () => void;
  }>;

  /**
   * Custom message renderer that replaces the default "actor +
   * lead + product" sentence. Use for kinds that don't fit that
   * shape — e.g. security events that don't have a product or
   * an actor (login from device X). When omitted the renderer
   * falls back to the default sentence and `details.product` is
   * required.
   */
  renderLine?: ComponentType<{ details: D }>;

  /**
   * Custom avatar slot renderer that replaces the actor avatar.
   * Use for kinds that don't carry an actor — e.g. a security
   * shield icon for a new-login event. The renderer receives
   * the parsed details so it can pick an icon based on payload
   * (different icons per device, severity, etc.).
   */
  renderAvatar?: ComponentType<{ details: D }>;
};
