import { cn } from '@/lib/utils';

type LogoSize = 'sm' | 'md' | 'lg';

const SIZES: Record<LogoSize, { mark: number; text: string; gap: string }> = {
  sm: { mark: 28, text: 'text-[15px]', gap: 'gap-2' },
  md: { mark: 32, text: 'text-[17px]', gap: 'gap-2.5' },
  lg: { mark: 44, text: 'text-2xl', gap: 'gap-3' },
};

/** The brand mark on its own: an open book on a blue squircle. */
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn('shrink-0', className)}
    >
      <defs>
        <linearGradient id="lms-mark-bg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2b8cff" />
          <stop offset="1" stopColor="#0060d1" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8.5" fill="url(#lms-mark-bg)" />
      <path
        d="M6.5 10.4c3.1-1.2 6.2-.9 9 1.1v11.4c-2.8-2-5.9-2.3-9-1.1V10.4Z"
        fill="#fff"
      />
      <path
        d="M25.5 10.4c-3.1-1.2-6.2-.9-9 1.1v11.4c2.8-2 5.9-2.3 9-1.1V10.4Z"
        fill="#fff"
        fillOpacity="0.72"
      />
    </svg>
  );
}

/** Mark + wordmark. Use `showSubtitle` only in roomy contexts (auth screens, footers). */
export function Logo({
  className = '',
  showSubtitle = false,
  size = 'md',
}: {
  className?: string;
  showSubtitle?: boolean;
  size?: LogoSize;
}) {
  const s = SIZES[size];
  return (
    <div className={cn('flex items-center', s.gap, className)}>
      <LogoMark size={s.mark} />
      <div className="flex flex-col leading-none">
        <span className={cn(s.text, 'font-semibold tracking-[-0.02em] text-foreground')}>
          LMS<span className="font-normal text-muted-foreground"> Studio</span>
        </span>
        {showSubtitle && (
          <span className="mt-1 text-[11px] font-medium text-muted-foreground">Learning platform</span>
        )}
      </div>
    </div>
  );
}
