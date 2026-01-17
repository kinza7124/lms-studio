'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { BookOpen, CheckCircle, Clock, TrendingUp } from 'lucide-react';

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
    return <div className="p-4 md:p-6 lg:p-8 text-white">Loading...</div>;
  }

  const overallProgress = getOverallProgress();
  const averageScore = getAverageScore();

  return (
    <div className="space-y-3 md:space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-white">My Progress</h1>
        <p className="mt-2 text-muted-foreground">Track your learning progress across all courses</p>
      </div>

      {/* Overall Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-white/10 bg-white/5">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white">{overallProgress}%</div>
            <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
            <BookOpen className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white">
              {averageScore !== null ? `${averageScore}%` : 'N/A'}
            </div>
            {averageScore !== null && (
              <p className="text-xs text-muted-foreground mt-2">
                Across {progress.filter(p => p.average_score !== null).length} courses
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Courses</CardTitle>
            <CheckCircle className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white">{progress.length}</div>
            <p className="text-xs text-muted-foreground mt-2">Enrolled courses</p>
          </CardContent>
        </Card>
      </div>

      {/* Course Progress */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Course Progress</h2>
        {progress.length === 0 ? (
          <Card className="border-white/10 bg-white/5">
            <CardContent className="p-4 md:p-6 lg:p-8 text-center text-muted-foreground">
              No progress data available. Enroll in courses to see your progress.
            </CardContent>
          </Card>
        ) : (
          progress.map((p) => {
            const assignmentsProgress = getCompletionPercentage(p.assignments_completed, p.assignments_total);
            const quizzesProgress = getCompletionPercentage(p.quizzes_completed, p.quizzes_total);
            const assessmentsProgress = getCompletionPercentage(p.assessments_completed, p.assessments_total);
            const courseProgress = Math.round((assignmentsProgress + quizzesProgress + assessmentsProgress) / 3);

            return (
              <Card
                key={p.progress_id}
                className="border-white/10 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => router.push(`/course/${p.course_id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-white">{p.course_title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{p.course_code}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-400">{courseProgress}%</div>
                      <p className="text-xs text-muted-foreground">Complete</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Overall Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Overall Progress</span>
                      <span className="text-sm font-medium text-white">{courseProgress}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all"
                        style={{ width: `${courseProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Breakdown */}
                  <div className="grid grid-cols-3 gap-4 pt-2">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Assignments
                        </span>
                        <span className="text-xs font-medium text-white">
                          {p.assignments_completed}/{p.assignments_total}
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 transition-all"
                          style={{ width: `${assignmentsProgress}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Quizzes
                        </span>
                        <span className="text-xs font-medium text-white">
                          {p.quizzes_completed}/{p.quizzes_total}
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 transition-all"
                          style={{ width: `${quizzesProgress}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          Assessments
                        </span>
                        <span className="text-xs font-medium text-white">
                          {p.assessments_completed}/{p.assessments_total}
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-500 transition-all"
                          style={{ width: `${assessmentsProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {p.average_score !== null && (
                    <div className="pt-2 border-t border-white/10">
                      <p className="text-sm text-muted-foreground">
                        Average Score: <span className="text-white font-semibold">{p.average_score}%</span>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

