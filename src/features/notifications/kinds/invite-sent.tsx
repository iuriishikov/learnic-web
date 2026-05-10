import type {
  CollaborationSnapshot,
  ProductRef,
} from '../model/types';

import { NotificationInviteActions } from '../components/notification-invite-actions';

import {
  type CollaborationRaw,
  type ProductRaw,
  toCollaboration,
  toProduct,
} from './shared';
import type { KindDescriptor } from './types';

export type InviteSentRaw = {
  type: 'invite_sent';
  collaboration_id: string;
  product: ProductRaw;
  collaboration: CollaborationRaw | null;
};

export type InviteSentDetails = {
  type: 'invite_sent';
  collaborationId: string;
  product: ProductRef;
  collaboration: CollaborationSnapshot | null;
};

export const inviteSentDescriptor: KindDescriptor<
  InviteSentRaw,
  InviteSentDetails
> = {
  leadKey: 'inviteSent',
  parseRaw: (raw) => ({
    type: 'invite_sent',
    collaborationId: raw.collaboration_id,
    product: toProduct(raw.product),
    collaboration: toCollaboration(raw.collaboration),
  }),
  Action: ({ details, onResolved }) => (
    <NotificationInviteActions
      collaborationId={details.collaborationId}
      productId={details.product.oid}
      collaboration={details.collaboration}
      onResolved={onResolved}
    />
  ),
};
