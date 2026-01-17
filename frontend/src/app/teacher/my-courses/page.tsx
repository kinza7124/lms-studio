'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import type { Course, Assignment, Submission } from '@/types';
import { CourseCard } from '@/components/CourseCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export default function TeacherMyCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<{ [key: number]: Submission[] }>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  useAuthGuard();

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      loadCourseDetails();
    }
  }, [selectedCourse]);

  const loadCourses = async () => {
    try {
      const { data } = await api.get<{ courses: Course[] }>('/teachers/courses');
      setCourses(data.courses);
      if (data.courses.length > 0) {
        setSelectedCourse(data.courses[0].course_id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadCourseDetails = async () => {
    if (!selectedCourse) return;
    try {
      const [assignmentsRes] = await Promise.all([
        api.get<{ assignments: Assignment[] } | Assignment[]>(`/assignments/course/${selectedCourse}`),
      ]);
      const assignmentsData = Array.isArray(assignmentsRes.data)
        ? assignmentsRes.data
        : (assignmentsRes.data as any).assignments || [];
      setAssignments(assignmentsData);

      // Load submissions for each assignment
      const submissionsData: { [key: number]: Submission[] } = {};
      for (const assignment of assignmentsData) {
        try {
          const { data: subData } = await api.get<Submission[]>(
            `/submissions/assignment/${assignment.assignment_id}`,
          );
          submissionsData[assignment.assignment_id] = subData;
        } catch (error) {
          // Ignore if no submissions
        }
      }
      setSubmissions(submissionsData);
    } catch (error) {
      console.error(error);
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
            Manage your assigned courses, lectures, and assignments
          </p>
        </div>
        <Button onClick={() => router.push('/add-lecture')}>Add Lecture</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white">Assigned Courses ({courses.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {courses.map((course) => (
                <button
                  key={course.course_id}
                  onClick={() => setSelectedCourse(course.course_id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedCourse === course.course_id
                      ? 'border-purple-500 bg-purple-500/10 text-white'
                      : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10'
                  }`}
                >
                  <p className="font-medium">{course.code}</p>
                  <p className="text-sm">{course.title}</p>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-3 md:space-y-4 lg:space-y-6">
          {selectedCourse && (
            <>
              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle className="text-white">Course Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/course/${selectedCourse}`)}
                    >
                      View Course Details
                    </Button>
                    <Button variant="outline" onClick={() => router.push('/add-lecture')}>
                      Add Lecture
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/teacher/students?courseId=${selectedCourse}`)}
                    >
                      View Students
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle className="text-white">Assignments ({assignments.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment.assignment_id}
                      className="rounded-lg border border-white/10 p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{assignment.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {assignment.description}
                          </p>
                          {assignment.due_date && (
                            <p className="text-xs text-purple-300 mt-2">
                              Due: {new Date(assignment.due_date).toLocaleString()}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground mt-2">
                            Submissions: {submissions[assignment.assignment_id]?.length || 0}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/teacher/assignments/${assignment.assignment_id}?courseId=${selectedCourse}`,
                            )
                          }
                        >
                          View Submissions
                        </Button>
                      </div>
                    </div>
                  ))}
                  {assignments.length === 0 && (
                    <p className="text-muted-foreground">No assignments yet.</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

