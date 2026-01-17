'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Course } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    return <div className="p-4 md:p-6 lg:p-8 text-white">Loading...</div>;
  }

  return (
    <div className="space-y-3 md:space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 md:gap-3 lg:gap-4">
        <h1 className="text-2xl sm:text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-white">Enrollment Management</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={selectedCourse || ''}
            onChange={(e) => setSelectedCourse(Number(e.target.value) || null)}
            className="flex-1 sm:flex-none rounded border border-white/20 bg-white/5 px-3 sm:px-4 py-2 text-white text-sm sm:text-base min-w-[200px]"
          >
            <option value="">All Enrollments</option>
            {courses.map((course) => (
              <option key={course.course_id} value={course.course_id}>
                {course.code} - {course.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedCourse ? (
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">
              Enrollments for Selected Course ({enrollments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {enrollments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No enrollments found for this course.</p>
              ) : (
                enrollments.map((enrollment) => (
                  <div
                    key={enrollment.enrollment_id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-3 lg:gap-4 rounded-lg border border-white/10 p-4"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-white">{enrollment.student_name}</p>
                      <p className="text-sm text-muted-foreground">{enrollment.student_email}</p>
                      <p className="text-sm text-muted-foreground">Term: {enrollment.term}</p>
                    </div>
                    <div className="flex items-center gap-2">
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
                        className="w-20"
                        maxLength={2}
                      />
                      <Button
                        size="sm"
                        onClick={() =>
                          handleUpdateGrade(enrollment.enrollment_id, enrollment.student_id)
                        }
                      >
                        Update Grade
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">
              All Enrollments ({allEnrollments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {allEnrollments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No enrollments found.</p>
              ) : (
                allEnrollments.map((enrollment) => (
                  <div
                    key={enrollment.enrollment_id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-3 lg:gap-4 rounded-lg border border-white/10 p-4"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-white">{enrollment.student_name}</p>
                      <p className="text-sm text-muted-foreground">{enrollment.student_email}</p>
                      <p className="text-sm text-white mt-1">
                        <span className="font-semibold">{enrollment.code}</span> - {enrollment.course_title || enrollment.title}
                      </p>
                      <p className="text-sm text-muted-foreground">Term: {enrollment.term}</p>
                      {enrollment.grade && (
                        <p className="text-sm text-muted-foreground">Grade: <span className="text-white font-semibold">{enrollment.grade}</span></p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
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
                        className="w-20"
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
                        Update Grade
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

