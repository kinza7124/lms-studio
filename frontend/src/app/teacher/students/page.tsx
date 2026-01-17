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
};

export default function TeacherStudentsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradeForm, setGradeForm] = useState<{ [key: number]: { term: string; grade: string } }>({});
  useAuthGuard();

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      loadEnrollments();
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

  const loadEnrollments = async () => {
    if (!selectedCourse) return;
    try {
      const { data } = await api.get<Enrollment[]>(`/courses/${selectedCourse}/enrollments`);
      setEnrollments(data);
      const formData: { [key: number]: { term: string; grade: string } } = {};
      data.forEach((enrollment) => {
        formData[enrollment.enrollment_id] = {
          term: enrollment.term,
          grade: enrollment.grade || '',
        };
      });
      setGradeForm(formData);
    } catch (error) {
      console.error(error);
    }
  };

  const handleGradeUpdate = async (enrollmentId: number, studentId: number) => {
    if (!selectedCourse) return;
    const form = gradeForm[enrollmentId];
    if (!form.grade) {
      alert('Please enter a grade');
      return;
    }

    try {
      await api.put(`/courses/${selectedCourse}/grade`, {
        studentId,
        term: form.term,
        grade: form.grade,
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
      <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-white">Student Management</h1>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">Select Course</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={selectedCourse || ''}
            onChange={(e) => setSelectedCourse(Number(e.target.value))}
            className="w-full rounded border border-white/20 bg-white/5 px-4 py-2 text-white"
          >
            <option value="">Select a course</option>
            {courses.map((course) => (
              <option key={course.course_id} value={course.course_id}>
                {course.code} - {course.title}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {selectedCourse && (
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Enrolled Students ({enrollments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {enrollments.map((enrollment) => (
                <div
                  key={enrollment.enrollment_id}
                  className="flex items-center justify-between rounded-lg border border-white/10 p-4"
                >
                  <div>
                    <p className="font-medium text-white">{enrollment.student_name}</p>
                    <p className="text-sm text-muted-foreground">{enrollment.student_email}</p>
                    {enrollment.major && (
                      <p className="text-sm text-muted-foreground">Major: {enrollment.major}</p>
                    )}
                    <p className="text-sm text-muted-foreground">Term: {enrollment.term}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      placeholder="Grade"
                      value={gradeForm[enrollment.enrollment_id]?.grade || ''}
                      onChange={(e) =>
                        setGradeForm({
                          ...gradeForm,
                          [enrollment.enrollment_id]: {
                            ...gradeForm[enrollment.enrollment_id],
                            grade: e.target.value.toUpperCase(),
                          },
                        })
                      }
                      className="w-20"
                      maxLength={2}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleGradeUpdate(enrollment.enrollment_id, enrollment.student_id)}
                    >
                      Update
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

