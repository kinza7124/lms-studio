'use client';

import { useEffect, useState } from 'react';
import { Briefcase } from 'lucide-react';
import api from '@/lib/api';
import type { TeachingAssignment } from '@/types';
import { Button } from '@/components/ui/button';
import { Avatar, Badge, EmptyState, List, ListItem, LoadingState, PageHeader, Tabs, statusTone } from '@/components/ui/page';
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
    return <LoadingState />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin"
        title="Teaching assignments"
        description="Review requests from teachers to teach a course section."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          items={[
            { value: 'all', label: 'All' },
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' },
          ]}
          value={filter}
          onChange={setFilter}
        />
        <p className="text-sm tabular-nums text-muted-foreground">{assignments.length} assignments</p>
      </div>

      {assignments.length === 0 ? (
        <EmptyState icon={Briefcase} title="No assignments" description="Nothing matches this filter." />
      ) : (
        <List>
          {assignments.map((assignment) => (
            <ListItem
              key={assignment.assignment_id}
              className="flex-col items-stretch gap-3 sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar name={assignment.teacher_name} />
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-medium text-foreground">
                    {assignment.code} - {assignment.title}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {assignment.teacher_name} · {assignment.teacher_email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {assignment.term} · Section {assignment.section}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 pl-12 sm:pl-0">
                <Badge tone={statusTone(assignment.status)} className="capitalize">{assignment.status}</Badge>
                {assignment.status === 'pending' && (
                  <>
                    <Button size="sm" onClick={() => handleApprove(assignment.assignment_id)}>
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-red-50"
                      onClick={() => handleReject(assignment.assignment_id)}
                    >
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </ListItem>
          ))}
        </List>
      )}
    </div>
  );
}
