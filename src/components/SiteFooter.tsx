import { Link } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import LogoMark from './LogoMark';

type Props = {
  className?: string;
  compact?: boolean;
};

export default function SiteFooter({ className = '', compact = false }: Props) {
  if (compact) {
    return (
      <footer className={className}>
        <div className="flex items-center justify-center gap-3 text-xs text-slate-400">
          <span
            className="h-px w-10 bg-gradient-to-r from-transparent to-brand-400/70"
            aria-hidden="true"
          />
          <span>
            &copy; 2026{' '}
            <span className="font-semibold text-brand-700">Eventory</span>
          </span>
          <span
            className="h-px w-10 bg-gradient-to-l from-transparent to-brand-400/70"
            aria-hidden="true"
          />
        </div>
      </footer>
    );
  }

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer className={`relative overflow-hidden border-t border-slate-200 bg-white ${className}`}>
      {/* Signal hairline */}
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/60 to-transparent"
        aria-hidden="true"
      />
      {/* Soft signal wash */}
      <div
        className="pointer-events-none absolute -top-20 left-1/2 h-40 w-96 -translate-x-1/2 rounded-full bg-brand-300/20 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-6xl px-4 pt-10 sm:px-6 lg:px-8">
        {/* Brand mark */}
        <div className="flex items-center gap-3">
          <LogoMark className="h-11 w-11 shrink-0 text-brand-600" />
          <div>
            <p className="bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
              Eventory
            </p>
            <p className="text-xs text-slate-400">
              Venues, resources and bookings for campus events.
            </p>
          </div>
        </div>

        {/* Giant watermark */}
        <p
          aria-hidden="true"
          className="mt-10 select-none bg-gradient-to-r from-slate-100 via-brand-200 to-slate-100 bg-clip-text text-center text-4xl font-extrabold tracking-[0.2em] text-transparent sm:text-6xl lg:text-8xl"
        >
          EVENTORY
        </p>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-slate-200 py-5 text-xs text-slate-400 sm:flex-row">
          <p>&copy; 2026 Eventory</p>
          <div className="flex items-center gap-4">
            <Link to="/" className="transition-colors hover:text-brand-700">
              Home
            </Link>
            <Link to="/login" className="transition-colors hover:text-brand-700">
              Sign in
            </Link>
            <Link to="/register" className="transition-colors hover:text-brand-700">
              Create account
            </Link>
            <button
              type="button"
              onClick={scrollToTop}
              className="inline-flex cursor-pointer items-center gap-1 transition-colors hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              Top
              <ArrowUp className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
