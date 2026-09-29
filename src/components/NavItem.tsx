import { NavLink } from 'react-router-dom';

interface NavItemProps {
  to: string;
  label: string;
  onClick?: () => void;
}

// Highlighted for every route under `to`, e.g. /events stays active on /events/create.
export default function NavItem({ to, label, onClick }: NavItemProps) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-brand-600 text-white'
            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`
      }
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label}
    </NavLink>
  );
}
