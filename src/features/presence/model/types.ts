export type PresenceStatus = 'online' | 'offline';

export type PresenceState = PresenceStatus | 'unknown';

export type UserPresence = {
  userId: string;
  status: PresenceStatus;
};

export type UserPresenceResponse = {
  user_id: string;
  status: PresenceStatus;
};

export function toUserPresence(raw: UserPresenceResponse): UserPresence {
  return { userId: raw.user_id, status: raw.status };
}

export type PresenceSnapshotMessage = {
  type: 'snapshot';
  presences: UserPresenceResponse[];
};

export type PresenceDeltaMessage = {
  type: 'presence';
  user_id: string;
  status: PresenceStatus;
};

export type PresenceServerMessage =
  | PresenceSnapshotMessage
  | PresenceDeltaMessage;

export type PresenceClientMessage =
  | { type: 'subscribe'; user_ids: string[] }
  | { type: 'unsubscribe'; user_ids: string[] };
