import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

import { cn } from '@/ui/lib/cn';

interface PanelProps<T extends ElementType> {
  as?: T;
  className?: string;
  children: ReactNode;
}

type PanelComponentProps<T extends ElementType> = PanelProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof PanelProps<T>>;

export function Panel<T extends ElementType = 'section'>({
  as,
  children,
  className,
  ...props
}: PanelComponentProps<T>) {
  const Component = as ?? 'section';

  return (
    <Component
      className={cn(
        'rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
