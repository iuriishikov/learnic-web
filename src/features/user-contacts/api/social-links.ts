'use server';

import { apiFetch } from '@/shared/api/client';

import type { SocialLink, SocialLinkDraft, SocialLinkKind } from '../model/types';

type SocialLinkResponse = {
  kind: SocialLinkKind;
  url: string;
  position: number;
};

export type ListSocialLinksResult =
  | { ok: true; entries: SocialLink[] }
  | { ok: false; reason: 'network' | 'unauthorized' | 'not-found' | 'unknown' };

export async function listSocialLinksAction(
  userId: string,
): Promise<ListSocialLinksResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/users/${encodeURIComponent(userId)}/social-links`,
      { method: 'GET' },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (res.status === 200) {
    const raw = (await res.json()) as SocialLinkResponse[];
    return {
      ok: true,
      entries: raw.map((r) => ({
        kind: r.kind,
        url: r.url,
        position: r.position,
      })),
    };
  }
  if (res.status === 401) return { ok: false, reason: 'unauthorized' };
  if (res.status === 404) return { ok: false, reason: 'not-found' };
  return { ok: false, reason: 'unknown' };
}

export type SetSocialLinksResult =
  | { ok: true }
  | {
      ok: false;
      reason: 'unauthorized' | 'validation' | 'network' | 'unknown';
      message?: string;
    };

export async function setSocialLinksAction(
  items: SocialLinkDraft[],
): Promise<SetSocialLinksResult> {
  let res: Response;
  try {
    res = await apiFetch('/users/me/social-links', {
      method: 'PUT',
      body: { items },
    });
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (res.status === 204) return { ok: true };
  if (res.status === 401) return { ok: false, reason: 'unauthorized' };
  if (res.status === 422) {
    try {
      const body = (await res.json()) as { error?: string };
      return { ok: false, reason: 'validation', message: body.error };
    } catch {
      return { ok: false, reason: 'validation' };
    }
  }
  return { ok: false, reason: 'unknown' };
}
