import { Navigate, Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, ClipboardList, Sparkles } from 'lucide-react';
import { homeForRole, useAuth } from '../context/AuthContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
import LoadingState from '../components/LoadingState';
import Logo from '../components/Logo';

const features = [
  {
    icon: CalendarDays,
    title: 'Plan events',
    description: 'Create events, pick a free venue and set the schedule in minutes.',
  },
  {
    icon: ClipboardList,
    title: 'Request resources',
    description: 'Projectors, chairs, tables and sound systems with live availability.',
  },
  {
    icon: Sparkles,
    title: 'Track bookings',
    description: 'Submit booking requests and follow their status until approval.',
  },
];

export default function Home() {
  useDocumentTitle('Home');
  const { user, status } = useAuth();

  if (status === 'loading') {
    return (
      <div className="grid min-h-screen place-items-center">
        <LoadingState message="Loading Eventory..." />
      </div>
    );
  }

  // Signed-in users land on their role home.
  if (user) return <Navigate to={homeForRole(user.role)} replace />;

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
        <Logo />
        <div className="flex items-center gap-3">
          <Link
            to="/register"
            className="inline-flex cursor-pointer items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            Create account
          </Link>
          <Link
            to="/login"
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            Sign in
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <section className="py-12 text-center sm:py-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Event Resource Management System
          </span>
          <h1 className="mx-auto mt-6 max-w-2xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Manage your events from request to{' '}
            <span className="text-brand-700">approval</span>.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-500">
            Eventory helps student organizers create events, reserve venues and resources, and
            follow every booking until management approves it.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/login"
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              Sign in to get started
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              to="/register"
              className="inline-flex cursor-pointer items-center rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              Create an account
            </Link>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-100 text-brand-700">
                <feature.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 font-semibold text-slate-900">{feature.title}</h2>
              <p className="mt-1 text-sm text-slate-500">{feature.description}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-4 pb-8 text-xs text-slate-400 sm:px-6 lg:px-8">
        Eventory — Event Resource Management System
      </footer>
    </div>
  );
}
