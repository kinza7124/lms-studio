import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export const useAuthGuard = () => {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = window.localStorage.getItem('token');
    if (!token) {
      router.replace('/login');
    }
  }, [router]);
};

