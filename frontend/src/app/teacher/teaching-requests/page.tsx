'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import type { TeachingAssignment, Course } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    return <div className="p-4 md:p-6 lg:p-8 text-white">Loading...</div>;
  }

  return (
    <div className="space-y-3 md:space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-white">Teaching Assignment Requests</h1>
          <p className="mt-2 text-muted-foreground">
            Request to teach courses you're eligible for (based on your skills). View your eligible courses and submit requests.
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>Request New Assignment</Button>
      </div>

      {showForm && (
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Request Teaching Assignment</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              You can only request courses you're eligible for (courses that require skills you have).
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="courseId">Course (Eligible Courses Only)</Label>
                <select
                  id="courseId"
                  value={form.courseId}
                  onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                  className="w-full rounded border border-white/20 bg-white/5 px-3 py-2 text-white"
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
                </select>
                {eligibleCourses.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    You need to add skills that match course requirements. Go to{' '}
                    <Link href="/teacher/specialties" className="text-purple-400 hover:text-purple-300 underline">
                      Specialties
                    </Link>{' '}
                    to add skills.
                  </p>
                )}
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
              <div className="flex gap-2">
                <Button type="submit">Submit Request</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">My Teaching Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div
                key={assignment.assignment_id}
                className="rounded-lg border border-white/10 p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-white">
                      {assignment.code} - {assignment.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Term: {assignment.term} | Section: {assignment.section}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Status: <span className="capitalize">{assignment.status}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

