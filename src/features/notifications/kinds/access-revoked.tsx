import type { ActorRef, ProductRef } from '../model/types';

import {
  type ActorRaw,
  type ProductRaw,
  toActor,
  toProduct,
} from './shared';
import type { KindDescriptor } from './types';

export type AccessRevokedRaw = {
  type: 'access_revoked';
  collaboration_id: string;
  product: ProductRaw;
  revoker: ActorRaw;
};

export type AccessRevokedDetails = {
  type: 'access_revoked';
  collaborationId: string;
  product: ProductRef;
  revoker: ActorRef;
};

export const accessRevokedDescriptor: KindDescriptor<
  AccessRevokedRaw,
  AccessRevokedDetails
> = {
  leadKey: 'accessRevoked',
  parseRaw: (raw) => ({
    type: 'access_revoked',
    collaborationId: raw.collaboration_id,
    product: toProduct(raw.product),
    revoker: toActor(raw.revoker),
  }),
  // Recipient lost access — the actor is the revoker, but if the
  // top-level `notification.actor` is ever stripped (admin tools,
  // etc.) we fall back to the embedded revoker so the avatar still
  // resolves.
  getFallbackActor: (details) => details.revoker,
  // No `Action`: the recipient lost access, there is nothing to do
  // from the notification card itself.
};
