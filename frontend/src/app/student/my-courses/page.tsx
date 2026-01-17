'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import type { Enrollment, Assignment, Submission } from '@/types';
import { CourseCard } from '@/components/CourseCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthGuard } from '@/hooks/useAuthGuard';

type CourseWithDetails = {
  course_id: number;
  code: string;
  title: string;
  description?: string;
  credits?: number;
  enrollments?: Enrollment[];
};

export default function StudentMyCoursesPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  useAuthGuard();

  useEffect(() => {
    loadEnrollments();
  }, []);

  const loadEnrollments = async () => {
    try {
      const { data } = await api.get<Enrollment[]>('/courses/user/me/enrollments');
      setEnrollments(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4 md:p-6 lg:p-8 text-white">Loading...</div>;
  }

  return (
    <div className="space-y-3 md:space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-white">My Courses</h1>
          <p className="mt-2 text-muted-foreground">
            View your enrolled courses, lectures, and assignments
          </p>
        </div>
      </div>

      {enrollments.length === 0 ? (
        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-4 md:p-6 lg:p-8 text-center">
            <p className="text-muted-foreground">You are not enrolled in any courses yet.</p>
            <button
              onClick={() => router.push('/courses')}
              className="mt-4 text-purple-400 hover:text-purple-300"
            >
              Browse Courses →
            </button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((enrollment) => (
            <Card
              key={enrollment.enrollment_id}
              className="border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors"
              onClick={() => router.push(`/course/${enrollment.course_id}`)}
            >
              <CardHeader>
                <CardTitle className="text-white">{enrollment.code}</CardTitle>
                <p className="text-lg font-semibold text-white mt-2">{enrollment.title}</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">{enrollment.description}</p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-muted-foreground">Term: {enrollment.term}</span>
                  {(enrollment as any).grade && (
                    <span className="text-sm font-semibold text-green-400">
                      Grade: {(enrollment as any).grade}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

