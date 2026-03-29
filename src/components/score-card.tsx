interface ScoreCardProps {
  label: string;
  score: number;
  detail: string;
}

function getTone(score: number) {
  if (score >= 82) {
    return 'good';
  }

  if (score >= 65) {
    return 'warn';
  }

  return 'alert';
}

export function ScoreCard({ label, score, detail }: ScoreCardProps) {
  return (
    <article className={`score-card score-${getTone(score)}`}>
      <p className="score-label">{label}</p>
      <strong className="score-value">{score}</strong>
      <p className="score-detail">{detail}</p>
    </article>
  );
}
