import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Navbar } from '@/components/Navbar';
import { Logo } from '@/components/Logo';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'LMS Studio', template: '%s · LMS Studio' },
  description: 'Courses, lectures, assignments and grades in one focused workspace.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} bg-background text-foreground min-h-screen`}>
        <div className="relative min-h-screen">
          <Navbar />
          <main className="container min-h-[calc(100vh-9rem)] py-8 md:py-12">{children}</main>
          <footer className="border-t border-black/[0.06]">
            <div className="container flex flex-col items-center justify-between gap-3 py-6 text-xs text-muted-foreground sm:flex-row">
              <Logo size="sm" />
              <p>&copy; {new Date().getFullYear()} LMS Studio. All rights reserved.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
