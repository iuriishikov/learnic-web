'use server';

import { apiFetch } from '@/shared/api/client';

import {
  mapMutationStatus,
  safeJson,
  type MutationResult,
} from './_shared';

export async function changeProductNameAction(args: {
  productId: string;
  value: string;
}): Promise<MutationResult> {
  let res: Response;
  try {
    res = await apiFetch(`/products/${encodeURIComponent(args.productId)}/name`, {
      method: 'PATCH',
      body: { value: args.value },
    });
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (res.status === 422 || res.status === 409) {
    const body = await safeJson(res);
    const message = typeof body?.error === 'string' ? body.error : undefined;
    return {
      ok: false,
      reason: res.status === 409 ? 'conflict' : 'validation',
      message,
    };
  }
  return mapMutationStatus(res.status) ?? { ok: false, reason: 'unknown' };
}

export async function changeProductDescriptionAction(args: {
  productId: string;
  value: string;
}): Promise<MutationResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/products/${encodeURIComponent(args.productId)}/description`,
      { method: 'PATCH', body: { value: args.value } },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  return mapMutationStatus(res.status) ?? { ok: false, reason: 'unknown' };
}

export async function changeProductDurationAction(args: {
  productId: string;
  value: number;
}): Promise<MutationResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/products/${encodeURIComponent(args.productId)}/duration`,
      { method: 'PATCH', body: { value: args.value } },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  return mapMutationStatus(res.status) ?? { ok: false, reason: 'unknown' };
}

export async function archiveProductAction(args: {
  productId: string;
}): Promise<MutationResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/products/${encodeURIComponent(args.productId)}/archive`,
      { method: 'POST' },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  return mapMutationStatus(res.status) ?? { ok: false, reason: 'unknown' };
}

export async function unarchiveProductAction(args: {
  productId: string;
}): Promise<MutationResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/products/${encodeURIComponent(args.productId)}/unarchive`,
      { method: 'POST' },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  return mapMutationStatus(res.status) ?? { ok: false, reason: 'unknown' };
}

export async function publishProductAction(args: {
  productId: string;
}): Promise<MutationResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/products/${encodeURIComponent(args.productId)}/publish`,
      { method: 'POST' },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  return mapMutationStatus(res.status) ?? { ok: false, reason: 'unknown' };
}

export type SetProductCoverResult =
  | { ok: true; fileId: string }
  | {
      ok: false;
      reason:
        | 'unauthorized'
        | 'forbidden'
        | 'not-found'
        | 'validation'
        | 'too-large'
        | 'network'
        | 'unknown';
      message?: string;
    };

export async function setProductCoverAction(
  productId: string,
  formData: FormData,
): Promise<SetProductCoverResult> {
  let res: Response;
  try {
    res = await apiFetch(`/products/${encodeURIComponent(productId)}/cover`, {
      method: 'POST',
      body: formData,
    });
  } catch {
    return { ok: false, reason: 'network' };
  }

  if (res.status === 201) {
    const body = (await res.json()) as { oid: string };
    return { ok: true, fileId: body.oid };
  }
  if (res.status === 401) return { ok: false, reason: 'unauthorized' };
  if (res.status === 403) return { ok: false, reason: 'forbidden' };
  if (res.status === 404) return { ok: false, reason: 'not-found' };
  if (res.status === 422) {
    const body = await safeJson(res);
    const code = typeof body?.error === 'string' ? body.error : undefined;
    if (code === 'FileTooLarge') {
      return { ok: false, reason: 'too-large', message: code };
    }
    return { ok: false, reason: 'validation', message: code };
  }
  return { ok: false, reason: 'unknown' };
}

export async function removeProductCoverAction(args: {
  productId: string;
}): Promise<MutationResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/products/${encodeURIComponent(args.productId)}/cover`,
      { method: 'DELETE' },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  return mapMutationStatus(res.status) ?? { ok: false, reason: 'unknown' };
}

export async function deleteProductAction(args: {
  productId: string;
}): Promise<MutationResult> {
  let res: Response;
  try {
    res = await apiFetch(`/products/${encodeURIComponent(args.productId)}`, {
      method: 'DELETE',
    });
  } catch {
    return { ok: false, reason: 'network' };
  }
  return mapMutationStatus(res.status) ?? { ok: false, reason: 'unknown' };
}
