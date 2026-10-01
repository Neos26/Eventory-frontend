import { Link, useLocation } from 'react-router-dom';

interface NavItemProps {
  to: string;
  label: string;
  onClick?: () => void;
  /** Exact match only — no highlighting for nested routes. */
  end?: boolean;
  /** Paths that must not activate this item even though they live under `to`. */
  exclude?: string[];
}

// Keeps exactly one item active at a time: `end` narrows prefix matching and
// `exclude` carves routes (e.g. /booker/events/create) out of a parent item
// like "My Events", which would otherwise light up alongside it.
export default function NavItem({ to, label, onClick, end = false, exclude }: NavItemProps) {
  const { pathname } = useLocation();
  const matches = end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
  const isActive =
    matches && !exclude?.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  return (
    <Link
      to={to}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={`flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
        isActive
          ? 'bg-gradient-to-r from-brand-800 to-brand-600 text-white shadow-md shadow-brand-950/40 ring-1 ring-inset ring-white/10'
          : 'text-brand-100/90 hover:bg-white/10 hover:text-white'
      }`}
    >
      {label}
    </Link>
  );
}
