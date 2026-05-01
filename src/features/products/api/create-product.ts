'use server';

import { apiFetch } from '@/shared/api/client';

import type { CreateProductInput } from '../model/create-product';

export type CreateProductResult =
  | { ok: true; productId: string }
  | { ok: false; reason: 'unauthorized' | 'network' | 'unknown'; message?: string }
  | { ok: false; reason: 'validation'; field?: string; message: string };

type CreatedProductSchemaResponse = {
  oid: string;
};

const WEBINAR_DEFAULT_TOTAL_LESSONS = 1;
const WEBINAR_DEFAULT_DURATION_MINUTES = 60;
const WEBINAR_DEFAULT_ALLOW_RECORDING = true;

export async function createProductAction(
  values: CreateProductInput,
): Promise<CreateProductResult> {
  const formData = new FormData();
  formData.append('name', values.title);
  if (values.description && values.description.trim().length > 0) {
    formData.append('description_html', toDescriptionHtml(values.description));
  }
  if (typeof values.hours === 'number' && Number.isFinite(values.hours)) {
    formData.append('total_duration_in_hours', String(values.hours));
  }

  let path: string;
  if (values.type === 'course') {
    path = '/products/courses';
  } else {
    path = '/products/webinars';
    formData.append('total_lessons', String(WEBINAR_DEFAULT_TOTAL_LESSONS));
    formData.append(
      'default_duration_minutes',
      String(WEBINAR_DEFAULT_DURATION_MINUTES),
    );
    formData.append(
      'allow_recording',
      String(WEBINAR_DEFAULT_ALLOW_RECORDING),
    );
  }

  let res: Response;
  try {
    res = await apiFetch(path, { method: 'POST', body: formData });
  } catch {
    return { ok: false, reason: 'network' };
  }

  if (res.status === 201) {
    const raw = (await res.json()) as CreatedProductSchemaResponse;
    return { ok: true, productId: raw.oid };
  }
  if (res.status === 401) return { ok: false, reason: 'unauthorized' };
  if (res.status === 422) {
    const body = await safeJson(res);
    const field = typeof body?.field === 'string' ? body.field : undefined;
    const code = typeof body?.error === 'string' ? body.error : 'validation';
    return { ok: false, reason: 'validation', field, message: code };
  }
  return { ok: false, reason: 'unknown' };
}

async function safeJson(res: Response): Promise<Record<string, unknown> | null> {
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function toDescriptionHtml(plain: string): string {
  const escaped = escapeHtml(plain.trim());
  const paragraphs = escaped
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
    .join('');
  return paragraphs;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
