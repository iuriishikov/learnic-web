/**
 * Domain types for the email-link gift landing flow (camelCase).
 *
 * `GiftStatus` mirrors the backend `GiftStatus` enum exhaustively
 * (`docs/api/openapi.json`): `pending_invite` is the awaiting-acceptance
 * state, `accepted` the enrolled terminal, plus `declined` / `revoked`.
 */

export type GiftStatus =
  | 'pending_invite'
  | 'accepted'
  | 'declined'
  | 'revoked';

/** Lightweight user projection embedded in a gift (UserRefSchema). */
export type GiftUserRef = {
  id: string;
  fullName: string;
  email: string;
};

export type Gift = {
  id: string;
  productId: string;
  productName: string;
  recipient: GiftUserRef | null;
  invitedEmail: string | null;
  status: GiftStatus;
  gifter: GiftUserRef;
  inviteExpiresAt: string | null;
  createdAt: string;
  acceptedAt: string | null;
  declinedAt: string | null;
  revokedAt: string | null;
};

/** The route action — which confirmation the landing page renders. */
export type GiftAction = 'accept' | 'decline';

export const GIFT_ACTIONS = ['accept', 'decline'] as const;

export function isGiftAction(value: string): value is GiftAction {
  return value === 'accept' || value === 'decline';
}
