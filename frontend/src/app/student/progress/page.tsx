'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState, LoadingState, PageHeader, Section, StatGrid } from '@/components/ui/page';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { BookOpen, CheckCircle, ChevronRight, Clock, TrendingUp } from 'lucide-react';

type Progress = {
  progress_id: number;
  course_id: number;
  course_title: string;
  course_code: string;
  assignments_completed: number;
  assignments_total: number;
  quizzes_completed: number;
  quizzes_total: number;
  assessments_completed: number;
  assessments_total: number;
  average_score: number | null;
  last_updated: string;
};

export default function ProgressPage() {
  const router = useRouter();
  const [progress, setProgress] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);
  useAuthGuard();

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const { data } = await api.get('/progress');
      setProgress(data || []);
    } catch (error) {
      console.error('Failed to load progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCompletionPercentage = (completed: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  const getOverallProgress = () => {
    if (progress.length === 0) return 0;
    const total = progress.reduce((sum, p) => {
      const assignments = getCompletionPercentage(p.assignments_completed, p.assignments_total);
      const quizzes = getCompletionPercentage(p.quizzes_completed, p.quizzes_total);
      const assessments = getCompletionPercentage(p.assessments_completed, p.assessments_total);
      return sum + (assignments + quizzes + assessments) / 3;
    }, 0);
    return Math.round(total / progress.length);
  };

  const getAverageScore = () => {
    const scores = progress.filter(p => p.average_score !== null).map(p => p.average_score!);
    if (scores.length === 0) return null;
    const sum = scores.reduce((a, b) => a + b, 0);
    return Math.round((sum / scores.length) * 100) / 100;
  };

  if (loading) {
    return <LoadingState />;
  }

  const overallProgress = getOverallProgress();
  const averageScore = getAverageScore();

  const Meter = ({ value }: { value: number }) => (
    <span className="block h-1.5 overflow-hidden rounded-full bg-secondary">
      <span className="block h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${value}%` }} />
    </span>
  );

  return (
    <div className="space-y-10">
      <PageHeader
        title="My progress"
        description="Track your learning progress across all courses."
        className="mb-0 md:mb-0"
      />

      <StatGrid
        items={[
          {
            label: 'Overall progress',
            value: `${overallProgress}%`,
            hint: (
              <span className="mt-2 block">
                <Meter value={overallProgress} />
              </span>
            ),
          },
          {
            label: 'Average score',
            value: averageScore !== null ? `${averageScore}%` : 'N/A',
            hint:
              averageScore !== null
                ? `Across ${progress.filter(p => p.average_score !== null).length} courses`
                : undefined,
          },
          { label: 'Active courses', value: progress.length, hint: 'Enrolled courses' },
        ]}
      />

      <Section title="Course progress">
        {progress.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="No progress data available"
            description="Enroll in courses to see your progress."
          />
        ) : (
          <div className="space-y-4">
            {progress.map((p) => {
              const assignmentsProgress = getCompletionPercentage(p.assignments_completed, p.assignments_total);
              const quizzesProgress = getCompletionPercentage(p.quizzes_completed, p.quizzes_total);
              const assessmentsProgress = getCompletionPercentage(p.assessments_completed, p.assessments_total);
              const courseProgress = Math.round((assignmentsProgress + quizzesProgress + assessmentsProgress) / 3);

              const breakdown = [
                { label: 'Assignments', icon: CheckCircle, done: p.assignments_completed, total: p.assignments_total, value: assignmentsProgress },
                { label: 'Quizzes', icon: Clock, done: p.quizzes_completed, total: p.quizzes_total, value: quizzesProgress },
                { label: 'Assessments', icon: BookOpen, done: p.assessments_completed, total: p.assessments_total, value: assessmentsProgress },
              ];

              return (
                <Card
                  key={p.progress_id}
                  className="card-hover cursor-pointer"
                  onClick={() => router.push(`/course/${p.course_id}`)}
                >
                  <CardContent className="space-y-5 p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs font-medium tracking-wide text-muted-foreground">{p.course_code}</p>
                        <h3 className="mt-1 truncate text-[17px] font-semibold tracking-tight text-foreground">
                          {p.course_title}
                        </h3>
                      </div>
                      <div className="flex shrink-0 items-center gap-1 text-right">
                        <span className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">
                          {courseProgress}%
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                      </div>
                    </div>

                    <Meter value={courseProgress} />

                    <div className="grid gap-4 sm:grid-cols-3">
                      {breakdown.map((b) => (
                        <div key={b.label} className="rounded-xl bg-secondary/60 p-4">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <b.icon className="h-4 w-4" strokeWidth={1.75} />
                              {b.label}
                            </span>
                            <span className="text-xs font-medium tabular-nums text-foreground">
                              {b.done}/{b.total}
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-card">
                            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${b.value}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {p.average_score !== null && (
                      <p className="text-sm text-muted-foreground">
                        Average score{' '}
                        <span className="font-semibold tabular-nums text-foreground">{p.average_score}%</span>
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}
