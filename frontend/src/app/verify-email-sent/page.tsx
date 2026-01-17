'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, Suspense } from 'react';

function VerifyEmailSentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleResend = async () => {
    if (!email) return;
    setLoading(true);
    setMessage('');
    try {
      await api.post('/auth/resend-verification', { email });
      setMessage('Verification email sent! Please check your inbox.');
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to resend email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Card className="w-full max-w-md border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">Check Your Email</CardTitle>
          <CardDescription className="text-muted-foreground">
            We've sent a verification link to your email address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="rounded-full bg-purple-500/20 p-2 md:p-3 lg:p-4">
              <svg
                className="w-12 h-12 text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
          <p className="text-center text-white">
            Please check your email <strong>{email}</strong> and click the verification link to
            activate your account.
          </p>
          <p className="text-center text-sm text-muted-foreground">
            Didn't receive the email? Check your spam folder or click the button below to resend.
          </p>
          {message && (
            <p className={`text-center text-sm ${message.includes('sent') ? 'text-green-400' : 'text-red-400'}`}>
              {message}
            </p>
          )}
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
              onClick={handleResend}
              disabled={loading || !email}
            >
              {loading ? 'Sending...' : 'Resend Email'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailSentPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[60vh] text-white">Loading...</div>}>
      <VerifyEmailSentContent />
    </Suspense>
  );
}

