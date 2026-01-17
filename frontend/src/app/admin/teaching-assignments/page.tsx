'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { TeachingAssignment } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export default function AdminTeachingAssignmentsPage() {
  const [assignments, setAssignments] = useState<TeachingAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  useAuthGuard();

  useEffect(() => {
    loadAssignments();
  }, [filter]);

  const loadAssignments = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const { data } = await api.get<TeachingAssignment[]>('/teaching-assignments', { params });
      setAssignments(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.put(`/teaching-assignments/${id}/approve`);
      loadAssignments();
    } catch (error) {
      console.error(error);
      alert('Failed to approve assignment');
    }
  };

  const handleReject = async (id: number) => {
    try {
      await api.put(`/teaching-assignments/${id}/reject`);
      loadAssignments();
    } catch (error) {
      console.error(error);
      alert('Failed to reject assignment');
    }
  };

  if (loading) {
    return <div className="p-4 md:p-6 lg:p-8 text-white">Loading...</div>;
  }

  return (
    <div className="space-y-3 md:space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-white">Teaching Assignments</h1>
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              onClick={() => setFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">Assignments ({assignments.length})</CardTitle>
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
                      Teacher: {assignment.teacher_name} ({assignment.teacher_email})
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Term: {assignment.term} | Section: {assignment.section}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Status: <span className="capitalize">{assignment.status}</span>
                    </p>
                  </div>
                  {assignment.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleApprove(assignment.assignment_id)}>
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(assignment.assignment_id)}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

