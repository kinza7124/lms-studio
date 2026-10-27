import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Navbar } from '@/components/Navbar';
import { Logo } from '@/components/Logo';
import { ThemeToggle, themeInitScript } from '@/components/ThemeToggle';
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} bg-background text-foreground min-h-screen`}>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <div className="relative min-h-screen">
          <Navbar />
          <main className="container min-h-[calc(100vh-9rem)] py-8 md:py-12">{children}</main>
          <footer className="border-t border-black/[0.06]">
            <div className="container flex flex-col items-center justify-between gap-3 py-6 text-xs text-muted-foreground sm:flex-row">
              <Logo size="sm" />
              <div className="flex items-center gap-4">
                <p>&copy; {new Date().getFullYear()} LMS Studio. All rights reserved.</p>
                <ThemeToggle />
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
