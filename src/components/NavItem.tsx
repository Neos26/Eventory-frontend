import { Link, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

interface NavItemProps {
  to: string;
  label: string;
  onClick?: () => void;
  /** Exact match only — no highlighting for nested routes. */
  end?: boolean;
  /** Paths that must not activate this item even though they live under `to`. */
  exclude?: string[];
  /** Optional leading icon. */
  icon?: LucideIcon;
  /** 'management' = green gradient pill, 'booker' = signal-green tint pill. */
  variant?: 'management' | 'booker';
}

// Keeps exactly one item active at a time: `end` narrows prefix matching and
// `exclude` carves routes (e.g. /booker/events/create) out of a parent item
// like "My Events", which would otherwise light up alongside it.
export default function NavItem({
  to,
  label,
  onClick,
  end = false,
  exclude,
  icon: Icon,
  variant = 'management',
}: NavItemProps) {
  const { pathname } = useLocation();
  const matches = end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
  const isActive =
    matches && !exclude?.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  const styles =
    variant === 'booker'
      ? `rounded-xl px-3 py-2 ${
          isActive
            ? 'bg-brand-100 text-brand-800 ring-1 ring-inset ring-brand-200/80 shadow-sm'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`
      : `rounded-lg px-3 py-2 ${
          isActive
            ? 'bg-gradient-to-r from-brand-800 to-brand-600 text-white shadow-sm shadow-brand-950/30'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`;

  return (
    <Link
      to={to}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={`flex cursor-pointer items-center gap-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${styles}`}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
      {label}
    </Link>
  );
}
