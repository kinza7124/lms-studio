'use client';

import { useEffect, useState } from 'react';
import { UserCheck } from 'lucide-react';
import api from '@/lib/api';
import type { Course } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, EmptyState, Field, List, ListItem, LoadingState, PageHeader, Section, Select } from '@/components/ui/page';
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
    return <LoadingState />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin"
        title="Assign teacher"
        description="See which teachers have the skills a course requires and assign them. You can also force-assign a teacher who doesn't meet every requirement."
      />

      <Field label="Course" htmlFor="course" className="max-w-md">
        <Select
          id="course"
          value={selectedCourse || ''}
          onChange={(e) => setSelectedCourse(Number(e.target.value))}
        >
          <option value="">Select a course</option>
          {courses.map((course) => (
            <option key={course.course_id} value={course.course_id}>
              {course.code} - {course.title}
            </option>
          ))}
        </Select>
      </Field>

      {selectedCourse && (
        <div className="grid items-start gap-6 lg:grid-cols-5">
          <Section
            className="lg:col-span-3"
            title="Eligible teachers"
            description={`${eligibleTeachers.length} with all required skills for this course`}
          >
            {eligibleTeachers.length === 0 ? (
              <EmptyState
                icon={UserCheck}
                title="No eligible teachers"
                description="Make sure the course has required skills assigned, and teachers have added those skills to their profile."
              />
            ) : (
              <List>
                {eligibleTeachers.map((teacher) => {
                  const isSelected = form.teacherId === teacher.teacher_id.toString();
                  return (
                    <ListItem key={teacher.teacher_id} active={isSelected}>
                      <Avatar name={teacher.full_name} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{teacher.full_name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {teacher.email}
                          {teacher.department && ` · ${teacher.department}`}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={isSelected ? 'default' : 'outline'}
                        onClick={() => setForm({ ...form, teacherId: teacher.teacher_id.toString() })}
                      >
                        {isSelected ? 'Selected' : 'Select'}
                      </Button>
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Section>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-[17px]">Assignment</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <form onSubmit={handleAssign} className="space-y-5">
                <Field label="Teacher ID" htmlFor="teacherId" hint="Select a teacher from the list or enter an ID.">
                  <Input
                    id="teacherId"
                    value={form.teacherId}
                    onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
                    placeholder="Teacher ID"
                    required
                  />
                </Field>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <Field label="Term" htmlFor="term">
                    <Input
                      id="term"
                      value={form.term}
                      onChange={(e) => setForm({ ...form, term: e.target.value })}
                      placeholder="e.g. 2025-SPRING"
                      required
                    />
                  </Field>
                  <Field label="Section" htmlFor="section">
                    <Input
                      id="section"
                      value={form.section}
                      onChange={(e) => setForm({ ...form, section: e.target.value })}
                      placeholder="01"
                    />
                  </Field>
                </div>
                <div className="flex justify-end pt-1">
                  <Button type="submit">Assign teacher</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
