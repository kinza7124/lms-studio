'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/page';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      if (!token) {
        setStatus('error');
        setMessage('Verification token is missing');
        return;
      }

      try {
        console.log('Verifying email with token:', token.substring(0, 10) + '...');
        const { data } = await api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`);
        setStatus('success');
        setMessage(data.message || 'Email verified successfully!');
        console.log('Email verification successful');
      } catch (error: any) {
        console.error('Email verification error:', error);
        setStatus('error');
        const errorMessage = error.response?.data?.message || 'Invalid or expired verification token';
        setMessage(errorMessage);
        console.error('Verification failed:', errorMessage);
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <AuthShell title="Email verification" description={<>{status === 'loading' && 'Verifying your email…'}
            {status === 'success' && 'Your email is verified.'}
            {status === 'error' && 'We couldn’t verify your email.'}</>}>
          {status === 'loading' && (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-secondary border-t-primary" />
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="rounded-full bg-green-50 p-3">
                  <svg
                    className="h-7 w-7 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.75}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-center text-sm text-muted-foreground">{message}</p>
              <Button
                className="w-full"
                onClick={() => router.push('/login')}
              >
                Continue to sign in
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="rounded-full bg-red-50 p-3">
                  <svg
                    className="h-7 w-7 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.75}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-center text-sm text-muted-foreground">{message}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push('/login')}
                >
                  Back to sign in
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => router.push('/resend-verification')}
                >
                  Resend email
                </Button>
              </div>
            </div>
          )}
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <VerifyEmailContent />
    </Suspense>
  );
}

