import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import { Navbar } from '@/components/Navbar';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LMS Studio',
  description: 'Admin-friendly LMS with courses, lectures, and enrollments',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${poppins.variable} bg-background text-foreground min-h-screen`}
      >
        <div className="relative min-h-screen z-10">
          {/* Animated floating orbs */}
          <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
            <div className="absolute -left-20 top-20 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl animate-float" />
            <div className="absolute right-0 top-1/3 h-[500px] w-[500px] rounded-full bg-indigo-500/15 blur-3xl animate-float" style={{ animationDelay: '2s', animationDuration: '6s' }} />
            <div className="absolute left-1/2 bottom-20 h-80 w-80 rounded-full bg-pink-500/15 blur-3xl animate-float" style={{ animationDelay: '4s', animationDuration: '8s' }} />
            <div className="absolute right-1/4 top-1/2 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl animate-float" style={{ animationDelay: '1s', animationDuration: '7s' }} />
          </div>
          
          {/* Shimmer effect overlay */}
          <div className="pointer-events-none fixed inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 animate-shimmer" />
          </div>
          
          <Navbar />
          <main className="container py-10 relative z-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
