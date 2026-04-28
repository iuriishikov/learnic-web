'use client';

import { useState } from 'react';

import { UserAvatar } from '@/features/auth';
import { Button } from '@/shared/ui/button';

const SLOW_AVATAR = '/api/test-slow-image?delay=8000';

export function LoadingDemo() {
  const [reloadKey, setReloadKey] = useState(0);
  const [mounted, setMounted] = useState(false);

  return (
    <div className="flex items-center gap-6">
      {mounted ? (
        <UserAvatar
          key={reloadKey}
          user={{
            oid: 'slow',
            firstName: 'Lana',
            lastName: 'Steiner',
            avatarUrl: `${SLOW_AVATAR}&_=${reloadKey}`,
          }}
          size="lg"
        />
      ) : (
        <div className="size-10" aria-hidden />
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          setMounted(true);
          setReloadKey((k) => k + 1);
        }}
      >
        {mounted ? 'Перезапустить загрузку' : 'Запустить медленную загрузку'}
      </Button>
      <p className="text-sm text-muted-foreground">
        После клика рендерим аватарку со src, отдающим картинку через 8 секунд —
        пока она грузится, виден Skeleton (animate-pulse) той же формы.
      </p>
    </div>
  );
}
