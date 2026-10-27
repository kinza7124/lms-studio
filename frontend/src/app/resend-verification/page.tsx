'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/ui/button';
import { Alert, LoadingState } from '@/components/ui/page';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function ResendVerificationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      await api.post('/auth/resend-verification', { email });
      setMessage('Verification email sent! Please check your inbox.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend verification email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Resend verification email" description="Enter your email address to receive a new verification link">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {error && <Alert tone="error">{error}</Alert>}
            {message && <Alert tone="success">{message}</Alert>}
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Sending…' : 'Resend verification email'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => router.push('/login')}
            >
              Back to sign in
            </Button>
          </form>
    </AuthShell>
  );
}

export default function ResendVerificationPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ResendVerificationForm />
    </Suspense>
  );
}

