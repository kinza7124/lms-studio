'use client';

import { useEffect, useState } from 'react';
import { GraduationCap } from 'lucide-react';
import api from '@/lib/api';
import type { Course } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, Badge, EmptyState, LoadingState, PageHeader, Section, Select } from '@/components/ui/page';
import { useAuthGuard } from '@/hooks/useAuthGuard';

type Enrollment = {
  enrollment_id: number;
  student_id: number;
  course_id: number;
  term: string;
  grade?: string;
  student_name: string;
  student_email: string;
  major?: string;
  enrollment_year?: number;
  code?: string;
  title?: string;
  course_title?: string;
};

export default function AdminEnrollmentsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [allEnrollments, setAllEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ studentId: '', courseId: '', term: '' });
  const [gradeForm, setGradeForm] = useState<{ [key: number]: string }>({});
  useAuthGuard();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      loadEnrollments();
    } else {
      loadAllEnrollments();
    }
  }, [selectedCourse]);

  const loadData = async () => {
    try {
      const [coursesRes] = await Promise.all([
        api.get<Course[]>('/courses'),
      ]);
      setCourses(coursesRes.data);
      loadAllEnrollments();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllEnrollments = async () => {
    try {
      const { data } = await api.get<Enrollment[]>('/admin/enrollments');
      setAllEnrollments(data);
      const gradeData: { [key: number]: string } = {};
      data.forEach((e) => {
        gradeData[e.enrollment_id] = e.grade || '';
      });
      setGradeForm(gradeData);
    } catch (error) {
      console.error(error);
      setAllEnrollments([]);
    }
  };

  const loadEnrollments = async () => {
    if (!selectedCourse) return;
    try {
      const { data } = await api.get<Enrollment[]>(`/courses/${selectedCourse}/enrollments`);
      setEnrollments(data);
      const gradeData: { [key: number]: string } = {};
      data.forEach((e) => {
        gradeData[e.enrollment_id] = e.grade || '';
      });
      setGradeForm(gradeData);
    } catch (error) {
      console.error(error);
    }
  };

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // This would need a new endpoint for admin to enroll students
      alert('Enrollment feature - needs backend endpoint');
    } catch (error) {
      console.error(error);
      alert('Failed to enroll student');
    }
  };

  const handleUpdateGrade = async (enrollmentId: number, studentId: number) => {
    if (!selectedCourse) return;
    const grade = gradeForm[enrollmentId];
    if (!grade) {
      alert('Please enter a grade');
      return;
    }

    try {
      await api.put(`/courses/${selectedCourse}/grade`, {
        studentId,
        term: enrollments.find((e) => e.enrollment_id === enrollmentId)?.term,
        grade,
      });
      alert('Grade updated successfully');
      loadEnrollments();
    } catch (error) {
      console.error(error);
      alert('Failed to update grade');
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin"
        title="Enrollments"
        description="Review student enrollments and record grades."
        actions={
          <Select
            value={selectedCourse || ''}
            onChange={(e) => setSelectedCourse(Number(e.target.value) || null)}
            className="w-full sm:w-72"
            aria-label="Filter by course"
          >
            <option value="">All enrollments</option>
            {courses.map((course) => (
              <option key={course.course_id} value={course.course_id}>
                {course.code} - {course.title}
              </option>
            ))}
          </Select>
        }
      />

      {selectedCourse ? (
        <Section title="Selected course" description={`${enrollments.length} enrollments`}>
          {enrollments.length === 0 ? (
            <EmptyState icon={GraduationCap} title="No enrollments for this course" />
          ) : (
            <Card className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Term</th>
                    <th className="text-right">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((enrollment) => (
                    <tr key={enrollment.enrollment_id}>
                      <td>
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar name={enrollment.student_name} />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">{enrollment.student_name}</p>
                            <p className="truncate text-xs text-muted-foreground">{enrollment.student_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap text-muted-foreground">{enrollment.term}</td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <Input
                            type="text"
                            placeholder="Grade"
                            value={gradeForm[enrollment.enrollment_id] || ''}
                            onChange={(e) =>
                              setGradeForm({
                                ...gradeForm,
                                [enrollment.enrollment_id]: e.target.value.toUpperCase(),
                              })
                            }
                            className="h-9 w-20 text-center"
                            maxLength={2}
                          />
                          <Button
                            size="sm"
                            onClick={() =>
                              handleUpdateGrade(enrollment.enrollment_id, enrollment.student_id)
                            }
                          >
                            Save
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </Section>
      ) : (
        <Section title="All enrollments" description={`${allEnrollments.length} enrollments`}>
          {allEnrollments.length === 0 ? (
            <EmptyState icon={GraduationCap} title="No enrollments found" />
          ) : (
            <Card className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Course</th>
                    <th>Term</th>
                    <th>Grade</th>
                    <th className="text-right">Update</th>
                  </tr>
                </thead>
                <tbody>
                  {allEnrollments.map((enrollment) => (
                    <tr key={enrollment.enrollment_id}>
                      <td>
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar name={enrollment.student_name} />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">{enrollment.student_name}</p>
                            <p className="truncate text-xs text-muted-foreground">{enrollment.student_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="min-w-[10rem]">
                        <p className="text-xs text-muted-foreground">{enrollment.code}</p>
                        <p className="text-foreground">{enrollment.course_title || enrollment.title}</p>
                      </td>
                      <td className="whitespace-nowrap text-muted-foreground">{enrollment.term}</td>
                      <td>
                        {enrollment.grade ? (
                          <Badge>{enrollment.grade}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <Input
                            type="text"
                            placeholder="Grade"
                            value={gradeForm[enrollment.enrollment_id] || ''}
                            onChange={(e) =>
                              setGradeForm({
                                ...gradeForm,
                                [enrollment.enrollment_id]: e.target.value.toUpperCase(),
                              })
                            }
                            className="h-9 w-20 text-center"
                            maxLength={2}
                          />
                          <Button
                            size="sm"
                            onClick={async () => {
                              const grade = gradeForm[enrollment.enrollment_id];
                              if (!grade) {
                                alert('Please enter a grade');
                                return;
                              }
                              try {
                                await api.put(`/courses/${enrollment.course_id}/grade`, {
                                  studentId: enrollment.student_id,
                                  term: enrollment.term,
                                  grade,
                                });
                                alert('Grade updated successfully');
                                loadAllEnrollments();
                              } catch (error) {
                                console.error(error);
                                alert('Failed to update grade');
                              }
                            }}
                          >
                            Save
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </Section>
      )}
    </div>
  );
}
