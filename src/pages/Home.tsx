import { Navigate, Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Boxes, CalendarCheck, Clock, MapPin } from 'lucide-react';
import { homeForRole, useAuth } from '../context/AuthContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
import LoadingState from '../components/LoadingState';
import Logo from '../components/Logo';

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
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(1000px_420px_at_50%_-140px,rgba(16,185,129,0.12),transparent_70%)]">
      {/* Soft glow orbs */}
      <div
        className="pointer-events-none absolute -left-40 -top-48 h-[520px] w-[520px] rounded-full bg-brand-300/25 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-36 top-1/4 h-96 w-96 rounded-full bg-emerald-300/25 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-brand-400/20 blur-3xl"
        aria-hidden="true"
      />

      <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
        <Logo />
        <div className="flex items-center gap-3">
          <Link
            to="/register"
            className="inline-flex cursor-pointer items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            Create account
          </Link>
          <Link
            to="/login"
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-gradient-to-r from-brand-800 to-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-950/20 transition-colors hover:from-brand-900 hover:to-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            Sign in
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        {/* Centered hero */}
        <section className="pt-12 text-center sm:pt-16 lg:pt-24">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Manage your events from request to{' '}
            <span className="bg-gradient-to-r from-brand-600 to-emerald-400 bg-clip-text text-transparent">
              approval
            </span>
            .
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-500 sm:text-lg">
            Eventory helps student organizers create events, reserve venues and resources, and
            follow every booking until management approves it.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/login"
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-gradient-to-r from-brand-800 to-brand-600 px-7 py-3 text-sm font-semibold text-white shadow-md shadow-brand-900/20 transition-colors hover:from-brand-900 hover:to-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              Sign in to get started
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              to="/register"
              className="inline-flex cursor-pointer items-center rounded-lg border border-slate-200 bg-white px-7 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              Create an account
            </Link>
          </div>
        </section>

        {/* Floating event + resources composition */}
        <section className="relative mx-auto mt-16 h-72 max-w-xl sm:mt-20">
          {/* Soft glow behind the emblem */}
          <div
            className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-300/30 blur-3xl"
            aria-hidden="true"
          />

          {/* Center emblem: calendar (events) + resource box */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              <div className="grid h-24 w-24 -rotate-3 place-items-center rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-2xl shadow-brand-900/30 sm:h-28 sm:w-28">
                <CalendarCheck className="h-11 w-11 sm:h-12 sm:w-12" aria-hidden="true" />
              </div>
              <span className="absolute -bottom-3 -right-3 grid h-11 w-11 rotate-6 place-items-center rounded-2xl border-2 border-white bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg">
                <Boxes className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
          </div>

          {/* Floating glass chips */}
          <div className="absolute left-0 top-6 flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-2 shadow-sm backdrop-blur sm:left-[4%]">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-100 text-brand-700">
              <MapPin className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="text-sm font-medium text-slate-700">Venues</span>
          </div>

          <div className="absolute right-0 top-6 flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-2 shadow-sm backdrop-blur sm:right-[4%]">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-100 text-brand-700">
              <Clock className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="text-sm font-medium text-slate-700">Schedule</span>
          </div>

          <div className="absolute bottom-6 left-0 flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-2 shadow-sm backdrop-blur sm:left-[4%]">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-100 text-brand-700">
              <Boxes className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="text-sm font-medium text-slate-700">Resources</span>
          </div>

          <div className="absolute bottom-6 right-0 flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-2 shadow-sm backdrop-blur sm:right-[4%]">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-100 text-brand-700">
              <BadgeCheck className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="text-sm font-medium text-slate-700">Approval</span>
          </div>
        </section>
      </main>
    </div>
  );
}
