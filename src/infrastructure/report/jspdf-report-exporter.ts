import type { SavedSessionRecord } from '@/domain/session-history/types';
import { messages } from '@/translations';

function formatTime(ms: number) {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}m ${seconds}s`;
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat(messages.locale, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(iso));
}

export async function downloadReportPdf(record: SavedSessionRecord) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4'
  });

  const margin = 48;
  const lineHeight = 18;
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxTextWidth = pageWidth - margin * 2;
  let cursorY = margin;

  const ensureSpace = (neededHeight = lineHeight) => {
    if (cursorY + neededHeight > pageHeight - margin) {
      doc.addPage();
      cursorY = margin;
    }
  };

  const writeLine = (
    text: string,
    options?: { size?: number; weight?: 'normal' | 'bold'; gapAfter?: number }
  ) => {
    const size = options?.size ?? 11;
    const weight = options?.weight ?? 'normal';
    const gapAfter = options?.gapAfter ?? 6;
    doc.setFont('helvetica', weight);
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, maxTextWidth) as string[];

    ensureSpace(lines.length * lineHeight + gapAfter);
    lines.forEach((line) => {
      doc.text(line, margin, cursorY);
      cursorY += lineHeight;
    });
    cursorY += gapAfter;
  };

  writeLine(messages.pdf.title, {
    size: 24,
    weight: 'bold',
    gapAfter: 12
  });
  writeLine(record.summary.title, {
    size: 14,
    weight: 'bold',
    gapAfter: 4
  });
  writeLine(
    messages.pdf.startedLine(
      formatDate(record.summary.startedAtIso),
      formatTime(record.summary.durationMs),
      record.source
    ),
    { gapAfter: 14 }
  );
  writeLine(
    messages.pdf.cameraLine(
      record.summary.settings.cameraLabel || messages.common.cameraDefault,
      record.report.alertCount,
      record.report.neutralPercent
    )
  );

  writeLine(messages.pdf.sections.scores, {
    size: 15,
    weight: 'bold',
    gapAfter: 6
  });
  writeLine(
    messages.pdf.scoresLine(
      record.report.overallScore,
      record.report.postureScore,
      record.report.stabilityScore,
      record.report.recoveryScore,
      record.report.focusScore
    )
  );

  writeLine(messages.pdf.sections.usefulStats, {
    size: 15,
    weight: 'bold',
    gapAfter: 6
  });
  record.report.usefulStats.forEach((stat) => {
    writeLine(`${stat.label}: ${stat.value}`);
  });

  writeLine(messages.pdf.sections.detectedIssues, {
    size: 15,
    weight: 'bold',
    gapAfter: 6
  });
  record.report.issueBreakdown.forEach((issue) => {
    writeLine(
      messages.pdf.issueLine(
        issue.label,
        issue.affectedPercent,
        issue.averageExcess,
        issue.severity
      )
    );
  });

  writeLine(messages.pdf.sections.recommendations, {
    size: 15,
    weight: 'bold',
    gapAfter: 6
  });
  record.report.recommendations.forEach((recommendation) => {
    writeLine(
      messages.pdf.recommendationLine(
        recommendation.title,
        recommendation.severity,
        recommendation.detail
      )
    );
  });

  doc.save(messages.pdf.fileName(record.summary.id));
}
