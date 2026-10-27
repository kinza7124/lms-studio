'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import type { Enrollment, GPA } from '@/types';
import { Badge, EmptyState, List, ListItem, LoadingState, PageHeader, Section, StatGrid, type BadgeTone } from '@/components/ui/page';
import { ChevronRight, GraduationCap } from 'lucide-react';
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

  const gradeTone = (grade?: string): BadgeTone => {
    if (!grade) return 'neutral';
    if (grade === 'A') return 'success';
    if (grade === 'B') return 'primary';
    if (grade === 'C' || grade === 'D') return 'warning';
    if (grade === 'F') return 'danger';
    return 'neutral';
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-10">
      <PageHeader
        title="Grades and GPA"
        description="Your overall standing and per-course results."
        className="mb-0 md:mb-0"
      />

      {gpa && (
        <StatGrid
          items={[
            { label: 'Overall GPA', value: gpa.gpa.toFixed(2) },
            { label: 'Courses', value: gpa.coursesCount },
            { label: 'Credits', value: gpa.totalCredits },
          ]}
        />
      )}

      <Section title="Course grades" description="Select a course to view detailed evaluations.">
        {enrollments.length === 0 ? (
          <EmptyState icon={GraduationCap} title="No courses yet" description="Grades appear once you enroll in courses." />
        ) : (
          <List>
            {enrollments.map((enrollment) => (
              <ListItem
                key={enrollment.enrollment_id}
                onClick={() => router.push(`/grades/${enrollment.course_id}`)}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium text-foreground">
                    {enrollment.code} · {enrollment.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Term {enrollment.term}</p>
                </div>
                <Badge tone={gradeTone((enrollment as any).grade)} className="tabular-nums">
                  {(enrollment as any).grade || 'N/A'}
                </Badge>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
              </ListItem>
            ))}
          </List>
        )}
      </Section>
    </div>
  );
}
