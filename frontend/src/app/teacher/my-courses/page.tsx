'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import type { Course, Assignment, Submission } from '@/types';
import { BookOpen, Calendar, ChevronRight, ClipboardList, FileText, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState, List, ListItem, LoadingState, PageHeader, Section } from '@/components/ui/page';
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
    return <LoadingState />;
  }

  const activeCourse = courses.find((c) => c.course_id === selectedCourse);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Teaching"
        title="My courses"
        description="Manage your assigned courses, lectures and assignments."
        actions={
          <Button onClick={() => router.push('/add-lecture')}>
            <Plus className="h-4 w-4" />
            Add lecture
          </Button>
        }
      />

      {courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No assigned courses"
          description="Courses assigned to you will appear here."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="min-w-0 space-y-3 lg:col-span-1">
            <p className="eyebrow">Assigned courses · {courses.length}</p>
            <List>
              {courses.map((course) => (
                <ListItem
                  key={course.course_id}
                  onClick={() => setSelectedCourse(course.course_id)}
                  active={selectedCourse === course.course_id}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium text-foreground">{course.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{course.code}</p>
                  </div>
                  <ChevronRight
                    className={`h-4 w-4 shrink-0 ${selectedCourse === course.course_id ? 'text-primary' : 'text-muted-foreground'}`}
                    strokeWidth={1.75}
                  />
                </ListItem>
              ))}
            </List>
          </div>

          <div className="min-w-0 space-y-6 lg:col-span-2">
            {selectedCourse && (
              <>
                <Card>
                  <CardContent className="space-y-5 p-6">
                    <div className="min-w-0">
                      {activeCourse?.code && <p className="eyebrow mb-1">{activeCourse.code}</p>}
                      <h2 className="text-xl font-semibold tracking-tight text-foreground">
                        {activeCourse?.title || 'Course management'}
                      </h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/course/${selectedCourse}`)}
                      >
                        <BookOpen className="h-4 w-4" strokeWidth={1.75} />
                        View course details
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => router.push('/add-lecture')}>
                        <Plus className="h-4 w-4" strokeWidth={1.75} />
                        Add lecture
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/teacher/students?courseId=${selectedCourse}`)}
                      >
                        <Users className="h-4 w-4" strokeWidth={1.75} />
                        View students
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Section title={`Assignments (${assignments.length})`}>
                  {assignments.length === 0 ? (
                    <EmptyState
                      icon={ClipboardList}
                      title="No assignments yet"
                      description="Assignments for this course will appear here."
                    />
                  ) : (
                    <List>
                      {assignments.map((assignment) => (
                        <ListItem
                          key={assignment.assignment_id}
                          className="flex-col items-stretch sm:flex-row sm:items-center"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-[15px] font-medium text-foreground">{assignment.title}</p>
                            {assignment.description && (
                              <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                                {assignment.description}
                              </p>
                            )}
                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              {assignment.due_date && (
                                <span className="inline-flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5" strokeWidth={1.75} />
                                  Due {new Date(assignment.due_date).toLocaleString()}
                                </span>
                              )}
                              <span className="inline-flex items-center gap-1 tabular-nums">
                                <FileText className="h-3.5 w-3.5" strokeWidth={1.75} />
                                {submissions[assignment.assignment_id]?.length || 0} submissions
                              </span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="self-start sm:self-auto"
                            onClick={() =>
                              router.push(
                                `/teacher/assignments/${assignment.assignment_id}?courseId=${selectedCourse}`,
                              )
                            }
                          >
                            View submissions
                          </Button>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Section>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
