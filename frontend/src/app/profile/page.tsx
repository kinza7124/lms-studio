'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
    return <div className="p-4 md:p-6 lg:p-8 text-white">Loading...</div>;
  }

  return (
    <div className="space-y-3 md:space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-white">Profile</h1>
        {!editing && (
          <Button onClick={() => setEditing(true)}>Edit Profile</Button>
        )}
      </div>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Full Name</Label>
            <Input value={user?.full_name || ''} disabled />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={user?.email || ''} disabled />
          </div>
          <div>
            <Label>Role</Label>
            <Input value={user?.role?.toUpperCase() || ''} disabled />
          </div>

          {user?.role === 'student' && profile && (
            <>
              <div>
                <Label>Enrollment Year</Label>
                {editing ? (
                  <Input
                    type="number"
                    value={form.enrollmentYear}
                    onChange={(e) => setForm({ ...form, enrollmentYear: e.target.value })}
                  />
                ) : (
                  <Input value={profile.enrollment_year || 'N/A'} disabled />
                )}
              </div>
              <div>
                <Label>Major</Label>
                {editing ? (
                  <Input
                    value={form.major}
                    onChange={(e) => setForm({ ...form, major: e.target.value })}
                  />
                ) : (
                  <Input value={profile.major || 'N/A'} disabled />
                )}
              </div>
            </>
          )}

          {user?.role === 'teacher' && profile && (
            <>
              <div>
                <Label>Department</Label>
                {editing ? (
                  <Input
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    placeholder="e.g., Business, Mathematics, Computer Science"
                  />
                ) : (
                  <Input value={profile.department || 'N/A'} disabled />
                )}
              </div>
              <div>
                <Label>Resume/Bio</Label>
                {editing ? (
                  <Textarea
                    value={form.resume}
                    onChange={(e) => setForm({ ...form, resume: e.target.value })}
                    rows={5}
                    placeholder="Your teaching experience, qualifications, and background..."
                  />
                ) : (
                  <Textarea value={profile.resume || 'N/A'} disabled rows={5} />
                )}
              </div>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Manage your teaching skills in the{' '}
                  <Link
                    href="/teacher/specialties"
                    className="text-purple-400 hover:text-purple-300 underline"
                  >
                    Specialties section
                  </Link>
                </p>
              </div>
            </>
          )}

          {editing && (
            <div className="flex gap-2">
              <Button onClick={handleSubmit}>Save Changes</Button>
              <Button variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

