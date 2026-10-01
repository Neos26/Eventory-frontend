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
        `flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
          isActive
            ? 'bg-brand-700 text-white'
            : 'text-brand-100 hover:bg-brand-900 hover:text-white'
        }`
      }
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label}
    </NavLink>
  );
}
