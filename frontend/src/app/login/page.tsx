'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="min-h-screen flex items-center justify-center p-4 md:p-6 lg:p-8">
      <Card className="w-full max-w-md">
        <CardHeader className="p-4 md:p-6 lg:p-8">
          <CardTitle className="text-2xl md:text-3xl text-white">Welcome back</CardTitle>
          <CardDescription className="text-xs md:text-sm text-muted-foreground mt-2">Sign in to manage your LMS content.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 lg:p-8">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="space-y-2">
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                  <p className="text-sm text-red-300 font-medium">{error}</p>
                  {(error.includes('verify your email') || error.includes('verification')) && (
                    <div className="mt-3 space-y-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full text-purple-300 border-purple-400/50 hover:bg-purple-400/10 hover:text-purple-200"
                        onClick={() => router.push(`/resend-verification?email=${encodeURIComponent(email)}`)}
                      >
                        Resend Verification Email
                      </Button>
                      <p className="text-xs text-red-200/70 text-center">
                        Check your spam folder if you don't see the email
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            <Button type="submit" className="w-full bg-gradient-to-r from-purple-500 to-indigo-500" disabled={loading}>
              {loading ? 'Signing in...' : 'Continue'}
            </Button>
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                <button
                  type="button"
                  className="text-purple-400 underline-offset-4 hover:underline"
                  onClick={() => router.push('/forgot-password')}
                >
                  Forgot password?
                </button>
              </p>
              <p className="text-sm text-muted-foreground">
                New to LMS Studio?{' '}
                <button
                  type="button"
                  className="text-purple-400 underline-offset-4 hover:underline"
                  onClick={() => router.push('/signup')}
                >
                  Create an account
                </button>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

