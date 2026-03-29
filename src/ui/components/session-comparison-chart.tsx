import type { SavedSessionRecord } from '@/domain/session-history/types';
import { messages } from '@/translations';
import { Panel } from '@/ui/components/ui/panel';

function buildPath(points: Array<{ x: number; y: number }>) {
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
}

interface SessionComparisonChartProps {
  records: SavedSessionRecord[];
}

export function SessionComparisonChart({
  records
}: SessionComparisonChartProps) {
  if (records.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/12 bg-white/[0.03] p-5 text-center">
        <strong className="block text-sm text-ink">
          {messages.charts.comparison.emptyTitle}
        </strong>
        <p className="mt-2 text-sm leading-7 text-mist">
          {messages.charts.comparison.emptyCopy}
        </p>
      </div>
    );
  }

  const width = 720;
  const height = 220;
  const padding = 28;
  const ordered = [...records].slice(0, 8).reverse();
  const points = ordered.map((record, index) => {
    const x =
      padding +
      (index / Math.max(ordered.length - 1, 1)) * (width - padding * 2);
    const y =
      height -
      padding -
      (record.report.overallScore / 100) * (height - padding * 2);

    return {
      x,
      y,
      score: record.report.overallScore
    };
  });

  return (
    <Panel className="mt-5 space-y-4 bg-white/[0.03] p-4 shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <strong className="text-sm font-semibold text-ink">
          {messages.charts.comparison.title}
        </strong>
        <span className="text-sm text-mist">
          {messages.charts.comparison.recentSessions(ordered.length)}
        </span>
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
          d={buildPath(points)}
          fill="none"
          stroke="rgba(109,199,182,0.95)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
        />
        {points.map((point) => (
          <g key={`${point.x}-${point.y}`}>
            <circle
              cx={point.x}
              cy={point.y}
              fill="rgba(242,247,243,1)"
              r={5}
              stroke="rgba(109,199,182,0.95)"
              strokeWidth="3"
            />
            <text
              fill="rgba(242,247,243,1)"
              fontSize="14"
              textAnchor="middle"
              x={point.x}
              y={point.y - 12}
            >
              {point.score}
            </text>
          </g>
        ))}
      </svg>
    </Panel>
  );
}
