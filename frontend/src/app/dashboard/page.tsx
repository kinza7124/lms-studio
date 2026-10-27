'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import api from '@/lib/api';
import type { Course, Enrollment } from '@/types';
import { CourseCard } from '@/components/CourseCard';
import { TeacherProfile } from '@/components/TeacherProfile';
import { Button } from '@/components/ui/button';
import { Alert, EmptyState, LoadingState, PageHeader, Section, StatGrid } from '@/components/ui/page';
import { ArrowRight, BookOpen, GraduationCap, TrendingUp } from 'lucide-react';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export default function DashboardPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [teacherCourses, setTeacherCourses] = useState<Course[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  useAuthGuard();

  useEffect(() => {
    const loadData = async () => {
      try {
        setError('');
        const { data: userData } = await api.get('/auth/profile');
        setUser(userData.user);

        if (userData.user.role === 'admin') {
          // Admin dashboard - redirect to admin panel
          router.push('/admin');
          return;
        } else if (userData.user.role === 'teacher') {
          const [{ data: courseData }, { data: myCourses }] = await Promise.all([
            api.get<Course[]>('/courses'),
            api.get<{ courses: Course[] }>('/teachers/courses'),
          ]);
          setCourses(courseData);
          setTeacherCourses(myCourses.courses);
        } else {
          const [{ data: courseData }, { data: enrollmentData }] = await Promise.all([
            api.get<Course[]>('/courses'),
            api.get<Enrollment[]>('/courses/user/me/enrollments'),
          ]);
          setCourses(courseData);
          setEnrollments(enrollmentData);
        }
      } catch (err) {
        console.error(err);
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          setError('Session expired. Redirecting you to login…');
          setTimeout(() => router.push('/login'), 1200);
        } else {
          setError('Unable to load dashboard data. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [router]);

  const firstName = user?.full_name ? user.full_name.split(' ')[0] : '';
  const enrolledIds = new Set(enrollments.map((e) => e.course_id));
  const myCourses: Course[] = enrollments.map(
    (e) => courses.find((c) => c.course_id === e.course_id) || e,
  );
  const goToCourse = (id: number) => router.push(`/course/${id}`);

  if (loading && !user) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow={user?.role === 'teacher' ? 'Teacher' : user?.role === 'admin' ? 'Admin' : 'Student'}
        title={`Welcome back${firstName ? `, ${firstName}` : ''}`}
        description={
          user?.role === 'teacher'
            ? 'Manage your courses, assignments, and profile.'
            : user?.role === 'admin'
            ? 'Manage the entire LMS system.'
            : 'Pick up where you left off.'
        }
        actions={
          user?.role === 'student' ? (
            <>
              <Button variant="outline" onClick={() => router.push('/student/progress')}>
                <TrendingUp className="h-4 w-4" />
                View progress
              </Button>
              <Button onClick={() => router.push('/courses')}>Browse courses</Button>
            </>
          ) : undefined
        }
        className="mb-0 md:mb-0"
      />

      {error && <Alert tone="error">{error}</Alert>}

      {user?.role === 'teacher' && (
        <>
          <StatGrid
            items={[
              { label: 'Assigned courses', value: teacherCourses.length },
              { label: 'Courses in catalog', value: courses.length },
            ]}
          />

          <Section title="My assigned courses" description="Courses you are teaching this term.">
            {teacherCourses.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No courses assigned yet"
                description="Courses assigned to you by an administrator will appear here."
              />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {teacherCourses.map((course) => (
                  <CourseCard key={course.course_id} course={course} onView={goToCourse} ctaLabel="Manage course" />
                ))}
              </div>
            )}
          </Section>

          <Section title="Profile" description="Your department and bio, visible to students.">
            <TeacherProfile />
          </Section>
        </>
      )}

      {user?.role === 'student' && (
        <>
          <StatGrid
            items={[
              { label: 'Enrolled courses', value: enrollments.length },
              { label: 'Available courses', value: courses.length },
              {
                label: 'Not yet enrolled',
                value: courses.filter((c) => !enrolledIds.has(c.course_id)).length,
              },
            ]}
          />

          <Section
            title="Continue learning"
            actions={
              enrollments.length > 0 ? (
                <Button variant="ghost" size="sm" onClick={() => router.push('/student/my-courses')}>
                  See all
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : undefined
            }
          >
            {myCourses.length === 0 ? (
              <EmptyState
                icon={GraduationCap}
                title="You are not enrolled in any courses yet"
                description="Browse the catalog to find something that interests you."
                action={<Button onClick={() => router.push('/courses')}>Browse courses</Button>}
              />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {myCourses.map((course) => (
                  <CourseCard key={course.course_id} course={course} onView={goToCourse} ctaLabel="Continue" />
                ))}
              </div>
            )}
          </Section>
        </>
      )}

      {user?.role !== 'admin' && (
        <Section
          title="All courses"
          actions={
            <span className="text-sm tabular-nums text-muted-foreground">
              {courses.length} course{courses.length === 1 ? '' : 's'}
            </span>
          }
        >
          {loading ? (
            <LoadingState label="Loading courses…" />
          ) : courses.length === 0 ? (
            <EmptyState icon={BookOpen} title="No courses yet" description="New courses will show up here." />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <CourseCard key={course.course_id} course={course} onView={goToCourse} />
              ))}
            </div>
          )}
        </Section>
      )}
    </div>
  );
}
