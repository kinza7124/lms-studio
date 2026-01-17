'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
    <div className="flex justify-center items-center min-h-[60vh]">
      <Card className="w-full max-w-md border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">Email Verification</CardTitle>
          <CardDescription className="text-muted-foreground">
            {status === 'loading' && 'Verifying your email...'}
            {status === 'success' && 'Verification successful!'}
            {status === 'error' && 'Verification failed'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500" />
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="rounded-full bg-green-500/20 p-2 md:p-3 lg:p-4">
                  <svg
                    className="w-12 h-12 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-center text-green-400">{message}</p>
              <Button
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-500"
                onClick={() => router.push('/login')}
              >
                Go to Login
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="rounded-full bg-red-500/20 p-2 md:p-3 lg:p-4">
                  <svg
                    className="w-12 h-12 text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-center text-red-400">{message}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push('/login')}
                >
                  Back to Login
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500"
                  onClick={() => router.push('/resend-verification')}
                >
                  Resend Email
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[60vh] text-white">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}

