'use client';

import { Alert, Badge, List, type BadgeTone } from '@/components/ui/page';
import type { PlagiarismReport } from '@/types';

interface PlagiarismReportProps {
  plagiarismScore?: number | null;
  plagiarismReport?: string | null;
  plagiarismChecked: boolean;
}

export function PlagiarismReportDisplay({ plagiarismScore, plagiarismReport, plagiarismChecked }: PlagiarismReportProps) {
  if (!plagiarismChecked) {
    return (
      <p className="text-sm text-muted-foreground">
        Plagiarism check not performed
      </p>
    );
  }

  if (plagiarismScore === null || plagiarismScore === undefined) {
    return (
      <Alert tone="warning">
        Plagiarism check completed, but score unavailable
      </Alert>
    );
  }

  let report: PlagiarismReport | null = null;
  try {
    if (plagiarismReport) {
      report = JSON.parse(plagiarismReport);
    }
  } catch (e) {
    console.error('Failed to parse plagiarism report:', e);
  }

  const getScoreTone = (score: number): BadgeTone => {
    if (score < 10) return 'success';
    if (score < 50) return 'warning';
    return 'danger';
  };

  const getMeterColor = (score: number) => {
    if (score < 10) return 'bg-green-500';
    if (score < 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const meterWidth = Math.max(0, Math.min(100, plagiarismScore));

  return (
    <div className="space-y-5 rounded-xl bg-secondary/60 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="text-[15px] font-semibold tracking-tight text-foreground">Plagiarism check</h4>
        <Badge tone={getScoreTone(plagiarismScore)}>
          {plagiarismScore < 10 ? 'Low risk' : plagiarismScore < 25 ? 'Moderate risk' : plagiarismScore < 50 ? 'High risk' : 'Very high risk'}
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm text-muted-foreground">Similarity score</span>
          <span className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">
            {plagiarismScore.toFixed(1)}%
          </span>
        </div>
        <div
          className="h-1.5 overflow-hidden rounded-full bg-card"
          role="meter"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={meterWidth}
          aria-label="Similarity score"
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ${getMeterColor(plagiarismScore)}`}
            style={{ width: `${meterWidth}%` }}
          />
        </div>
      </div>

      {report && report.sources && report.sources.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Matched sources</p>
          <List>
            {report.sources.map((source, index) => (
              <div key={index} className="px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 truncate text-sm text-primary hover:underline underline-offset-4"
                  >
                    {source.url}
                  </a>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {source.similarity.toFixed(1)}% match
                  </span>
                </div>
                {source.matchedText && (
                  <p className="mt-1.5 text-xs italic text-muted-foreground">
                    &ldquo;{source.matchedText}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </List>
        </div>
      )}

      {report && report.error && (
        <Alert tone="error">Error: {report.error}</Alert>
      )}

      <p className="text-xs text-muted-foreground">
        Checked at {report?.checkedAt ? new Date(report.checkedAt).toLocaleString() : 'Unknown'}
      </p>
    </div>
  );
}
