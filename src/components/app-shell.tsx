import type { PropsWithChildren, ReactNode } from 'react';

import { Badge } from '@/ui/components/ui/badge';
import { messages } from '@/translations';

interface AppShellProps extends PropsWithChildren {
  eyebrow: string;
  title: string;
  description: string;
  topbarExtra?: ReactNode;
}

export function AppShell({
  children,
  eyebrow,
  title,
  description,
  topbarExtra
}: AppShellProps) {
  return (
    <main className="relative overflow-hidden">
      <div className="pointer-events-none fixed -left-24 top-0 size-96 rounded-full bg-teal-400/12 blur-3xl" />
      <div className="pointer-events-none fixed right-0 top-48 size-[26rem] rounded-full bg-sand-400/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-[1.75rem] border border-white/10 bg-white/[0.035] px-5 py-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[0.72rem] uppercase tracking-[0.2em] text-mist">
              {messages.appShell.personalProject}
            </p>
            <p className="mt-1 font-display text-xl font-semibold text-ink">
              {messages.project.name}
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 sm:items-end">
            <Badge tone="accent">{messages.project.tagLine}</Badge>
            {topbarExtra}
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:items-end">
          <div className="space-y-4">
            <p className="text-[0.74rem] uppercase tracking-[0.24em] text-sand-300">
              {eyebrow}
            </p>
            <h1 className="max-w-[16ch] font-display text-4xl font-semibold leading-[0.98] text-ink sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <p className="max-w-3xl text-base leading-8 text-mist sm:text-lg">
              {description}
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.03] p-5 backdrop-blur-xl">
            <p className="text-[0.72rem] uppercase tracking-[0.2em] text-mist">
              {messages.appShell.focusLabel}
            </p>
            <p className="mt-3 font-display text-2xl font-semibold text-ink">
              {messages.appShell.focusTitle}
            </p>
            <p className="mt-3 text-sm leading-7 text-mist">
              {messages.appShell.focusCopy}
            </p>
          </div>
        </section>

        {children}
      </div>
    </main>
  );
}
