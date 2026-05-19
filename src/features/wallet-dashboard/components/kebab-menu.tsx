'use client';

import { MoreHorizontalIcon } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Menu, MenuContent, MenuTrigger } from '@/shared/ui/menu';

type KebabMenuProps = {
  ariaLabel: string;
  align?: 'start' | 'center' | 'end';
  children: React.ReactNode;
  className?: string;
};

export function KebabMenu({
  ariaLabel,
  align = 'end',
  children,
  className,
}: KebabMenuProps) {
  return (
    <Menu>
      <MenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={ariaLabel}
            className={cn(
              'size-7 -my-1 -mr-1 text-muted-foreground',
              className,
            )}
          >
            <MoreHorizontalIcon className="size-4" />
          </Button>
        }
      />
      <MenuContent align={align} size="sm" className="w-56">
        {children}
      </MenuContent>
    </Menu>
  );
}
