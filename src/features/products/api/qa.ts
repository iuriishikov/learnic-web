'use server';

import { apiFetch } from '@/shared/api/client';

import {
  type CreatedResult,
  type MutationResult,
  mapMutationStatus,
  safeJson,
} from './_shared';

type ProductQAResponse = {
  oid: string;
  product_id: string;
  question: string;
  answer: string;
  position: number;
};

export type ProductQA = {
  id: string;
  productId: string;
  question: string;
  answer: string;
  position: number;
};

function fromQAResponse(raw: ProductQAResponse): ProductQA {
  return {
    id: raw.oid,
    productId: raw.product_id,
    question: raw.question,
    answer: raw.answer,
    position: raw.position,
  };
}

export type GetProductQAListResult =
  | { ok: true; entries: ProductQA[] }
  | { ok: false; reason: 'network' | 'unknown' };

export async function getProductQAListAction(
  productId: string,
): Promise<GetProductQAListResult> {
  let res: Response;
  try {
    res = await apiFetch(`/products/${encodeURIComponent(productId)}/qa`, {
      method: 'GET',
    });
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (!res.ok) return { ok: false, reason: 'unknown' };
  const raw = (await res.json()) as ProductQAResponse[];
  return {
    ok: true,
    entries: raw.map(fromQAResponse).sort((a, b) => a.position - b.position),
  };
}

export async function addProductQAAction(args: {
  productId: string;
  question: string;
  answer: string;
  position: number;
}): Promise<CreatedResult> {
  let res: Response;
  try {
    res = await apiFetch(`/products/${encodeURIComponent(args.productId)}/qa`, {
      method: 'POST',
      body: {
        question: args.question,
        answer: args.answer,
        position: args.position,
      },
    });
  } catch {
    return { ok: false, reason: 'network' };
  }

  if (res.status === 201) {
    const body = (await res.json()) as { oid: string };
    return { ok: true, id: body.oid };
  }
  if (res.status === 401) return { ok: false, reason: 'unauthorized' };
  if (res.status === 403) return { ok: false, reason: 'forbidden' };
  if (res.status === 404) return { ok: false, reason: 'not-found' };
  if (res.status === 422) {
    const body = await safeJson(res);
    const message = typeof body?.error === 'string' ? body.error : undefined;
    return { ok: false, reason: 'validation', message };
  }
  return { ok: false, reason: 'unknown' };
}

export async function changeProductQAQuestionAction(args: {
  qaId: string;
  value: string;
}): Promise<MutationResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/product-qa/${encodeURIComponent(args.qaId)}/question`,
      { method: 'PATCH', body: { value: args.value } },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  return mapMutationStatus(res.status) ?? { ok: false, reason: 'unknown' };
}

export async function changeProductQAAnswerAction(args: {
  qaId: string;
  value: string;
}): Promise<MutationResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/product-qa/${encodeURIComponent(args.qaId)}/answer`,
      { method: 'PATCH', body: { value: args.value } },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  return mapMutationStatus(res.status) ?? { ok: false, reason: 'unknown' };
}

export async function deleteProductQAAction(args: {
  qaId: string;
}): Promise<MutationResult> {
  let res: Response;
  try {
    res = await apiFetch(`/product-qa/${encodeURIComponent(args.qaId)}`, {
      method: 'DELETE',
    });
  } catch {
    return { ok: false, reason: 'network' };
  }
  return mapMutationStatus(res.status) ?? { ok: false, reason: 'unknown' };
}

export async function reorderProductQAAction(args: {
  qaId: string;
  position: number;
}): Promise<MutationResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/product-qa/${encodeURIComponent(args.qaId)}/position`,
      { method: 'PATCH', body: { position: args.position } },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  return mapMutationStatus(res.status) ?? { ok: false, reason: 'unknown' };
}
