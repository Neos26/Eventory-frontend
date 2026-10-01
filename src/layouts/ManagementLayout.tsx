import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LayoutDashboard, LogOut, Menu } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Logo from '../components/Logo';
import { homeForRole, useAuth } from '../context/AuthContext';

// Header title for the current management route.
function titleFor(pathname: string): string {
  if (pathname === '/management/dashboard') return 'Dashboard';
  if (/^\/management\/bookings\/[^/]+$/.test(pathname)) return 'Booking Review';
  if (pathname === '/management/bookings') return 'Booking Requests';
  if (pathname === '/management/events') return 'Events';
  if (pathname === '/management/events/create') return 'Create Event';
  if (/^\/management\/events\/[^/]+\/edit$/.test(pathname)) return 'Edit Event';
  if (/^\/management\/events\/[^/]+\/requirements$/.test(pathname)) return 'Event Requirements';
  if (/^\/management\/events\/[^/]+\/readiness$/.test(pathname)) return 'Event Readiness';
  if (/^\/management\/events\/[^/]+\/conflicts$/.test(pathname)) return 'Event Conflicts';
  if (/^\/management\/events\/[^/]+$/.test(pathname)) return 'Event Details';
  if (/^\/management\/resources\/[^/]+$/.test(pathname)) return 'Resource Details';
  if (pathname === '/management/resources') return 'Resources';
  if (pathname === '/management/reservations') return 'Reservations';
  if (pathname === '/management/venues') return 'Venues';
  if (pathname === '/management/conflicts') return 'Conflicts';
  if (pathname === '/management/analytics') return 'Analytics';
  if (pathname === '/management/organizations') return 'Organizations';
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

// Management application shell: sidebar + header with page title and user
// menu. Visually matches the booker side so the product feels like one app.
export default function ManagementLayout() {
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
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-gradient-to-r before:from-brand-500 before:via-emerald-400 before:to-transparent sm:px-6 lg:px-8">
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
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-label="Open user menu"
                aria-expanded={menuOpen}
                className="flex cursor-pointer items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-semibold text-white">
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

        <main className="mx-auto w-full max-w-7xl px-4 py-6 bg-[radial-gradient(900px_320px_at_50%_-60px,rgba(16,185,129,0.09),transparent_70%)] sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
