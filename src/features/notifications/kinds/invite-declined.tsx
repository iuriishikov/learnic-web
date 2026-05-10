import type {
  ActorRef,
  CollaborationSnapshot,
  ProductRef,
} from '../model/types';

import { NotificationReinviteAction } from '../components/notification-reinvite-action';

import {
  type ActorRaw,
  type CollaborationRaw,
  type ProductRaw,
  toActor,
  toCollaboration,
  toProduct,
} from './shared';
import type { KindDescriptor } from './types';

export type InviteDeclinedRaw = {
  type: 'invite_declined';
  collaboration_id: string;
  product: ProductRaw;
  decliner: ActorRaw;
  collaboration: CollaborationRaw | null;
};

export type InviteDeclinedDetails = {
  type: 'invite_declined';
  collaborationId: string;
  product: ProductRef;
  decliner: ActorRef;
  collaboration: CollaborationSnapshot | null;
};

export const inviteDeclinedDescriptor: KindDescriptor<
  InviteDeclinedRaw,
  InviteDeclinedDetails
> = {
  leadKey: 'inviteDeclined',
  parseRaw: (raw) => ({
    type: 'invite_declined',
    collaborationId: raw.collaboration_id,
    product: toProduct(raw.product),
    decliner: toActor(raw.decliner),
    collaboration: toCollaboration(raw.collaboration),
  }),
  getFallbackActor: (details) => details.decliner,
  Action: ({ details, onResolved }) => (
    <NotificationReinviteAction
      collaborationId={details.collaborationId}
      productId={details.product.oid}
      onResolved={onResolved}
    />
  ),
};
