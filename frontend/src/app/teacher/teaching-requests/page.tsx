'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import type { TeachingAssignment, Course } from '@/types';
import { Button } from '@/components/ui/button';
import { Briefcase, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge, EmptyState, Field, List, ListItem, LoadingState, PageHeader, Section, Select, statusTone } from '@/components/ui/page';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export default function TeachingRequestsPage() {
  const [assignments, setAssignments] = useState<TeachingAssignment[]>([]);
  const [eligibleCourses, setEligibleCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ courseId: '', term: '', section: '01' });
  useAuthGuard();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [assignmentsRes, coursesRes] = await Promise.all([
        api.get<TeachingAssignment[]>('/teaching-assignments/my-assignments'),
        api.get<Course[]>('/teachers/eligible-courses'),
      ]);
      setAssignments(assignmentsRes.data);
      setEligibleCourses(coursesRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/teaching-assignments/request', form);
      setForm({ courseId: '', term: '', section: '01' });
      setShowForm(false);
      loadData();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to request teaching assignment');
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Teaching"
        title="Teaching requests"
        description="Request to teach courses you're eligible for, based on your skills."
        actions={
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4" />
            Request assignment
          </Button>
        }
      />

      {showForm && (
        <Card className="max-w-2xl">
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5 p-6">
              <div>
                <h2 className="text-[17px] font-semibold text-foreground">Request teaching assignment</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  You can only request courses you're eligible for (courses that require skills you have).
                </p>
              </div>
              <Field
                label="Course"
                htmlFor="courseId"
                hint={
                  eligibleCourses.length === 0 ? (
                    <>
                      You need to add skills that match course requirements. Go to{' '}
                      <Link href="/teacher/specialties" className="text-primary underline-offset-4 hover:underline">
                        Specialties
                      </Link>{' '}
                      to add skills.
                    </>
                  ) : (
                    'Only eligible courses are listed.'
                  )
                }
              >
                <Select
                  id="courseId"
                  value={form.courseId}
                  onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                  required
                >
                  <option value="">Select a course</option>
                  {eligibleCourses.length === 0 ? (
                    <option value="" disabled>
                      No eligible courses. Add matching skills to your profile first.
                    </option>
                  ) : (
                    eligibleCourses.map((course) => (
                      <option key={course.course_id} value={course.course_id}>
                        {course.code} - {course.title}
                      </option>
                    ))
                  )}
                </Select>
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Term" htmlFor="term">
                  <Input
                    id="term"
                    value={form.term}
                    onChange={(e) => setForm({ ...form, term: e.target.value })}
                    placeholder="e.g., 2025-SPRING"
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
              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">Submit request</Button>
              </div>
            </CardContent>
          </form>
        </Card>
      )}

      <Section title="My teaching assignments">
        {assignments.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No teaching assignments"
            description="Requests you submit will appear here with their status."
          />
        ) : (
          <List>
            {assignments.map((assignment) => (
              <ListItem key={assignment.assignment_id}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium text-foreground">
                    {assignment.code} - {assignment.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Term {assignment.term} · Section {assignment.section}
                  </p>
                </div>
                <Badge tone={statusTone(assignment.status)} className="capitalize">
                  {assignment.status}
                </Badge>
              </ListItem>
            ))}
          </List>
        )}
      </Section>
    </div>
  );
}
