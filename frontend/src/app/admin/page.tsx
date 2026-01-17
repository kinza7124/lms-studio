'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import type { Analytics } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
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
    return <div className="p-4 md:p-6 lg:p-8 text-white">Loading...</div>;
  }

  if (!analytics) {
    return <div className="p-4 md:p-6 lg:p-8 text-white">Failed to load analytics</div>;
  }

  return (
    <div className="space-y-6 md:space-y-8 p-4 md:p-6 lg:p-4 md:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-white">Admin Dashboard</h1>
          <p className="mt-2 text-sm md:text-base text-muted-foreground">Manage users, courses, and system analytics</p>
        </div>
      </div>

      <div className="grid gap-3 md:gap-4 lg:gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-white">{analytics.totals.users}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardDescription>Students</CardDescription>
            <CardTitle className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-white">{analytics.totals.students}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardDescription>Teachers</CardDescription>
            <CardTitle className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-white">{analytics.totals.teachers}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardDescription>Courses</CardDescription>
            <CardTitle className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-white">{analytics.totals.courses}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardDescription>Total Enrollments</CardDescription>
            <CardTitle className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-white">{analytics.totals.enrollments || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <span className="text-muted-foreground">Teaching Assignments</span>
              <span className="text-2xl font-semibold text-white">
                {analytics.pendingRequests.teachingAssignments}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <span className="text-muted-foreground">Suggestions</span>
              <span className="text-2xl font-semibold text-white">
                {analytics.pendingRequests.suggestions}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/users">
              <Button className="w-full" variant="outline">
                Manage Users
              </Button>
            </Link>
            <Link href="/admin/specialties">
              <Button className="w-full" variant="outline">
                Manage Specialties
              </Button>
            </Link>
            <Link href="/admin/teaching-assignments">
              <Button className="w-full" variant="outline">
                Teaching Assignments
              </Button>
            </Link>
            <Link href="/admin/suggestions">
              <Button className="w-full" variant="outline">
                Review Suggestions
              </Button>
            </Link>
            <Link href="/admin/assign-teacher">
              <Button className="w-full" variant="outline">
                Assign Teacher to Course
              </Button>
            </Link>
            <Link href="/admin/enrollments">
              <Button className="w-full" variant="outline">
                Manage Enrollments
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">Top Courses by Enrollment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analytics.enrollmentStats.slice(0, 10).map((stat) => (
              <div key={stat.course_id} className="flex items-center justify-between rounded-lg border border-white/10 p-3">
                <div>
                  <p className="font-medium text-white">{stat.code} - {stat.title}</p>
                </div>
                <span className="text-lg font-semibold text-white">{stat.enrollment_count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

