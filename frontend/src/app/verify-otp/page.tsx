'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/ui/button';
import { Alert, LoadingState } from '@/components/ui/page';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function VerifyOTPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp });
      // Store reset token and redirect to reset password page
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('resetToken', data.resetToken);
      }
      router.push('/reset-password');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Enter code" description={<>Enter the 6-digit code sent to {email}</>}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                required
                className="h-14 text-center text-2xl font-medium tracking-[0.5em] tabular-nums"
              />
            </div>
            {error && <Alert tone="error">{error}</Alert>}
            <Button
              type="submit"
              className="w-full"
              disabled={loading || otp.length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify code'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => router.push('/forgot-password')}
            >
              Back
            </Button>
          </form>
    </AuthShell>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <VerifyOTPContent />
    </Suspense>
  );
}

