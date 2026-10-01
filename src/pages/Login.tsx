import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, LockKeyhole, Mail } from 'lucide-react';
import { getErrorMessage } from '../api/eventApi';
import { homeForRole, useAuth } from '../context/AuthContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Logo from '../components/Logo';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function Login() {
  useDocumentTitle('Sign in');
  const { user, status, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // Already signed in? Go straight to the role home.
  if (status === 'ready' && user) {
    return <Navigate to={homeForRole(user.role)} replace />;
  }

  const redirectTo =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? null;

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const loggedIn = await login(values);
      navigate(redirectTo ?? homeForRole(loggedIn.role), { replace: true });
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  });

  return (
    <div className="flex min-h-screen">
      {/* Brand panel - hidden on small screens */}
      <div className="hidden w-1/2 flex-col justify-between bg-brand-950 p-10 text-white lg:flex">
        <Logo className="text-white" />
        <div>
          <h1 className="text-4xl font-bold leading-tight">
            Plan events.
            <br />
            Book resources.
            <br />
            <span className="text-brand-300">Stay conflict-free.</span>
          </h1>
          <p className="mt-4 max-w-md text-sm text-brand-100/80">
            Eventory keeps your venues, equipment and booking requests in one clean workflow.
          </p>
        </div>
        <p className="text-xs text-brand-300">Eventory — Event Resource Management System</p>
      </div>

      {/* Sign-in card */}
      <div className="flex w-full items-center justify-center px-4 py-12 sm:px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h2>
          <p className="mt-1 text-sm text-slate-500">Sign in to manage your events and bookings.</p>

          <form onSubmit={onSubmit} noValidate className="mt-8 space-y-4">
            {serverError && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {serverError}
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                Email
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@eventory.edu"
                  className={`w-full rounded-lg border bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                    errors.email ? 'border-red-400' : 'border-slate-200'
                  }`}
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <LockKeyhole
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Your password"
                  className={`w-full rounded-lg border bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                    errors.password ? 'border-red-400' : 'border-slate-200'
                  }`}
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            New to Eventory?{' '}
            <Link to="/register" className="font-medium text-brand-700 hover:underline">
              Create an account
            </Link>
          </p>
          <p className="mt-4 text-center text-xs">
            <Link to="/" className="text-brand-700 hover:underline">
              Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
