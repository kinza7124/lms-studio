'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Analytics } from '@/types';
import { ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  useAuthGuard();

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const { data } = await api.get<Analytics>('/admin/analytics');
        setAnalytics(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, []);

  if (loading) {
    return <div className="py-24 text-center text-sm text-muted-foreground">Loading…</div>;
  }

  if (!analytics) {
    return <div className="py-24 text-center text-sm text-muted-foreground">Failed to load analytics</div>;
  }

  const stats = [
    { label: 'Total users', value: analytics.totals.users },
    { label: 'Students', value: analytics.totals.students },
    { label: 'Teachers', value: analytics.totals.teachers },
    { label: 'Courses', value: analytics.totals.courses },
    { label: 'Enrollments', value: analytics.totals.enrollments || 0 },
  ];

  const actions = [
    { href: '/admin/users', label: 'Manage users' },
    { href: '/admin/specialties', label: 'Manage specialties' },
    { href: '/admin/teaching-assignments', label: 'Teaching assignments' },
    { href: '/admin/suggestions', label: 'Review suggestions' },
    { href: '/admin/assign-teacher', label: 'Assign teacher to course' },
    { href: '/admin/enrollments', label: 'Manage enrollments' },
  ];

  return (
    <div className="space-y-8 md:space-y-10">
      <div>
        <p className="eyebrow">Admin</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Overview</h1>
        <p className="mt-2 text-muted-foreground">Users, courses, and activity across your institution.</p>
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border/70 bg-border/70 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card p-5 md:p-6">
            <p className="text-[13px] text-muted-foreground">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-[17px]">Pending requests</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border/70 py-0">
            <Link href="/admin/teaching-assignments" className="flex items-center justify-between py-4">
              <span className="text-sm text-muted-foreground">Teaching assignments</span>
              <span className="text-2xl font-semibold tracking-tight text-foreground">
                {analytics.pendingRequests.teachingAssignments}
              </span>
            </Link>
            <Link href="/admin/suggestions" className="flex items-center justify-between py-4">
              <span className="text-sm text-muted-foreground">Suggestions</span>
              <span className="text-2xl font-semibold tracking-tight text-foreground">
                {analytics.pendingRequests.suggestions}
              </span>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[17px]">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            {actions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-secondary"
              >
                {action.label}
                <ChevronRight className="h-4 w-4 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-[17px]">Top courses by enrollment</CardTitle>
        </CardHeader>
        <CardContent className="py-0">
          <div className="divide-y divide-border/70">
            {analytics.enrollmentStats.slice(0, 10).map((stat, idx) => (
              <div key={stat.course_id} className="flex items-center gap-4 py-3.5">
                <span className="w-5 text-sm tabular-nums text-muted-foreground">{idx + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{stat.title}</p>
                  <p className="text-xs text-muted-foreground">{stat.code}</p>
                </div>
                <span className="text-sm font-semibold tabular-nums text-foreground">{stat.enrollment_count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
