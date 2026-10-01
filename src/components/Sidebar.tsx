import Logo from './Logo';
import NavItem from './NavItem';

export interface NavItemConfig {
  to: string;
  label: string;
  /** Exact match only — no highlighting for nested routes. */
  end?: boolean;
  /** Paths that must not activate this item even though they live under `to`. */
  exclude?: string[];
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
}

export default function Sidebar({ open, onClose, sections = managementSections }: SidebarProps) {
  return (
    <>
      {/* Dimmed backdrop behind the drawer on small screens */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-brand-950/60 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 overflow-y-auto border-r border-white/10 bg-gradient-to-b from-brand-950 via-brand-950 to-brand-900/70 p-4 transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Soft emerald glow at the top of the rail */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(120%_100%_at_0%_0%,rgba(16,185,129,0.22),transparent_65%)]"
          aria-hidden="true"
        />

        <div className="relative mb-6 flex items-center justify-between">
          <Logo className="text-white" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="cursor-pointer rounded-lg p-1 text-brand-300 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        <nav className="relative space-y-6">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-brand-300/70">
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
