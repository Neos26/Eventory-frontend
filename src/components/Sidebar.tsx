import Logo from './Logo';
import NavItem from './NavItem';

export interface NavSection {
  title: string;
  items: { to: string; label: string }[];
}

const managementSections: NavSection[] = [
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
        className={`fixed inset-y-0 left-0 z-40 w-64 overflow-y-auto bg-brand-950 p-4 transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-6 flex items-center justify-between">
          <Logo className="text-white" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="cursor-pointer rounded-lg p-1 text-brand-300 hover:bg-brand-900 hover:text-white lg:hidden"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        <nav className="space-y-6">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-brand-300">
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
