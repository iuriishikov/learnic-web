/**
 * Single source of truth for notification kinds.
 *
 * Adding a new kind = creating a `kinds/<kind>.tsx` file with a
 * descriptor and registering it here. Every type related to kinds
 * — the discriminator union ({@link NotificationKind}), the domain
 * shape ({@link NotificationDetails}), the wire shape
 * ({@link NotificationDetailsRaw}) — is **derived** from the
 * registry value, so there are no parallel unions to keep in sync
 * and TypeScript flags a missing/mistyped descriptor at the
 * registry line itself.
 */

import { accessRevokedDescriptor } from './access-revoked';
import { giftAcceptedDescriptor } from './gift-accepted';
import { giftDeclinedDescriptor } from './gift-declined';
import { giftReceivedDescriptor } from './gift-received';
import {
  inviteAcceptedDescriptor,
} from './invite-accepted';
import {
  inviteDeclinedDescriptor,
} from './invite-declined';
import { inviteSentDescriptor } from './invite-sent';
import { newLoginDescriptor } from './new-login';
import type { KindDescriptor } from './types';

export const KIND_REGISTRY = {
  invite_sent: inviteSentDescriptor,
  invite_accepted: inviteAcceptedDescriptor,
  invite_declined: inviteDeclinedDescriptor,
  access_revoked: accessRevokedDescriptor,
  gift_received: giftReceivedDescriptor,
  gift_accepted: giftAcceptedDescriptor,
  gift_declined: giftDeclinedDescriptor,
  new_login: newLoginDescriptor,
};

type Registry = typeof KIND_REGISTRY;

/** Discriminator union, derived from the registry keys. */
export type NotificationKind = keyof Registry & string;

/** Domain shape union, derived from each descriptor's `parseRaw` return. */
export type NotificationDetails = ReturnType<
  Registry[NotificationKind]['parseRaw']
>;

/** Wire shape union, derived from each descriptor's `parseRaw` argument. */
export type NotificationDetailsRaw = Parameters<
  Registry[NotificationKind]['parseRaw']
>[0];

/**
 * Convert a wire payload into the domain shape. The single cast
 * inside is the only unsafe spot — provably correct because
 * `raw.type` is the registry key. TS can't follow the link itself
 * because of contravariance of function arguments.
 */
export function parseDetails(
  raw: NotificationDetailsRaw,
): NotificationDetails {
  type AnyParse = (raw: NotificationDetailsRaw) => NotificationDetails;
  const desc = KIND_REGISTRY[raw.type as NotificationKind];
  return (desc.parseRaw as unknown as AnyParse)(raw);
}

/**
 * Look up the descriptor narrowed to the given details variant.
 * Used by `notification-item.tsx` to render the row generically.
 */
export function lookupKind<D extends NotificationDetails>(
  details: D,
): { descriptor: KindDescriptor<NotificationDetailsRaw, D> } {
  return {
    descriptor: KIND_REGISTRY[
      details.type as NotificationKind
    ] as unknown as KindDescriptor<NotificationDetailsRaw, D>,
  };
}

export type { KindDescriptor };
