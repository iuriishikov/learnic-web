import type {
  ActorRef,
  CollaborationSnapshot,
  ProductRef,
} from '../model/types';

import { NotificationRevokeAction } from '../components/notification-revoke-action';

import {
  type ActorRaw,
  type CollaborationRaw,
  type ProductRaw,
  toActor,
  toCollaboration,
  toProduct,
} from './shared';
import type { KindDescriptor } from './types';

export type InviteAcceptedRaw = {
  type: 'invite_accepted';
  collaboration_id: string;
  product: ProductRaw;
  collaborator: ActorRaw;
  collaboration: CollaborationRaw | null;
  viewer_can_manage_collaborators?: boolean;
};

export type InviteAcceptedDetails = {
  type: 'invite_accepted';
  collaborationId: string;
  product: ProductRef;
  collaborator: ActorRef;
  collaboration: CollaborationSnapshot | null;
  /**
   * True when the recipient currently holds
   * `MANAGE_COLLABORATORS` on the product. Drives the visibility
   * of the Revoke CTA.
   */
  viewerCanManageCollaborators: boolean;
};

export const inviteAcceptedDescriptor: KindDescriptor<
  InviteAcceptedRaw,
  InviteAcceptedDetails
> = {
  leadKey: 'inviteAccepted',
  parseRaw: (raw) => ({
    type: 'invite_accepted',
    collaborationId: raw.collaboration_id,
    product: toProduct(raw.product),
    collaborator: toActor(raw.collaborator),
    collaboration: toCollaboration(raw.collaboration),
    viewerCanManageCollaborators:
      raw.viewer_can_manage_collaborators ?? false,
  }),
  getFallbackActor: (details) => details.collaborator,
  Action: ({ details, onResolved }) => (
    <NotificationRevokeAction
      collaborationId={details.collaborationId}
      collaboration={details.collaboration}
      canManage={details.viewerCanManageCollaborators}
      onResolved={onResolved}
    />
  ),
};
