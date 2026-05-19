import { toApiFile, type FileResponse } from '@/shared/types/user';

import type { UserExperience } from '../model/types';

export type UserExperienceSchemaResponse = {
  oid: string;
  user_id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  source_url: string | null;
  icon: FileResponse | null;
};

export function fromUserExperienceSchema(
  raw: UserExperienceSchemaResponse,
): UserExperience {
  return {
    id: raw.oid,
    userId: raw.user_id,
    title: raw.title,
    description: raw.description,
    startDate: raw.start_date,
    endDate: raw.end_date,
    sourceUrl: raw.source_url,
    icon: raw.icon !== null ? toApiFile(raw.icon) : null,
  };
}

export type MutationResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | 'unauthorized'
        | 'forbidden'
        | 'not-found'
        | 'conflict'
        | 'validation'
        | 'network'
        | 'unknown';
      message?: string;
    };

export type CreatedResult =
  | { ok: true; id: string }
  | {
      ok: false;
      reason:
        | 'unauthorized'
        | 'forbidden'
        | 'not-found'
        | 'conflict'
        | 'validation'
        | 'network'
        | 'unknown';
      message?: string;
    };

export function mapMutationStatus(status: number): MutationResult | null {
  if (status === 204 || (status >= 200 && status < 300)) return { ok: true };
  if (status === 401) return { ok: false, reason: 'unauthorized' };
  if (status === 403) return { ok: false, reason: 'forbidden' };
  if (status === 404) return { ok: false, reason: 'not-found' };
  if (status === 409) return { ok: false, reason: 'conflict' };
  if (status === 422) return { ok: false, reason: 'validation' };
  return { ok: false, reason: 'unknown' };
}

export async function safeJson(
  res: Response,
): Promise<Record<string, unknown> | null> {
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}
