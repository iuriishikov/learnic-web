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
};
