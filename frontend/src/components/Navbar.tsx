'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { Logo } from './Logo';
import { NotificationBell } from './NotificationBell';
import { ThemeToggle } from './ThemeToggle';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
        if (token) {
          try {
            const { data } = await api.get('/auth/profile');
            if (data && data.user) {
              console.log('✅ User loaded in Navbar:', data.user.role, data.user.email);
              setUser(data.user);
            } else {
              console.log('⚠️ No user data in response');
              setUser(null);
            }
          } catch (error: any) {
            console.error('❌ Error loading user profile:', error.response?.status, error.message);
            // Token invalid, clear it
            if (typeof window !== 'undefined') {
              window.localStorage.removeItem('token');
            }
            setUser(null);
          }
        } else {
          console.log('ℹ️ No token found');
          setUser(null);
        }
      } catch (error) {
        console.error('❌ Error loading user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    if (typeof window !== 'undefined') {
      loadUser();
      
      // Listen for storage changes (logout from other tabs)
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'token') {
          console.log('🔄 Token changed in storage, reloading user...');
          loadUser();
        }
      };
      
      // Listen for custom auth events (login/logout)
      const handleAuthEvent = () => {
        console.log('🔄 Auth event triggered, reloading user...');
        loadUser();
      };
      
      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('auth-changed', handleAuthEvent);
      
      // Also reload when pathname changes (user navigates)
      const handlePathChange = () => {
        const token = window.localStorage.getItem('token');
        if (token) {
          loadUser();
        }
      };
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('auth-changed', handleAuthEvent);
      };
    }
  }, [pathname]); // Reload when pathname changes

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('token');
      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event('auth-changed'));
    }
    setUser(null);
    router.push('/login');
  };

  const getLinks = () => {
    if (!user) {
      return [
        { href: '/', label: 'Home' },
        { href: '/courses', label: 'Courses' },
      ];
    }

    if (user.role === 'admin') {
      return [
        { href: '/admin', label: 'Overview' },
        { href: '/admin/users', label: 'Users' },
        { href: '/admin/courses', label: 'Courses' },
        { href: '/admin/quizzes', label: 'Quizzes' },
        { href: '/admin/assessments', label: 'Assessments' },
        { href: '/admin/enrollments', label: 'Enrollments' },
        { href: '/admin/teaching-assignments', label: 'Teaching' },
        { href: '/admin/suggestions', label: 'Suggestions' },
        { href: '/admin/specialties', label: 'Specialties' },
      ];
    }

    if (user.role === 'teacher') {
      return [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/teacher/my-courses', label: 'My courses' },
        { href: '/teacher/teaching-requests', label: 'Requests' },
        { href: '/teacher/suggestions', label: 'Suggestions' },
        { href: '/teacher/specialties', label: 'Specialties' },
      ];
    }

    // Student
    return [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/courses', label: 'Courses' },
      { href: '/student/my-courses', label: 'My courses' },
      { href: '/grades', label: 'Grades' },
    ];
  };

  const getRoleLabel = () => {
    if (!user) return '';
    switch (user.role) {
      case 'admin':
        return 'Admin';
      case 'teacher':
        return 'Teacher';
      case 'student':
        return 'Student';
      default:
        return 'User';
    }
  };

  const links = getLinks();
  // The most specific link matching the current path is the active one
  const activeHref = links
    .map((link) => link.href)
    .filter((href) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)))
    .sort((a, b) => b.length - a.length)[0];
  const isActive = (href: string) => href === activeHref;
  const initials = (user?.full_name || user?.email || 'U')
    .split(' ')
    .map((part: string) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 w-full border-b border-black/[0.06] bg-white/75 backdrop-blur-xl dark:bg-[rgb(22_22_23/0.72)] backdrop-saturate-150">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between gap-6">
          <Link href={user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/'} className="flex shrink-0 items-center" onClick={() => setMobileMenuOpen(false)}>
            <Logo size="sm" />
          </Link>

          {/* Desktop navigation */}
          {!loading && (
            <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 xl:flex">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] transition-colors duration-200',
                    isActive(link.href)
                      ? 'bg-black/[0.05] font-medium text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          <div className="flex shrink-0 items-center gap-1.5">
            <ThemeToggle compact />
            {!loading ? (
              user && (user.role === 'admin' || user.role === 'teacher' || user.role === 'student') ? (
                <>
                  <div className="hidden md:block">
                    <NotificationBell />
                  </div>
                  <Link href="/profile" className="hidden items-center gap-2.5 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-black/[0.04] lg:flex">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-foreground">
                      {initials}
                    </div>
                    <div className="flex flex-col leading-tight">
                      <span className="max-w-[140px] truncate text-[13px] font-medium text-foreground">
                        {user.full_name || user.email || 'User'}
                      </span>
                      <span className="text-[11px] text-muted-foreground">{getRoleLabel()}</span>
                    </div>
                  </Link>
                  <Button size="sm" variant="ghost" className="hidden text-muted-foreground md:inline-flex" onClick={handleLogout}>
                    Sign out
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 xl:hidden"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Toggle menu"
                  >
                    {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={() => router.push('/login')}>
                    Sign in
                  </Button>
                  <Button size="sm" onClick={() => router.push('/signup')}>
                    Get started
                  </Button>
                </>
              )
            ) : (
              <div className="h-8 w-8 animate-pulse rounded-full bg-secondary" />
            )}
          </div>
        </div>

        {/* Mobile / tablet menu */}
        {mobileMenuOpen && !loading && user && (
          <div className="border-t border-black/[0.06] py-3 xl:hidden">
            <nav className="flex flex-col gap-0.5">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'rounded-lg px-3 py-2.5 text-[15px] transition-colors',
                    isActive(link.href)
                      ? 'bg-black/[0.05] font-medium text-foreground'
                      : 'text-muted-foreground hover:bg-black/[0.03] hover:text-foreground',
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'rounded-lg px-3 py-2.5 text-[15px] transition-colors',
                  pathname === '/profile' ? 'bg-black/[0.05] font-medium text-foreground' : 'text-muted-foreground hover:bg-black/[0.03] hover:text-foreground',
                )}
              >
                Profile
              </Link>
              <button
                type="button"
                className="mt-2 border-t border-black/[0.06] px-3 pt-3 text-left text-[15px] text-destructive md:hidden"
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
              >
                Sign out
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
