import { Link } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle';
import PageHeader from '../components/PageHeader';

const quickLinks: { to: string; title: string; description: string }[] = [
  { to: '/dashboard', title: 'Dashboard', description: 'Overview of events and readiness.' },
  { to: '/events', title: 'Events', description: 'Create and manage events.' },
  { to: '/resources', title: 'Resources', description: 'Track inventory and equipment.' },
  { to: '/conflicts', title: 'Conflicts', description: 'Spot double-bookings early.' },
];

export default function Home() {
  useDocumentTitle('Home');

  return (
    <>
      <PageHeader
        title="Welcome to Eventory"
        description="Plan events, resources, venues and organizations in one place."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-500 hover:shadow-md"
          >
            <h3 className="font-semibold text-slate-900 group-hover:text-brand-600">
              {link.title}
            </h3>
            <p className="mt-1 text-sm text-slate-500">{link.description}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
