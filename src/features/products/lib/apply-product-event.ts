import type { QueryClient } from '@tanstack/react-query';

import { productTagsKey, type Tag } from '@/features/product-tags';

import {
  productCollaborationsKey,
  productMyPermissionsKey,
  productRolesKey,
} from '../api/use-team';
import { productKey } from '../api/use-product';
import { productQAKey } from '../api/use-product-qa';
import type { ProductQA } from '../api/qa';
import type { Collaboration, Permission, Role } from '../model/team';
import { PERMISSIONS } from '../model/team';
import type { Product } from '../model/types';

import type { EventEnvelope } from './events-channel';

/**
 * Product-level `kind` values fanned in over the unified product
 * channel (`WS /products/{product_id}/events`). Mirrors the spec's
 * `ProductEventKind` enum: metadata, cover, status, Q&A,
 * collaboration lifecycle and role catalogue.
 */
export type ProductEventKind =
  | 'name_changed'
  | 'description_changed'
  | 'duration_changed'
  | 'price_changed'
  | 'cover_changed'
  | 'cover_removed'
  | 'published'
  | 'archived'
  | 'unarchived'
  | 'deleted'
  | 'qa_added'
  | 'qa_question_changed'
  | 'qa_answer_changed'
  | 'qa_reordered'
  | 'qa_deleted'
  | 'collaboration_invited'
  | 'collaboration_accepted'
  | 'collaboration_declined'
  | 'collaboration_revoked'
  | 'collaboration_grants_updated'
  | 'role_created'
  | 'role_updated'
  | 'role_deleted'
  | 'tags_changed';

/**
 * Apply one product-family event envelope to the local React Query
 * cache. Pure with respect to its `qc` argument; the hook owns the
 * subscription and threads `currentUserId` in so collaboration
 * events targeting the connected user can also invalidate
 * `productMyPermissionsKey` (the cache that gates permission-aware
 * UI controls on the editor).
 */
export function applyProductEvent(
  qc: QueryClient,
  productId: string,
  currentUserId: string | null,
  event: EventEnvelope<ProductEventKind>,
): void {
  const { kind, payload } = event;

  switch (kind) {
    /* ---------- product metadata: trivial patch ---------- */
    case 'name_changed': {
      const name = strField(payload, 'name');
      if (name !== undefined) {
        patchProduct(qc, productId, (p) => ({ ...p, title: name }));
      }
      return;
    }
    case 'description_changed': {
      const description = strField(payload, 'description');
      if (description !== undefined) {
        patchProduct(qc, productId, (p) => ({ ...p, description }));
      }
      return;
    }
    case 'duration_changed': {
      const hours = numField(payload, 'total_duration_in_hours');
      if (hours !== undefined) {
        patchProduct(qc, productId, (p) => ({ ...p, durationHours: hours }));
      }
      return;
    }
    case 'price_changed': {
      const amount = numField(payload, 'amount');
      if (amount !== undefined) {
        patchProduct(qc, productId, (p) => ({ ...p, priceAmount: amount }));
      }
      return;
    }

    /* ---------- cover: refetch (file id changes, payload too thin) ---------- */
    case 'cover_changed':
    case 'cover_removed':
      qc.invalidateQueries({ queryKey: productKey(productId) });
      return;

    /* ---------- status flips: refetch (status + published_at) ---------- */
    case 'published':
    case 'archived':
    case 'unarchived':
    case 'deleted':
      qc.invalidateQueries({ queryKey: productKey(productId) });
      return;

    /* ---------- Q&A ---------- */
    case 'qa_added':
    case 'qa_reordered':
      // `qa_added` carries id-level info but not the full new ordering;
      // `qa_reordered` may cascade other entries' positions on the server.
      // Refetch the list to stay in sync.
      qc.invalidateQueries({ queryKey: productQAKey(productId) });
      return;

    case 'qa_question_changed': {
      const qaId = strField(payload, 'qa_id');
      const question = strField(payload, 'question');
      if (qaId && question !== undefined) {
        patchQAList(qc, productId, (list) =>
          list.map((e) => (e.id === qaId ? { ...e, question } : e)),
        );
      }
      return;
    }
    case 'qa_answer_changed': {
      const qaId = strField(payload, 'qa_id');
      const answer = strField(payload, 'answer');
      if (qaId && answer !== undefined) {
        patchQAList(qc, productId, (list) =>
          list.map((e) => (e.id === qaId ? { ...e, answer } : e)),
        );
      }
      return;
    }
    case 'qa_deleted': {
      const qaId = strField(payload, 'qa_id');
      if (qaId) {
        patchQAList(qc, productId, (list) =>
          list
            .filter((e) => e.id !== qaId)
            .map((e, index) => ({ ...e, position: index })),
        );
      }
      return;
    }

    /* ---------- collaboration lifecycle ---------- */
    // Status flips (pending → active/declined/revoked) and grant changes
    // touch fields the SPA renders verbatim from the REST payload (status,
    // accepted_at, declined_at, revoked_at, grants[]). Refetch the team
    // tab so it stays in sync without re-deriving payloads.
    case 'collaboration_invited':
    case 'collaboration_accepted':
    case 'collaboration_declined':
    case 'collaboration_revoked':
    case 'collaboration_grants_updated':
      qc.invalidateQueries({
        queryKey: productCollaborationsKey(productId),
      });
      // If the affected row is the *current user's* collaboration, the
      // change is also a permission change for them — accept grants the
      // baseline, revoke removes everything, grants_updated swaps the
      // active set. Refetch `productMyPermissionsKey` so every
      // permission-gated control on the editor reflects the new state
      // immediately, not after the next stale-time tick.
      if (
        currentUserId !== null &&
        affectsCurrentUser(payload, currentUserId) &&
        kind !== 'collaboration_invited' &&
        kind !== 'collaboration_declined'
      ) {
        qc.invalidateQueries({
          queryKey: productMyPermissionsKey(productId),
        });
      }
      return;

    /* ---------- role catalogue ---------- */
    case 'role_created': {
      const role = parseRolePayload(payload);
      if (role) appendRole(qc, productId, role);
      return;
    }
    case 'role_updated': {
      const role = parseRolePayload(payload);
      if (!role) return;
      replaceRole(qc, productId, role);
      // Denormalised `roleName` lives on every grant in the
      // collaborations cache — keep it in sync so the team list
      // doesn't show a stale role label.
      patchCollaborationGrantsForRole(qc, productId, role);
      // The role's permission set just changed. Every collaborator
      // holding this role now has a different effective permission
      // set — for the *current* user we own the cache, so refetch
      // their permissions if they're affected. (Other users' UI
      // gating recomputes on their own tab via this same event.)
      if (
        currentUserId !== null &&
        currentUserHoldsRole(qc, productId, currentUserId, role.id)
      ) {
        qc.invalidateQueries({
          queryKey: productMyPermissionsKey(productId),
        });
      }
      return;
    }
    case 'role_deleted': {
      const roleId = strField(payload, 'role_id');
      if (roleId) dropRole(qc, productId, roleId);
      // The DB enforces `ON DELETE RESTRICT` on every grant pointing
      // at the role, so deletion only succeeds when no live grants
      // reference it — no permission re-derivation needed.
      return;
    }

    /* ---------- tags ---------- */
    case 'tags_changed': {
      // Payload carries the full post-mutation tag list in
      // `product_tags.position` order — replace the cached array
      // verbatim, no per-item diff. The wire shape is
      // `{tags: [{oid, name, color}, ...]}` exactly mirrored from
      // `TagsChangedPayload.of` on the backend.
      const tags = parseTagsPayload(payload);
      if (tags === null) {
        // Forward-compat: a future variant changes the payload
        // shape — fall back to a refetch so the cache doesn't
        // get nullified by malformed input.
        qc.invalidateQueries({ queryKey: productTagsKey(productId) });
        qc.invalidateQueries({ queryKey: productKey(productId) });
        return;
      }
      // Editor's optimistic flow keys off `productTagsKey`; cards
      // (marketplace / my-products / profile-products) consume the
      // embedded `product.tags` field on the Product cache. Refetch
      // the product so its inline `tags` array stays consistent with
      // the per-tags cache we just wrote.
      qc.setQueryData<Tag[]>(productTagsKey(productId), tags);
      qc.invalidateQueries({ queryKey: productKey(productId) });
      return;
    }

    default: {
      // Exhaustiveness guard — every variant of `ProductEventKind`
      // must map to a case above. Forward-compat fallback for an
      // unknown future kind is to refetch the broad slice the new
      // event most plausibly touches.
      const _exhaustive: never = kind;
      void _exhaustive;
      qc.invalidateQueries({ queryKey: productKey(productId) });
      qc.invalidateQueries({ queryKey: productQAKey(productId) });
      qc.invalidateQueries({
        queryKey: productCollaborationsKey(productId),
      });
      return;
    }
  }
}

/* ---------- helpers ---------- */

function patchProduct(
  qc: QueryClient,
  productId: string,
  fn: (product: Product) => Product,
): void {
  qc.setQueryData<Product>(productKey(productId), (current) => {
    if (!current) return current;
    return fn(current);
  });
}

function appendRole(
  qc: QueryClient,
  productId: string,
  role: Role,
): void {
  qc.setQueryData<Role[]>(productRolesKey(productId), (current) => {
    if (!current) return current;
    if (current.some((r) => r.id === role.id)) return current;
    return [...current, role].sort(byPositionThenCreatedAt);
  });
}

function replaceRole(
  qc: QueryClient,
  productId: string,
  role: Role,
): void {
  qc.setQueryData<Role[]>(productRolesKey(productId), (current) => {
    if (!current) return current;
    let found = false;
    const next = current.map((r) => {
      if (r.id !== role.id) return r;
      found = true;
      return role;
    });
    if (!found) return current;
    return next.sort(byPositionThenCreatedAt);
  });
}

function dropRole(
  qc: QueryClient,
  productId: string,
  roleId: string,
): void {
  qc.setQueryData<Role[]>(productRolesKey(productId), (current) => {
    if (!current) return current;
    return current.filter((r) => r.id !== roleId);
  });
}

function patchCollaborationGrantsForRole(
  qc: QueryClient,
  productId: string,
  role: Role,
): void {
  qc.setQueryData<Collaboration[]>(
    productCollaborationsKey(productId),
    (current) => {
      if (!current) return current;
      let touched = false;
      const next = current.map((collab) => {
        let grantsTouched = false;
        const grants = collab.grants.map((g) => {
          if (g.roleId !== role.id) return g;
          if (g.roleName === role.name) return g;
          grantsTouched = true;
          return { ...g, roleName: role.name };
        });
        if (!grantsTouched) return collab;
        touched = true;
        return { ...collab, grants };
      });
      return touched ? next : current;
    },
  );
}

function currentUserHoldsRole(
  qc: QueryClient,
  productId: string,
  currentUserId: string,
  roleId: string,
): boolean {
  const collabs = qc.getQueryData<Collaboration[]>(
    productCollaborationsKey(productId),
  );
  if (!collabs) return false;
  for (const c of collabs) {
    if (c.status !== 'active') continue;
    if (c.collaborator?.id !== currentUserId) continue;
    if (c.grants.some((g) => g.roleId === roleId)) return true;
  }
  return false;
}

function byPositionThenCreatedAt(a: Role, b: Role): number {
  if (a.position !== b.position) return a.position - b.position;
  return a.createdAt.localeCompare(b.createdAt);
}

function parseTagsPayload(
  payload: Record<string, unknown>,
): Tag[] | null {
  const raw = payload['tags'];
  if (!Array.isArray(raw)) return null;
  const tags: Tag[] = [];
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) return null;
    const obj = item as Record<string, unknown>;
    const oid = obj['oid'];
    const name = obj['name'];
    const color = obj['color'];
    if (
      typeof oid !== 'string' ||
      typeof name !== 'string' ||
      typeof color !== 'string'
    ) {
      return null;
    }
    tags.push({ id: oid, name, color });
  }
  return tags;
}

function parseRolePayload(
  payload: Record<string, unknown>,
): Role | null {
  const oid = strField(payload, 'oid');
  const productId = strField(payload, 'product_id');
  const name = strField(payload, 'name');
  const position = numField(payload, 'position');
  const createdAt = strField(payload, 'created_at');
  const updatedAt = strField(payload, 'updated_at');
  if (
    !oid ||
    !productId ||
    !name ||
    position === undefined ||
    !createdAt ||
    !updatedAt
  ) {
    return null;
  }
  const rawDescription = payload['description'];
  const description =
    typeof rawDescription === 'string' ? rawDescription : null;
  const rawCreatedBy = payload['created_by'];
  const createdBy = typeof rawCreatedBy === 'string' ? rawCreatedBy : null;
  const rawPermissions = payload['permissions'];
  const permissions = Array.isArray(rawPermissions)
    ? (rawPermissions.filter(isPermission) as Permission[])
    : [];
  return {
    id: oid,
    productId,
    name,
    description,
    position,
    permissions,
    createdBy,
    createdAt,
    updatedAt,
  };
}

const PERMISSION_SET: ReadonlySet<string> = new Set(PERMISSIONS);
function isPermission(value: unknown): value is Permission {
  return typeof value === 'string' && PERMISSION_SET.has(value);
}

function patchQAList(
  qc: QueryClient,
  productId: string,
  fn: (entries: ProductQA[]) => ProductQA[],
): void {
  qc.setQueryData<ProductQA[]>(productQAKey(productId), (current) => {
    if (!current) return current;
    return fn(current);
  });
}

function strField(
  payload: Record<string, unknown>,
  key: string,
): string | undefined {
  const v = payload[key];
  return typeof v === 'string' ? v : undefined;
}

function affectsCurrentUser(
  payload: Record<string, unknown>,
  currentUserId: string,
): boolean {
  // `collaborator_id` is present on every collaboration_* event whose
  // affected row carries one (always for `*_accepted`, for `*_invited`
  // by-user, and for `*_revoked`/`*_grants_updated` post-acceptance).
  // by-email invites that haven't been accepted yet have no
  // `collaborator_id`, so they cannot match the current user — those
  // skip the permissions invalidation correctly via this guard.
  return strField(payload, 'collaborator_id') === currentUserId;
}

function numField(
  payload: Record<string, unknown>,
  key: string,
): number | undefined {
  const v = payload[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}
