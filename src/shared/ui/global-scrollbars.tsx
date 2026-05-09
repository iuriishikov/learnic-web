'use client';

import { useEffect } from 'react';
import { useOverlayScrollbars } from 'overlayscrollbars-react';

export function GlobalScrollbars() {
  const [initialize, instance] = useOverlayScrollbars({
    options: {
      scrollbars: {
        theme: 'os-theme-app',
        autoHide: 'leave',
        autoHideDelay: 500,
      },
    },
    defer: true,
  });

  useEffect(() => {
    initialize(document.body);
    return () => instance()?.destroy();
  }, [initialize, instance]);

  return null;
}
