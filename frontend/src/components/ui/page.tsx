'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, ChevronLeft, Info, Loader2, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------------- */
/* Page header                                                                */
/* ------------------------------------------------------------------------- */

type PageHeaderProps = {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  /** Shows a "Back" link above the title. Pass a label, or `true` for "Back". */
  back?: boolean | string;
  /** Explicit href for the back link; defaults to router.back(). */
  backHref?: string;
  className?: string;
};

export function PageHeader({ eyebrow, title, description, actions, back, backHref, className }: PageHeaderProps) {
  const router = useRouter();
  return (
    <header className={cn('mb-8 md:mb-10', className)}>
      {back && (
        <button
          type="button"
          onClick={() => (backHref ? router.push(backHref) : router.back())}
          className="mb-4 -ml-1 inline-flex items-center gap-0.5 text-sm text-primary hover:underline underline-offset-4"
        >
          <ChevronLeft className="h-4 w-4" />
          {typeof back === 'string' ? back : 'Back'}
        </button>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
          {description && <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------------- */
/* Section                                                                    */
/* ------------------------------------------------------------------------- */

export function Section({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('space-y-4', className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            {title && <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>}
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------------- */
/* Badge                                                                      */
/* ------------------------------------------------------------------------- */

const BADGE_TONES = {
  neutral: 'bg-secondary text-muted-foreground',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-green-50 text-green-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-600',
} as const;

export type BadgeTone = keyof typeof BADGE_TONES;

export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium',
        BADGE_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Maps common backend status strings to a badge tone. */
export function statusTone(status?: string | null): BadgeTone {
  const s = (status || '').toLowerCase();
  if (['approved', 'active', 'graded', 'submitted', 'completed', 'accepted', 'enrolled', 'verified', 'published'].includes(s)) return 'success';
  if (['pending', 'in_progress', 'in progress', 'draft', 'late', 'review'].includes(s)) return 'warning';
  if (['rejected', 'failed', 'expired', 'overdue', 'missing', 'inactive', 'declined'].includes(s)) return 'danger';
  return 'neutral';
}

/* ------------------------------------------------------------------------- */
/* Alert                                                                      */
/* ------------------------------------------------------------------------- */

const ALERT_TONES = {
  info: { cls: 'border-primary/20 bg-primary/[0.04] text-foreground', icon: Info, iconCls: 'text-primary' },
  success: { cls: 'border-green-200 bg-green-50 text-green-800', icon: CheckCircle2, iconCls: 'text-green-600' },
  warning: { cls: 'border-amber-200 bg-amber-50 text-amber-800', icon: TriangleAlert, iconCls: 'text-amber-600' },
  error: { cls: 'border-red-200 bg-red-50 text-red-700', icon: AlertCircle, iconCls: 'text-red-600' },
} as const;

export function Alert({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: keyof typeof ALERT_TONES;
  title?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  const t = ALERT_TONES[tone];
  const Icon = t.icon;
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cn('flex gap-3 rounded-xl border px-4 py-3 text-sm', t.cls, className)}>
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', t.iconCls)} />
      <div className="min-w-0 space-y-1">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className="leading-relaxed">{children}</div>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/* Empty / loading states                                                     */
/* ------------------------------------------------------------------------- */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-14 text-center', className)}>
      {Icon && (
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
      )}
      <p className="text-[15px] font-medium text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = 'Loading…', className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground', className)}>
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/* Stats                                                                      */
/* ------------------------------------------------------------------------- */

/** A row of key numbers sharing hairline dividers. */
export function StatGrid({
  items,
  className,
}: {
  items: { label: React.ReactNode; value: React.ReactNode; hint?: React.ReactNode }[];
  className?: string;
}) {
  const cols: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
  };
  return (
    <div
      className={cn(
        'grid gap-px overflow-hidden rounded-2xl border border-border/70 bg-border/70',
        cols[Math.min(items.length, 5)] || cols[4],
        className,
      )}
    >
      {items.map((item, i) => (
        <div key={i} className="bg-card p-5 md:p-6">
          <p className="text-[13px] text-muted-foreground">{item.label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums text-foreground">{item.value}</p>
          {item.hint && <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/* Segmented tabs                                                             */
/* ------------------------------------------------------------------------- */

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: { value: T; label: React.ReactNode; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={cn('-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0', className)}>
      <div role="tablist" className="inline-flex gap-0.5 rounded-full bg-black/[0.05] p-1">
        {items.map((item) => {
          const active = item.value === value;
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(item.value)}
              className={cn(
                'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-all duration-200',
                active ? 'bg-card text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.1)]' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {item.label}
              {typeof item.count === 'number' && (
                <span className={cn('tabular-nums text-xs', active ? 'text-muted-foreground' : 'text-muted-foreground/70')}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/* Form helpers                                                               */
/* ------------------------------------------------------------------------- */

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'h-11 w-full rounded-xl border border-input bg-card pl-3.5 text-[15px] text-foreground transition-[border-color,box-shadow] focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = 'Select';

/** Label + control + optional hint, stacked. */
export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: React.ReactNode;
  htmlFor?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <label htmlFor={htmlFor} className="block text-[13px] font-medium text-foreground">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/* List rows                                                                  */
/* ------------------------------------------------------------------------- */

/** Container for a grouped, divided list (iOS "inset grouped" style). */
export function List({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70 bg-card', className)}>
      {children}
    </div>
  );
}

export function ListItem({
  className,
  children,
  onClick,
  active,
}: {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
}) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-4 px-4 py-3.5 text-left md:px-5',
        onClick && 'transition-colors hover:bg-secondary/60',
        active && 'bg-primary/[0.05]',
        className,
      )}
    >
      {children}
    </Comp>
  );
}

/* ------------------------------------------------------------------------- */
/* Avatar                                                                     */
/* ------------------------------------------------------------------------- */

export function Avatar({ name, className }: { name?: string | null; className?: string }) {
  const initials = (name || '?')
    .split(/[\s@.]+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      className={cn(
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-foreground',
        className,
      )}
    >
      {initials}
    </span>
  );
}
