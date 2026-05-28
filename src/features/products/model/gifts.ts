/**
 * Domain types for the "gift a course" sub-flow (owner issues gifts).
 *
 * `GiftStatus` mirrors the backend `GiftStatus` enum exhaustively
 * (`docs/api/openapi.json`): `pending_invite` is the awaiting-acceptance
 * state (same wording as a collaboration invite), `accepted` is the
 * enrolled terminal, plus `declined` / `revoked`.
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
