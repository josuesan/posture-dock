import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/ui/lib/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-3 py-1 text-[0.7rem] font-medium uppercase tracking-[0.18em]',
  {
    variants: {
      tone: {
        neutral: 'border-white/12 bg-white/6 text-mist',
        good: 'border-teal-300/20 bg-teal-300/10 text-teal-100',
        warn: 'border-sand-300/25 bg-sand-400/12 text-sand-100',
        alert: 'border-rose-300/25 bg-rose-400/12 text-rose-100',
        accent: 'border-lime-300/20 bg-lime-300/10 text-lime-100'
      }
    },
    defaultVariants: {
      tone: 'neutral'
    }
  }
);

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  className?: string;
  children: React.ReactNode;
}

export function Badge({ children, className, tone }: BadgeProps) {
  return <span className={cn(badgeVariants({ className, tone }))}>{children}</span>;
}
