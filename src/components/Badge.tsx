import type { ReactNode } from 'react';

type Tone = 'gray' | 'green' | 'amber' | 'red' | 'indigo';

interface BadgeProps {
  tone?: Tone;
  children: ReactNode;
}

const tones: Record<Tone, string> = {
  gray: 'bg-slate-100 text-slate-700',
  green: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-700',
  indigo: 'bg-brand-50 text-brand-700',
};

export default function Badge({ tone = 'gray', children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
