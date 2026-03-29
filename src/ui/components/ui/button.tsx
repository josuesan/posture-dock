import type { ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/ui/lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-full border text-sm font-medium transition duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sand-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-ocean-950 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'border-transparent bg-sand-400 px-4 py-2.5 text-ocean-950 shadow-[0_12px_30px_rgba(255,187,92,0.18)] hover:bg-sand-300',
        secondary:
          'border-white/12 bg-white/6 px-4 py-2.5 text-ink hover:border-white/20 hover:bg-white/10',
        subtle:
          'border-transparent bg-transparent px-3 py-2 text-mist hover:bg-white/5 hover:text-ink'
      },
      size: {
        default: 'min-h-11',
        sm: 'min-h-9 px-3 py-2 text-xs',
        lg: 'min-h-12 px-5 py-3 text-sm'
      }
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'default'
    }
  }
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({
  className,
  size,
  variant,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ className, size, variant }))}
      type={type}
      {...props}
    />
  );
}
