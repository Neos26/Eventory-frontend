import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onMenuClick: () => void;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="cursor-pointer rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
      >
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <span className="text-sm font-semibold text-slate-800 lg:hidden">Eventory</span>

      <div className="ml-auto flex items-center gap-3">
        {user && (
          <>
            <span className="hidden text-sm font-medium text-slate-700 sm:block">
              {user.name}
            </span>
            <span
              className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700"
              title={user.email}
            >
              {initials(user.name)}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Log out"
              title="Log out"
              className="cursor-pointer rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
