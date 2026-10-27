'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Course } from '@/types';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, EmptyState, List, ListItem, LoadingState, PageHeader, Section, Select } from '@/components/ui/page';
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
    return <LoadingState />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Teaching"
        title="Students"
        description="Review enrolled students and record final grades."
        actions={
          <Select
            aria-label="Select course"
            value={selectedCourse || ''}
            onChange={(e) => setSelectedCourse(Number(e.target.value))}
            className="h-10 sm:w-72"
          >
            <option value="">Select a course</option>
            {courses.map((course) => (
              <option key={course.course_id} value={course.course_id}>
                {course.code} - {course.title}
              </option>
            ))}
          </Select>
        }
      />

      {selectedCourse && (
        <Section title={`Enrolled students (${enrollments.length})`}>
          {enrollments.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No students enrolled"
              description="Students enrolled in this course will appear here."
            />
          ) : (
            <List>
              {enrollments.map((enrollment) => (
                <ListItem
                  key={enrollment.enrollment_id}
                  className="flex-col items-stretch sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar name={enrollment.student_name} />
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-medium text-foreground">{enrollment.student_name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {enrollment.student_email}
                        {enrollment.major && ` · ${enrollment.major}`}
                        {` · ${enrollment.term}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pl-12 sm:pl-0">
                    <Input
                      type="text"
                      aria-label="Grade"
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
                      className="h-9 w-20 text-center"
                      maxLength={2}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGradeUpdate(enrollment.enrollment_id, enrollment.student_id)}
                    >
                      Update
                    </Button>
                  </div>
                </ListItem>
              ))}
            </List>
          )}
        </Section>
      )}
    </div>
  );
}
