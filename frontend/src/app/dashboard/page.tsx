'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import api from '@/lib/api';
import type { Course, Enrollment } from '@/types';
import { CourseCard } from '@/components/CourseCard';
import { TeacherProfile } from '@/components/TeacherProfile';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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

  return (
    <section className="space-y-10">
      <div className="glass-panel flex flex-wrap items-center justify-between gap-6 border-white/15">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-purple-200/80">
            {user?.role === 'teacher' ? 'Teacher Dashboard' : user?.role === 'admin' ? 'Admin Dashboard' : 'Student Dashboard'}
          </p>
          <h1 className="mt-3 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-white">
            Welcome, {user?.full_name || 'User'}
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            {user?.role === 'teacher'
              ? 'Manage your courses, assignments, and profile.'
              : user?.role === 'admin'
              ? 'Manage the entire LMS system.'
              : 'Access your courses and track your progress.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {/* Course creation is only available to admins */}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
          {error}
        </div>
      )}

      {user?.role === 'teacher' && (
        <div className="space-y-3 md:space-y-4 lg:space-y-6">
          <TeacherProfile />

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">My Assigned Courses</h2>
            {teacherCourses.length === 0 ? (
              <p className="text-muted-foreground">No courses assigned yet.</p>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {teacherCourses.map((course) => (
                  <CourseCard
                    key={course.course_id}
                    course={course}
                    onView={(id) => router.push(`/course/${id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

          {user?.role === 'student' && (
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardDescription>Enrolled Courses</CardDescription>
                  <CardTitle className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-white">{enrollments.length}</CardTitle>
                </CardHeader>
              </Card>
              <Card 
                className="border-white/10 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => router.push('/student/progress')}
              >
                <CardHeader>
                  <CardDescription>View Progress</CardDescription>
                  <CardTitle className="text-lg text-white">Track Your Learning →</CardTitle>
                </CardHeader>
              </Card>
            </div>
          )}

      {user?.role !== 'admin' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-white">All Courses</h2>
            <span className="text-sm text-muted-foreground">
              {courses.length} course{courses.length === 1 ? '' : 's'}
            </span>
          </div>
          {loading ? (
            <p className="text-muted-foreground">Loading courses…</p>
          ) : courses.length === 0 ? (
            <p className="text-muted-foreground">No courses yet.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <CourseCard
                  key={course.course_id}
                  course={course}
                  onView={(id) => router.push(`/course/${id}`)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

