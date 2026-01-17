'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PlagiarismReport } from '@/types';

interface PlagiarismReportProps {
  plagiarismScore?: number | null;
  plagiarismReport?: string | null;
  plagiarismChecked: boolean;
}

export function PlagiarismReportDisplay({ plagiarismScore, plagiarismReport, plagiarismChecked }: PlagiarismReportProps) {
  if (!plagiarismChecked) {
    return (
      <div className="text-sm text-muted-foreground">
        Plagiarism check not performed
      </div>
    );
  }

  if (plagiarismScore === null || plagiarismScore === undefined) {
    return (
      <div className="text-sm text-yellow-400">
        Plagiarism check completed, but score unavailable
      </div>
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

  const getScoreColor = (score: number) => {
    if (score < 10) return 'text-green-400';
    if (score < 25) return 'text-yellow-400';
    if (score < 50) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score < 10) return 'bg-green-500/20 border-green-400/30 text-green-200';
    if (score < 25) return 'bg-yellow-500/20 border-yellow-400/30 text-yellow-200';
    if (score < 50) return 'bg-orange-500/20 border-orange-400/30 text-orange-200';
    return 'bg-red-500/20 border-red-400/30 text-red-200';
  };

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader>
        <CardTitle className="text-white text-lg">Plagiarism Check Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Similarity Score:</span>
          <span className={`text-2xl font-bold ${getScoreColor(plagiarismScore)}`}>
            {plagiarismScore.toFixed(1)}%
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getScoreBadgeColor(plagiarismScore)}`}>
            {plagiarismScore < 10 ? 'Low Risk' : plagiarismScore < 25 ? 'Moderate Risk' : plagiarismScore < 50 ? 'High Risk' : 'Very High Risk'}
          </span>
        </div>

        {report && report.sources && report.sources.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-white mb-2">Matched Sources:</h4>
            <div className="space-y-2">
              {report.sources.map((source, index) => (
                <div key={index} className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between mb-1">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-purple-400 hover:text-purple-300 truncate max-w-[70%]"
                    >
                      {source.url}
                    </a>
                    <span className="text-xs text-muted-foreground">
                      {source.similarity.toFixed(1)}% match
                    </span>
                  </div>
                  {source.matchedText && (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      "{source.matchedText}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {report && report.error && (
          <div className="text-sm text-red-400">
            Error: {report.error}
          </div>
        )}

        <div className="text-xs text-muted-foreground mt-4 pt-4 border-t border-white/10">
          Checked at: {report?.checkedAt ? new Date(report.checkedAt).toLocaleString() : 'Unknown'}
        </div>
      </CardContent>
    </Card>
  );
}

