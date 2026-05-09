'use client';

import type { ReactNode } from 'react';

import type { Notifier } from '@/shared/lib/notify';

import type { AuthResult } from '../model/types';

type RunUploadParams = {
  notify: Notifier;
  title: ReactNode;
  description?: ReactNode;
  successTitle: string;
  errorTitle: string;
  run: () => Promise<AuthResult>;
};

/**
 * Drive an upload through `notify.progress(...)` so the user sees a
 * toast with a progress bar from start to finish. We can't observe the
 * real upload bytes (the call goes through a Server Action that doesn't
 * expose progress events), so the bar animates linearly toward ~92% and
 * then jumps to 100% on completion. The toast either resolves into a
 * success message or is replaced with an error one.
 */
export async function runUploadWithProgressToast({
  notify,
  title,
  description,
  successTitle,
  errorTitle,
  run,
}: RunUploadParams): Promise<AuthResult> {
  const handle = notify.progress({
    title,
    description,
    value: 5,
    label: '5%',
  });

  let value = 5;
  const tick = setInterval(() => {
    if (value >= 92) return;
    value = Math.min(92, value + Math.max(2, Math.round((100 - value) * 0.12)));
    handle.update({ value, label: `${value}%` });
  }, 220);

  try {
    const result = await run();
    clearInterval(tick);
    if (result.ok) {
      handle.update({ value: 100, label: '100%' });
      handle.finish({ tone: 'success', title: successTitle, duration: 3500 });
    } else {
      handle.finish({ tone: 'error', title: errorTitle, duration: 5000 });
    }
    return result;
  } catch (error) {
    clearInterval(tick);
    handle.finish({ tone: 'error', title: errorTitle, duration: 5000 });
    throw error;
  }
}
