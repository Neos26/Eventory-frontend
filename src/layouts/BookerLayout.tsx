import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LayoutDashboard, LogOut, Menu } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import type { NavSection } from '../components/Sidebar';
import Logo from '../components/Logo';
import { homeForRole, useAuth } from '../context/AuthContext';

const bookerSections: NavSection[] = [
  {
    title: 'Overview',
    items: [{ to: '/booker/dashboard', label: 'Dashboard' }],
  },
  {
    title: 'Events',
    items: [
      { to: '/booker/events', label: 'My Events' },
      { to: '/booker/events/create', label: 'Create Event' },
    ],
  },
  {
    title: 'Bookings',
    items: [{ to: '/booker/bookings', label: 'My Bookings' }],
  },
];

// Header title for the current booker route.
function titleFor(pathname: string): string {
  if (pathname === '/booker/dashboard') return 'Dashboard';
  if (pathname === '/booker/events') return 'My Events';
  if (pathname === '/booker/events/create') return 'Create Event';
  if (/\/booker\/events\/[^/]+\/edit$/.test(pathname)) return 'Edit Event';
  if (/\/booker\/events\/[^/]+\/requirements$/.test(pathname)) return 'Resource Requirements';
  if (/\/booker\/events\/[^/]+$/.test(pathname)) return 'Event Details';
  if (pathname === '/booker/bookings') return 'My Bookings';
  return 'Eventory';
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}

// Booker application shell: sidebar + header with page title and user menu.
export default function BookerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sections={bookerSections}
      />

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="cursor-pointer rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>

          <div className="lg:hidden">
            <Logo />
          </div>

          <h1 className="hidden text-sm font-semibold text-slate-800 lg:block">
            {titleFor(location.pathname)}
          </h1>

          <div className="ml-auto flex items-center gap-3">
            {/* User menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-label="Open user menu"
                aria-expanded={menuOpen}
                className="flex cursor-pointer items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                  {user ? initials(user.name) : '?'}
                </span>
                <span className="hidden text-sm font-medium text-slate-700 sm:block">
                  {user?.name}
                </span>
                <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden="true" />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setMenuOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 z-40 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                    <div className="px-3 py-2">
                      <p className="truncate text-sm font-semibold text-slate-900">{user?.name}</p>
                      <p className="truncate text-xs text-slate-500">{user?.email}</p>
                      <span className="mt-1 inline-flex rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium capitalize text-brand-700">
                        {user?.role}
                      </span>
                    </div>
                    <hr className="my-1 border-slate-100" />
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        if (user) navigate(homeForRole(user.role));
                      }}
                      className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                      My home
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>

        <footer className="mx-auto w-full max-w-7xl px-4 pb-6 text-xs text-slate-400 sm:px-6 lg:px-8">
          Eventory — Event Resource Management System
        </footer>
      </div>
    </div>
  );
}
