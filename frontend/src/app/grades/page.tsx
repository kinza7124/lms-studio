'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import type { Enrollment, GPA } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export default function GradesPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [gpa, setGpa] = useState<GPA | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  useAuthGuard();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [enrollmentsRes, gpaRes] = await Promise.all([
        api.get<Enrollment[]>('/courses/user/me/enrollments'),
        api.get<GPA>('/courses/user/me/gpa'),
      ]);
      setEnrollments(enrollmentsRes.data);
      setGpa(gpaRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade?: string) => {
    if (!grade) return 'text-muted-foreground';
    if (grade === 'A') return 'text-green-400';
    if (grade === 'B') return 'text-blue-400';
    if (grade === 'C') return 'text-yellow-400';
    if (grade === 'D') return 'text-orange-400';
    if (grade === 'F') return 'text-red-400';
    return 'text-muted-foreground';
  };

  if (loading) {
    return <div className="p-4 md:p-6 lg:p-8 text-white">Loading...</div>;
  }

  return (
    <div className="space-y-3 md:space-y-4 lg:space-y-6">
      <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-white">Grades & GPA</h1>

      {gpa && (
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardDescription>Overall GPA</CardDescription>
            <CardTitle className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white">{gpa.gpa.toFixed(2)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Based on {gpa.coursesCount} course{gpa.coursesCount !== 1 ? 's' : ''} ({gpa.totalCredits} credits)
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">Course Grades</CardTitle>
          <CardDescription className="text-muted-foreground">
            Click on a course to view detailed evaluations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {enrollments.map((enrollment) => (
              <div
                key={enrollment.enrollment_id}
                onClick={() => router.push(`/grades/${enrollment.course_id}`)}
                className="flex items-center justify-between rounded-lg border border-white/10 p-4 cursor-pointer hover:bg-white/10 transition-colors"
              >
                <div>
                  <p className="font-medium text-white">{enrollment.code} - {enrollment.title}</p>
                  <p className="text-sm text-muted-foreground">Term: {enrollment.term}</p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${getGradeColor((enrollment as any).grade)}`}>
                    {(enrollment as any).grade || 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">View Details →</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

