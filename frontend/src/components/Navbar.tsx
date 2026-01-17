'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { Logo } from './Logo';
import { NotificationBell } from './NotificationBell';

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
        { href: '/', label: 'Home' },
        { href: '/admin', label: 'Admin Panel' },
        { href: '/admin/users', label: 'Users' },
        { href: '/admin/courses', label: 'Courses' },
        { href: '/admin/quizzes', label: 'Quizzes' },
        { href: '/admin/assessments', label: 'Assessments' },
        { href: '/admin/enrollments', label: 'Enrollments' },
        { href: '/admin/teaching-assignments', label: 'Teaching' },
        { href: '/admin/suggestions', label: 'Suggestions' },
        { href: '/admin/specialties', label: 'Specialties' },
        { href: '/profile', label: 'Profile' },
      ];
    }

    if (user.role === 'teacher') {
      return [
        { href: '/', label: 'Home' },
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/teacher/my-courses', label: 'My Courses' },
        { href: '/teacher/teaching-requests', label: 'Requests' },
        { href: '/teacher/suggestions', label: 'Suggestions' },
        { href: '/teacher/specialties', label: 'Specialties' },
        { href: '/profile', label: 'Profile' },
      ];
    }

    // Student
    return [
      { href: '/', label: 'Home' },
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/courses', label: 'Courses' },
      { href: '/student/my-courses', label: 'My Courses' },
      { href: '/grades', label: 'Grades' },
      { href: '/profile', label: 'Profile' },
    ];
  };

  const getRoleBadgeColor = () => {
    if (!user) return '';
    switch (user.role) {
      case 'admin':
        return 'bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-400/30 text-red-200';
      case 'teacher':
        return 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-400/30 text-blue-200';
      case 'student':
        return 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/30 text-green-200';
      default:
        return 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-purple-400/30 text-purple-200';
    }
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

  const getNavbarGradient = () => {
    if (!user) return 'from-black/80 via-purple-900/20 to-black/80';
    switch (user.role) {
      case 'admin':
        return 'from-black/80 via-red-900/20 to-black/80';
      case 'teacher':
        return 'from-black/80 via-blue-900/20 to-black/80';
      case 'student':
        return 'from-black/80 via-green-900/20 to-black/80';
      default:
        return 'from-black/80 via-purple-900/20 to-black/80';
    }
  };

  return (
    <header className={cn(
      "sticky top-0 z-30 w-full border-b backdrop-blur-xl shadow-lg transition-all duration-300",
      user?.role === 'admin' ? "border-red-500/20 shadow-red-500/10 bg-gradient-to-r from-black/80 via-red-900/20 to-black/80" :
      user?.role === 'teacher' ? "border-blue-500/20 shadow-blue-500/10 bg-gradient-to-r from-black/80 via-blue-900/20 to-black/80" :
      user?.role === 'student' ? "border-green-500/20 shadow-green-500/10 bg-gradient-to-r from-black/80 via-green-900/20 to-black/80" :
      "border-white/10 shadow-purple-500/10 bg-gradient-to-r from-black/80 via-purple-900/20 to-black/80"
    )}>
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 max-w-7xl">
        <div className="flex h-16 md:h-20 items-center justify-between gap-2 sm:gap-3 lg:gap-4">
          {/* Logo Section */}
          <div className="flex items-center shrink-0 min-w-0 max-w-[40%] sm:max-w-none">
            <Link 
              href="/" 
              className="flex items-center transition-all duration-300 hover:scale-105 hover:brightness-110"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Logo size="sm" className="md:hidden" showSubtitle={false} />
              <Logo size="md" className="hidden md:block" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          {!loading && (
            <nav className="hidden xl:flex items-center gap-1 2xl:gap-2 rounded-full border border-white/10 bg-gradient-to-r from-white/5 via-purple-500/10 to-white/5 px-3 2xl:px-4 py-1.5 shadow-lg shadow-black/20 backdrop-blur-xl transition-all duration-300 hover:border-purple-400/30 hover:shadow-purple-500/20 flex-shrink">
              {getLinks().map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'text-xs 2xl:text-sm font-medium transition-all duration-300 relative px-1.5 2xl:px-2 py-1 whitespace-nowrap',
                    pathname === link.href 
                      ? 'text-white' 
                      : 'text-muted-foreground hover:text-purple-200',
                  )}
                >
                  {link.label}
                  {pathname === link.href && (
                    <span className="absolute -bottom-1 left-1.5 2xl:left-2 right-1.5 2xl:right-2 h-0.5 bg-gradient-to-r from-purple-400 to-cyan-300 rounded-full" />
                  )}
                </Link>
              ))}
            </nav>
          )}

          {/* Right Section - User Info & Mobile Menu Button */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0 min-w-0">
            {!loading ? (
              <>
                {user && (user.role === 'admin' || user.role === 'teacher' || user.role === 'student') ? (
                  <>
                    {/* Notification Bell - Desktop only */}
                    <div className="hidden lg:block">
                      <NotificationBell />
                    </div>
                    
                    {/* Role badge and user name - visible on 2xl screens only */}
                    <div className="hidden 2xl:flex items-center gap-2">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border backdrop-blur-sm whitespace-nowrap",
                        getRoleBadgeColor()
                      )}>
                        {getRoleLabel()}
                      </span>
                      <span className="text-xs 2xl:text-sm text-muted-foreground max-w-[100px] 2xl:max-w-[120px] truncate">
                        {user.full_name || user.email || 'User'}
                      </span>
                    </div>
                    {/* Role badge only - visible on xl but hidden on 2xl */}
                    <span className={cn(
                      "hidden xl:flex 2xl:hidden px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border backdrop-blur-sm",
                      getRoleBadgeColor()
                    )}>
                      {getRoleLabel()}
                    </span>
                    {/* Logout button - Show on md and up, hidden on mobile only */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="hidden md:flex border-white/20 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-white backdrop-blur-sm transition-all duration-300 hover:border-purple-400/50 hover:from-purple-500/30 hover:to-indigo-500/30 hover:shadow-lg hover:shadow-purple-500/30 text-xs px-2 sm:px-3 py-1.5 h-auto whitespace-nowrap"
                      onClick={handleLogout}
                    >
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-white text-xs sm:text-sm px-2 sm:px-3"
                      onClick={() => router.push('/login')}
                    >
                      Sign in
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/20 text-white hover:bg-white/10 text-xs sm:text-sm px-2 sm:px-3"
                      onClick={() => router.push('/signup')}
                    >
                      Sign up
                    </Button>
                  </>
                )}
              </>
            ) : (
              <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />
            )}

            {/* Mobile Menu Button */}
            {!loading && user && (
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden text-white p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Menu - Only show on md and below */}
        {mobileMenuOpen && !loading && user && (
          <div className="md:hidden border-t border-white/10 mt-2 pt-4 pb-4">
            <nav className="flex flex-col gap-2 px-4">
              {getLinks().map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'text-sm font-medium transition-all duration-300 relative px-4 py-2 rounded-lg',
                    pathname === link.href 
                      ? 'text-white bg-white/10' 
                      : 'text-muted-foreground hover:text-white hover:bg-white/5',
                  )}
                >
                  {link.label}
                  {pathname === link.href && (
                    <span className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-400 to-cyan-300 rounded-r-full" />
                  )}
                </Link>
              ))}
              {/* Mobile Logout Button */}
              <Button
                size="sm"
                variant="outline"
                className="md:hidden w-full border-white/20 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-white backdrop-blur-sm transition-all duration-300 hover:border-purple-400/50 hover:from-purple-500/30 hover:to-indigo-500/30 hover:shadow-lg hover:shadow-purple-500/30 text-sm px-4 py-2 mt-2"
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
              >
                Logout
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

