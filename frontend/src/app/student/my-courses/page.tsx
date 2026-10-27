'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import type { Enrollment, Assignment, Submission } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge, EmptyState, LoadingState, PageHeader } from '@/components/ui/page';
import { ArrowRight, GraduationCap } from 'lucide-react';
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
    return <LoadingState />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="My courses"
        description="View your enrolled courses, lectures, and assignments."
        actions={
          <Button variant="outline" onClick={() => router.push('/courses')}>
            Browse courses
          </Button>
        }
        className="mb-0 md:mb-0"
      />

      {enrollments.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="You are not enrolled in any courses yet"
          description="Find a course in the catalog to get started."
          action={<Button onClick={() => router.push('/courses')}>Browse courses</Button>}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((enrollment) => (
            <button
              key={enrollment.enrollment_id}
              type="button"
              onClick={() => router.push(`/course/${enrollment.course_id}`)}
              className="group flex flex-col rounded-2xl border border-border/70 bg-card p-5 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow duration-300 hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate text-xs font-medium tracking-wide text-muted-foreground">
                  {enrollment.code}
                </span>
                {(enrollment as any).grade && (
                  <Badge tone="success" className="tabular-nums">
                    Grade {(enrollment as any).grade}
                  </Badge>
                )}
              </div>
              <h3 className="mt-1.5 text-[17px] font-semibold leading-snug tracking-tight text-foreground">
                {enrollment.title}
              </h3>
              {enrollment.description && (
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {enrollment.description}
                </p>
              )}
              <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                <span className="text-xs text-muted-foreground">Term {enrollment.term}</span>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Open course
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
