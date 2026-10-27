import * as React from 'react';
import { LogoMark } from '@/components/Logo';

/** Centered card layout shared by sign-in, sign-up and account-recovery screens. */
export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-14rem)] items-center justify-center py-6">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <LogoMark size={48} />
          <h1 className="mt-6 text-[28px] font-semibold tracking-tight text-foreground">{title}</h1>
          {description && <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{description}</p>}
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)] sm:p-8">
          {children}
        </div>
        {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
      </div>
    </div>
  );
}
