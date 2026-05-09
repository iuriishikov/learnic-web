'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      position="bottom-right"
      offset={20}
      gap={10}
      visibleToasts={5}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'w-[min(calc(100vw-2rem),22rem)] sm:w-[22rem] data-[swiping=true]:transition-none',
        },
      }}
      style={
        {
          '--width': '22rem',
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
