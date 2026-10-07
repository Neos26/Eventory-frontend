import type { LucideIcon } from 'lucide-react';
import Logo from './Logo';
import NavItem from './NavItem';

export interface NavItemConfig {
  to: string;
  label: string;
  /** Exact match only — no highlighting for nested routes. */
  end?: boolean;
  /** Paths that must not activate this item even though they live under `to`. */
  exclude?: string[];
  /** Optional leading icon. */
  icon?: LucideIcon;
}

export interface NavSection {
  title: string;
  items: NavItemConfig[];
}

const managementSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { to: '/management/dashboard', label: 'Dashboard' },
      { to: '/management/bookings', label: 'Booking Requests' },
    ],
  },
  {
    title: 'Monitoring',
    items: [
      { to: '/management/events', label: 'Events' },
      { to: '/management/reservations', label: 'Reservations' },
      { to: '/management/conflicts', label: 'Conflicts' },
      { to: '/management/analytics', label: 'Analytics' },
    ],
  },
  {
    title: 'Inventory',
    items: [
      { to: '/management/resources', label: 'Resources' },
      { to: '/management/venues', label: 'Venues' },
      { to: '/management/organizations', label: 'Organizations' },
    ],
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  /** Navigation sections; defaults to the management navigation. */
  sections?: NavSection[];
  /** 'management' = canvas rail with ink pills, 'booker' = paper rail with green tint. */
  variant?: 'management' | 'booker';
}

export default function Sidebar({
  open,
  onClose,
  sections = managementSections,
  variant = 'management',
}: SidebarProps) {
  const isManagement = variant === 'management';

  return (
    <>
      {/* Dimmed backdrop behind the drawer on small screens */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-ink/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 overflow-y-auto border-r border-slate-200 p-4 transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } ${isManagement ? 'bg-slate-50' : 'bg-white'}`}
      >
        {/* Soft signal tint at the top of the booker rail */}
        {!isManagement && (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(120%_100%_at_0%_0%,rgba(16,163,127,0.10),transparent_65%)]"
            aria-hidden="true"
          />
        )}

        <div className="relative mb-6 flex items-center justify-between">
          <Logo className="text-slate-900" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="cursor-pointer rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 lg:hidden"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        <nav className="relative space-y-6">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavItem
                    key={item.to}
                    to={item.to}
                    label={item.label}
                    end={item.end}
                    exclude={item.exclude}
                    icon={item.icon}
                    variant={variant}
                    onClick={onClose}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
