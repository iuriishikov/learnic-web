/**
 * Shared wire shapes (snake_case payloads coming from the backend)
 * and pure converters used by every kind descriptor. Kept React-free
 * so server-only modules (`api/_shared.ts`) can import them without
 * dragging client components into the server bundle graph.
 */

import type {
  ActorRef,
  CollaborationSnapshot,
  CollaborationStatus,
  ProductRef,
} from '../model/types';

export type ActorRaw = {
  oid: string;
  full_name: string;
};

export type ProductRaw = {
  oid: string;
  name: string;
};

export type CollaborationRaw = {
  status: CollaborationStatus;
  accepted_at: string | null;
  declined_at: string | null;
  revoked_at: string | null;
  invite_expires_at: string | null;
};

export function toActor(raw: ActorRaw): ActorRef {
  return { oid: raw.oid, fullName: raw.full_name };
}

export function toProduct(raw: ProductRaw): ProductRef {
  return { oid: raw.oid, name: raw.name };
}

export function toCollaboration(
  raw: CollaborationRaw | null | undefined,
): CollaborationSnapshot | null {
  if (raw == null) return null;
  return {
    status: raw.status,
    acceptedAt: raw.accepted_at,
    declinedAt: raw.declined_at,
    revokedAt: raw.revoked_at,
    inviteExpiresAt: raw.invite_expires_at,
  };
}
