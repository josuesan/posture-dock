import type { TimelinePoint } from '@/domain/session-history/types';
import { messages } from '@/translations';
import { Badge } from '@/ui/components/ui/badge';
import { Panel } from '@/ui/components/ui/panel';

function buildPath(points: Array<{ x: number; y: number }>) {
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
}

interface SessionTimelineChartProps {
  timeline: TimelinePoint[];
}

export function SessionTimelineChart({
  timeline
}: SessionTimelineChartProps) {
  if (timeline.length === 0) {
    return null;
  }

  const width = 880;
  const height = 240;
  const padding = 30;
  const totalElapsed = timeline.at(-1)?.elapsedMs ?? 1;
  const leanMax = Math.max(...timeline.map((point) => point.leanDeg), 1);
  const headMax = Math.max(...timeline.map((point) => point.headForwardCm), 1);
  const issueMax = Math.max(...timeline.map((point) => point.issueCount), 1);
  const leanPoints = timeline.map((point) => ({
    x: padding + (point.elapsedMs / totalElapsed) * (width - padding * 2),
    y: height - padding - (point.leanDeg / leanMax) * (height - padding * 2)
  }));
  const headPoints = timeline.map((point) => ({
    x: padding + (point.elapsedMs / totalElapsed) * (width - padding * 2),
    y: height - padding - (point.headForwardCm / headMax) * (height - padding * 2)
  }));
  const issuePoints = timeline.map((point) => ({
    x: padding + (point.elapsedMs / totalElapsed) * (width - padding * 2),
    y: height - padding - (point.issueCount / issueMax) * (height - padding * 2)
  }));

  return (
    <Panel className="space-y-4 bg-white/[0.03] p-4 shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <strong className="text-sm font-semibold text-ink">
          {messages.charts.timeline.title}
        </strong>
        <div className="flex flex-wrap gap-2">
          <Badge tone="good">{messages.charts.timeline.lean}</Badge>
          <Badge tone="warn">{messages.charts.timeline.head}</Badge>
          <Badge tone="alert">{messages.charts.timeline.alerts}</Badge>
        </div>
      </div>
      <svg className="w-full" viewBox={`0 0 ${width} ${height}`}>
        <path
          d={`M ${padding} ${padding} H ${width - padding}`}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
        />
        <path
          d={`M ${padding} ${height / 2} H ${width - padding}`}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
        />
        <path
          d={`M ${padding} ${height - padding} H ${width - padding}`}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
        />
        <path
          d={buildPath(leanPoints)}
          fill="none"
          stroke="rgba(109,199,182,0.95)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
        />
        <path
          d={buildPath(headPoints)}
          fill="none"
          stroke="rgba(255,187,92,0.95)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
        />
        <path
          d={buildPath(issuePoints)}
          fill="none"
          stroke="rgba(255,125,121,0.95)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
        />
      </svg>
    </Panel>
  );
}
