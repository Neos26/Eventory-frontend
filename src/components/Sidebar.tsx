import Logo from './Logo';
import NavItem from './NavItem';

interface NavSection {
  title: string;
  items: { to: string; label: string }[];
}

const sections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/analytics', label: 'Analytics' },
    ],
  },
  {
    title: 'Events',
    items: [
      { to: '/events', label: 'Events' },
      { to: '/reservations', label: 'Reservations' },
      { to: '/conflicts', label: 'Conflicts' },
    ],
  },
  {
    title: 'Resources',
    items: [
      { to: '/resources', label: 'Resources' },
      { to: '/venues', label: 'Venues' },
      { to: '/organizations', label: 'Organizations' },
    ],
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Dimmed backdrop behind the drawer on small screens */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 overflow-y-auto bg-slate-900 p-4 transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-6 flex items-center justify-between">
          <Logo className="text-white" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        <nav className="space-y-6">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavItem key={item.to} to={item.to} label={item.label} onClick={onClose} />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
