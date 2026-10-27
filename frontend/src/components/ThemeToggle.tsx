'use client';

import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme';

/** Inline script for <head>: applies the saved theme before first paint to avoid a flash. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');var d=t==='dark'||((!t||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

function applyTheme(theme: Theme) {
  const dark =
    theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
}

const OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

export function ThemeToggle({ className, compact = false }: { className?: string; compact?: boolean }) {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    let saved: Theme = 'system';
    try {
      saved = (localStorage.getItem(STORAGE_KEY) as Theme) || 'system';
    } catch {}
    setTheme(saved);
    const onThemeChange = (event: Event) => setTheme((event as CustomEvent<Theme>).detail);
    window.addEventListener('theme-change', onThemeChange);
    return () => window.removeEventListener('theme-change', onThemeChange);
  }, []);

  useEffect(() => {
    if (theme !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [theme]);

  const choose = (next: Theme) => {
    setTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
    applyTheme(next);
    window.dispatchEvent(new CustomEvent<Theme>('theme-change', { detail: next }));
  };

  if (compact) {
    const index = OPTIONS.findIndex((o) => o.value === theme);
    const current = OPTIONS[index] ?? OPTIONS[2];
    const next = OPTIONS[(index + 1) % OPTIONS.length];
    const Icon = current.icon;
    return (
      <button
        type="button"
        onClick={() => choose(next.value)}
        aria-label={`Theme: ${current.label}. Switch to ${next.label}`}
        title={`Theme: ${current.label}`}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-black/[0.04] hover:text-foreground',
          className,
        )}
      >
        <Icon className="h-[17px] w-[17px]" strokeWidth={1.75} />
      </button>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className={cn('inline-flex items-center gap-0.5 rounded-full bg-black/[0.05] p-0.5', className)}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => choose(value)}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full transition-colors',
              active ? 'bg-card text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.12)] dark:bg-white/15' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        );
      })}
    </div>
  );
}
