import { AppShell } from '@/components/app-shell';
import { PostureDashboard } from '@/ui/components/posture-dashboard';
import { Panel } from '@/ui/components/ui/panel';
import { messages } from '@/translations';

export default function HomePage() {
  return (
    <AppShell
      description={messages.page.description}
      eyebrow={messages.page.eyebrow}
      title={messages.page.title}
    >
      <section className="grid gap-4 lg:grid-cols-3">
        {messages.page.overviewCards.map((card) => (
          <Panel className="space-y-3" key={card.title}>
            <p className="text-[0.72rem] uppercase tracking-[0.2em] text-mist">
              {card.label}
            </p>
            <h2 className="font-display text-2xl font-semibold leading-tight text-ink">
              {card.title}
            </h2>
            <p className="text-sm leading-7 text-mist">{card.copy}</p>
          </Panel>
        ))}
      </section>

      <PostureDashboard />
    </AppShell>
  );
}
