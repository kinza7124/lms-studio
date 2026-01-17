'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Course } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthGuard } from '@/hooks/useAuthGuard';

type EligibleTeacher = {
  teacher_id: number;
  full_name: string;
  email: string;
  department?: string;
};

export default function AssignTeacherPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [eligibleTeachers, setEligibleTeachers] = useState<EligibleTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ teacherId: '', term: '', section: '01' });
  useAuthGuard();

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      loadEligibleTeachers();
    }
  }, [selectedCourse]);

  const loadCourses = async () => {
    try {
      const { data } = await api.get<Course[]>('/courses');
      setCourses(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadEligibleTeachers = async () => {
    if (!selectedCourse) return;
    try {
      const { data } = await api.get<EligibleTeacher[]>(`/teaching-assignments/course/${selectedCourse}/eligible`);
      setEligibleTeachers(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) {
      alert('Please select a course');
      return;
    }

    try {
      await api.post('/teaching-assignments/force-assign', {
        courseId: selectedCourse,
        teacherId: form.teacherId,
        term: form.term,
        section: form.section,
      });
      alert('Teacher assigned successfully');
      setForm({ teacherId: '', term: '', section: '01' });
      loadEligibleTeachers();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to assign teacher');
    }
  };

  if (loading) {
    return <div className="p-4 md:p-6 lg:p-8 text-white">Loading...</div>;
  }

  return (
    <div className="space-y-3 md:space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-white">Assign Teacher to Course</h1>
        <p className="mt-2 text-muted-foreground">
          View eligible teachers (those with matching skills) and assign them to courses. You can also force-assign teachers who don't meet all requirements.
        </p>
      </div>

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
        <>
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white">
                Eligible Teachers ({eligibleTeachers.length})
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                These teachers have all the required skills for this course.
              </p>
            </CardHeader>
            <CardContent>
              {eligibleTeachers.length === 0 ? (
                <p className="text-muted-foreground">
                  No eligible teachers found. Make sure the course has required skills assigned, and teachers have added those skills to their profile.
                </p>
              ) : (
                <div className="space-y-2">
                  {eligibleTeachers.map((teacher) => (
                    <div
                      key={teacher.teacher_id}
                      className="flex items-center justify-between rounded-lg border border-white/10 p-3"
                    >
                      <div>
                        <p className="font-medium text-white">{teacher.full_name}</p>
                        <p className="text-sm text-muted-foreground">{teacher.email}</p>
                        {teacher.department && (
                          <p className="text-sm text-muted-foreground">Department: {teacher.department}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setForm({ ...form, teacherId: teacher.teacher_id.toString() })}
                      >
                        Select
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white">Assign Teacher</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAssign} className="space-y-4">
                <div>
                  <Label htmlFor="teacherId">Teacher ID</Label>
                  <Input
                    id="teacherId"
                    value={form.teacherId}
                    onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
                    placeholder="Select a teacher above or enter ID"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="term">Term</Label>
                  <Input
                    id="term"
                    value={form.term}
                    onChange={(e) => setForm({ ...form, term: e.target.value })}
                    placeholder="e.g., 2025-SPRING"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="section">Section</Label>
                  <Input
                    id="section"
                    value={form.section}
                    onChange={(e) => setForm({ ...form, section: e.target.value })}
                    placeholder="01"
                  />
                </div>
                <Button type="submit">Assign Teacher</Button>
              </form>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

