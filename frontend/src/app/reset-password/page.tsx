'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/page';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetToken, setResetToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = window.sessionStorage.getItem('resetToken');
      if (!token) {
        router.push('/forgot-password');
      } else {
        setResetToken(token);
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (!resetToken) {
      setError('Reset token is missing. Please start over.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', {
        resetToken,
        newPassword,
      });
      // Clear reset token
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem('resetToken');
      }
      router.push('/login?message=Password reset successfully. Please log in with your new password.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!resetToken) {
    return null; // Will redirect
  }

  return (
    <AuthShell title="Reset password" description="Enter your new password">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            {error && <Alert tone="error">{error}</Alert>}
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Resetting…' : 'Reset password'}
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

