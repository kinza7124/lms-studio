'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/page';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('token', data.token);
        // Dispatch custom event to notify Navbar
        window.dispatchEvent(new Event('auth-changed'));
      }
      
      // Redirect based on role
      const userRole = data.user?.role || 'student';
      if (userRole === 'admin') {
        router.push('/admin');
      } else if (userRole === 'teacher') {
        router.push('/teacher/my-courses');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.response?.status === 403) {
        const errorMessage = err.response?.data?.message || 'Please verify your email before logging in.';
        setError(errorMessage);
        // Don't show confirm dialog, just show the button
      } else {
        setError(err.response?.data?.message || 'Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Sign in to LMS Studio"
      description="Welcome back. Pick up right where you left off."
      footer={
        <>
          New to LMS Studio?{' '}
          <button
            type="button"
            className="font-medium text-primary underline-offset-4 hover:underline"
            onClick={() => router.push('/signup')}
          >
            Create an account
          </button>
        </>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@school.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <button
              type="button"
              className="text-[13px] text-primary underline-offset-4 hover:underline"
              onClick={() => router.push('/forgot-password')}
            >
              Forgot password?
            </button>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && (
          <Alert tone="error">
            <p>{error}</p>
            {(error.includes('verify your email') || error.includes('verification')) && (
              <div className="mt-3 space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => router.push(`/resend-verification?email=${encodeURIComponent(email)}`)}
                >
                  Resend verification email
                </Button>
                <p className="text-xs text-red-600/80">Check your spam folder if you don&apos;t see the email.</p>
              </div>
            )}
          </Alert>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthShell>
  );
}

