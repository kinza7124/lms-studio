'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, Badge, Field, LoadingState } from '@/components/ui/page';
import { ChevronRight, Pencil } from 'lucide-react';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const router = useRouter();
  useAuthGuard();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: userData } = await api.get('/auth/profile');
      setUser(userData.user);

      if (userData.user.role === 'student') {
        const { data: studentData } = await api.get('/students/profile');
        setProfile(studentData.student);
        setForm({
          enrollmentYear: studentData.student?.enrollment_year || '',
          major: studentData.student?.major || '',
        });
      } else if (userData.user.role === 'teacher') {
        const { data: teacherData } = await api.get('/teachers/profile');
        setProfile(teacherData.teacher);
        setForm({
          department: teacherData.teacher?.department || '',
          resume: teacherData.teacher?.resume || '',
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (user.role === 'student') {
        await api.put('/students/profile', form);
        alert('Profile updated successfully');
        setEditing(false);
        loadProfile();
      } else if (user.role === 'teacher') {
        await api.put('/teachers/profile', form);
        alert('Profile updated successfully');
        setEditing(false);
        loadProfile();
      }
    } catch (error) {
      console.error(error);
      alert('Failed to update profile');
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words text-[15px] text-foreground sm:text-right">{value}</span>
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex flex-col items-center gap-4 pt-2 text-center">
        <Avatar name={user?.full_name || user?.email} className="h-20 w-20 text-2xl" />
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {user?.full_name || 'Profile'}
          </h1>
          <p className="mt-1 truncate text-[15px] text-muted-foreground">{user?.email}</p>
          {user?.role && (
            <Badge tone="primary" className="mt-3 capitalize">
              {user.role}
            </Badge>
          )}
        </div>
        {!editing && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" />
            Edit profile
          </Button>
        )}
      </div>

      <section className="space-y-2">
        <h2 className="px-1 text-[13px] font-medium text-muted-foreground">Personal information</h2>
        <Card className="divide-y divide-border/70 overflow-hidden">
          <Row label="Full name" value={user?.full_name || ''} />
          <Row label="Email" value={user?.email || ''} />
          <Row label="Role" value={<span className="capitalize">{user?.role || ''}</span>} />
        </Card>
      </section>

      {user?.role === 'student' && profile && (
        <section className="space-y-2">
          <h2 className="px-1 text-[13px] font-medium text-muted-foreground">Academic</h2>
          {editing ? (
            <Card>
              <CardContent className="space-y-5 p-6">
                <Field label="Enrollment year" htmlFor="enrollmentYear">
                  <Input
                    id="enrollmentYear"
                    type="number"
                    value={form.enrollmentYear}
                    onChange={(e) => setForm({ ...form, enrollmentYear: e.target.value })}
                  />
                </Field>
                <Field label="Major" htmlFor="major">
                  <Input
                    id="major"
                    value={form.major}
                    onChange={(e) => setForm({ ...form, major: e.target.value })}
                  />
                </Field>
              </CardContent>
            </Card>
          ) : (
            <Card className="divide-y divide-border/70 overflow-hidden">
              <Row label="Enrollment year" value={<span className="tabular-nums">{profile.enrollment_year || 'N/A'}</span>} />
              <Row label="Major" value={profile.major || 'N/A'} />
            </Card>
          )}
        </section>
      )}

      {user?.role === 'teacher' && profile && (
        <section className="space-y-2">
          <h2 className="px-1 text-[13px] font-medium text-muted-foreground">Teaching</h2>
          {editing ? (
            <Card>
              <CardContent className="space-y-5 p-6">
                <Field label="Department" htmlFor="department">
                  <Input
                    id="department"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    placeholder="e.g., Business, Mathematics, Computer Science"
                  />
                </Field>
                <Field label="Resume / bio" htmlFor="resume">
                  <Textarea
                    id="resume"
                    value={form.resume}
                    onChange={(e) => setForm({ ...form, resume: e.target.value })}
                    rows={5}
                    placeholder="Your teaching experience, qualifications, and background…"
                  />
                </Field>
              </CardContent>
            </Card>
          ) : (
            <Card className="divide-y divide-border/70 overflow-hidden">
              <Row label="Department" value={profile.department || 'N/A'} />
              <div className="px-5 py-3.5">
                <p className="text-sm text-muted-foreground">Resume / bio</p>
                <p className="mt-1.5 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">
                  {profile.resume || 'N/A'}
                </p>
              </div>
            </Card>
          )}
          <Link
            href="/teacher/specialties"
            className="flex items-center justify-between rounded-2xl border border-border/70 bg-card px-5 py-3.5 text-[15px] text-foreground transition-colors hover:bg-secondary/60"
          >
            <span>
              Manage your teaching skills
              <span className="block text-xs text-muted-foreground">Specialties section</span>
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
          </Link>
        </section>
      )}

      {editing && (
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => setEditing(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save changes</Button>
        </div>
      )}
    </div>
  );
}
