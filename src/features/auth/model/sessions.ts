export type SessionResponse = {
  id: string;
  created_at: string;
  last_used_at: string;
  expires_at: string;
  ip_address: string | null;
  user_agent: string | null;
  device_label: string | null;
  is_current: boolean;
};

export type ActiveSession = {
  id: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceLabel: string | null;
  isCurrent: boolean;
};

export function toActiveSession(raw: SessionResponse): ActiveSession {
  return {
    id: raw.id,
    createdAt: raw.created_at,
    lastUsedAt: raw.last_used_at,
    expiresAt: raw.expires_at,
    ipAddress: raw.ip_address,
    userAgent: raw.user_agent,
    deviceLabel: raw.device_label,
    isCurrent: raw.is_current,
  };
}
