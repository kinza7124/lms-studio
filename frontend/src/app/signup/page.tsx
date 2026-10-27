'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/ui/button';
import { Alert, Select } from '@/components/ui/page';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const roles = [
  { value: 'student', label: 'Student' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'admin', label: 'Admin' },
];

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [specialtyTags, setSpecialtyTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering form after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Parse specialty tags (comma-separated keywords)
      const tagsArray = role === 'teacher' && specialtyTags
        ? specialtyTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        : [];

      const { data } = await api.post('/auth/register', {
        fullName,
        email,
        password,
        role,
        specialtyTags: tagsArray,
      });
      // Registration successful - show verification message
      router.push(`/verify-email-sent?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Unable to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <AuthShell title="Create your account" description="Join LMS Studio as a student or teacher.">
            <div className="space-y-3 md:space-y-4">
              <div className="h-11 w-full rounded-xl bg-secondary animate-pulse" />
              <div className="h-11 w-full rounded-xl bg-secondary animate-pulse" />
              <div className="h-11 w-full rounded-xl bg-secondary animate-pulse" />
              <div className="h-11 w-full rounded-xl bg-secondary animate-pulse" />
            </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Create your account" description="Join LMS Studio as a student or teacher.">
          <form className="space-y-4 md:space-y-5" onSubmit={handleSubmit} suppressHydrationWarning>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                name="fullName"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Olivia Martin"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                id="role"
                value={role}
                onChange={(event) => setRole(event.target.value)}
              >
                {roles.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            {role === 'teacher' && (
              <div className="space-y-2">
                <Label htmlFor="specialtyTags">Specialties</Label>
                <Input
                  id="specialtyTags"
                  name="specialtyTags"
                  value={specialtyTags}
                  onChange={(event) => setSpecialtyTags(event.target.value)}
                  placeholder="mathematics, calculus, algebra"
                />
                <p className="text-xs text-muted-foreground">
                  Enter keywords that describe your teaching specialties. These will be matched with course requirements.
                </p>
              </div>
            )}
            {error && <Alert tone="error">{error}</Alert>}
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <button
                type="button"
                className="text-primary underline-offset-4 hover:underline"
                onClick={() => router.push('/login')}
              >
                Sign in
              </button>
            </p>
          </form>
    </AuthShell>
  );
}

