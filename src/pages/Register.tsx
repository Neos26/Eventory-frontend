import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Building2, ChevronDown, Loader2, LockKeyhole, Mail, User, Users } from 'lucide-react';
import { fetchOrganizations, getErrorMessage } from '../api/eventApi';
import type { OrganizationRecord } from '../api/eventApi';
import { homeForRole, useAuth } from '../context/AuthContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Logo from '../components/Logo';
import SiteFooter from '../components/SiteFooter';

const registerSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required'),
    email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
    role: z.enum(['booker', 'management']),
    organizationId: z.string(),
  })
  .superRefine((values, context) => {
    if (values.confirmPassword !== values.password) {
      context.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'Passwords do not match',
      });
    }
    // A booker belongs to a single organization - events are filed under it.
    if (values.role === 'booker' && !values.organizationId) {
      context.addIssue({
        code: 'custom',
        path: ['organizationId'],
        message: 'Organization is required for booker accounts',
      });
    }
  });

type RegisterValues = z.infer<typeof registerSchema>;

export default function Register() {
  useDocumentTitle('Create account');
  const { user, status, register } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [orgsError, setOrgsError] = useState(false);

  const {
    register: registerField,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'booker',
      organizationId: '',
    },
  });

  const role = watch('role');

  // Organizations are public - fetched so bookers can join one at signup.
  // Failures are surfaced (the field stays visible with a retry) instead of
  // hiding the picker, which would strand bookers on a required field.
  const loadOrganizations = async () => {
    setOrgsLoading(true);
    setOrgsError(false);
    try {
      const list = await fetchOrganizations();
      setOrganizations(list);
    } catch {
      setOrganizations([]);
      setOrgsError(true);
    } finally {
      setOrgsLoading(false);
    }
  };

  useEffect(() => {
    void loadOrganizations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Already signed in? Go straight to the role home.
  if (status === 'ready' && user) {
    return <Navigate to={homeForRole(user.role)} replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const created = await register({
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        role: values.role,
        ...(values.organizationId && { organizationId: values.organizationId }),
      });
      navigate(homeForRole(created.role), { replace: true });
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  });

  const fieldClass = (hasError: boolean) =>
    `w-full rounded-lg border bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
      hasError ? 'border-red-400' : 'border-slate-200'
    }`;

  return (
    <div className="flex min-h-screen">
      {/* Brand panel - hidden on small screens */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-900 via-brand-950 to-[#011a13] p-10 text-white lg:flex">
        <div
          className="pointer-events-none absolute -left-20 -top-24 h-80 w-80 rounded-full bg-brand-400/25 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-28 -right-16 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl"
          aria-hidden="true"
        />
        <Logo className="relative text-white" markClassName="text-brand-300" />
        <div className="relative">
          <h1 className="font-serif text-4xl font-semibold leading-tight">
            Join Eventory.
            <br />
            Create events.
            <br />
            <span className="bg-gradient-to-r from-brand-300 to-emerald-200 bg-clip-text text-transparent">
              Stay conflict-free.
            </span>
          </h1>
          <p className="mt-4 max-w-md text-sm text-brand-100/80">
            One account to plan events, request resources and follow every booking to approval.
          </p>
        </div>
      </div>

      {/* Sign-up card */}
      <div className="flex w-full items-center justify-center px-4 py-12 sm:px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Create your account</h2>
          <p className="mt-1 text-sm text-slate-500">
            Register to start planning events in Eventory.
          </p>

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
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
                Full name <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Juan Dela Cruz"
                  className={fieldClass(Boolean(errors.name))}
                  {...registerField('name')}
                />
              </div>
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                Email <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@eventory.edu"
                  className={fieldClass(Boolean(errors.email))}
                  {...registerField('email')}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
                Password <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <LockKeyhole
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  className={fieldClass(Boolean(errors.password))}
                  {...registerField('password')}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Confirm password <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <LockKeyhole
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  className={fieldClass(Boolean(errors.confirmPassword))}
                  {...registerField('confirmPassword')}
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="role" className="mb-1 block text-sm font-medium text-slate-700">
                Account type
              </label>
              <div className="relative">
                <Users
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <select
                  id="role"
                  className={`${fieldClass(false)} cursor-pointer appearance-none pr-9`}
                  {...registerField('role')}
                >
                  <option value="booker">Booker — create events and request bookings</option>
                  <option value="management">Management — review and approve bookings</option>
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="organizationId"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Organization{' '}
                {role === 'booker' ? (
                  <span className="text-red-500" aria-hidden="true">
                    *
                  </span>
                ) : (
                  <span className="font-normal text-slate-400">(optional)</span>
                )}
              </label>
              <div className="relative">
                <Building2
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <select
                  id="organizationId"
                  className={`${fieldClass(Boolean(errors.organizationId))} cursor-pointer appearance-none pr-9`}
                  {...registerField('organizationId')}
                >
                  <option value="">
                    {orgsLoading
                      ? 'Loading organizations…'
                      : organizations.length === 0
                        ? 'No organizations available'
                        : role === 'booker'
                          ? 'Select an organization'
                          : 'No organization'}
                  </option>
                  {organizations.map((organization) => (
                    <option key={organization._id} value={organization._id}>
                      {organization.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
              </div>
              {orgsError && (
                <div
                  role="alert"
                  className="mt-1 flex items-center justify-between gap-2 text-xs text-red-600"
                >
                  <span>Couldn't load organizations — check that the backend is running.</span>
                  <button
                    type="button"
                    onClick={() => void loadOrganizations()}
                    className="shrink-0 font-semibold underline hover:no-underline"
                  >
                    Retry
                  </button>
                </div>
              )}
              {!orgsError && !orgsLoading && organizations.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">
                  No organizations available yet — ask an administrator to create one first.
                </p>
              )}
              {errors.organizationId && (
                <p role="alert" className="mt-1 text-xs text-red-600">
                  {errors.organizationId.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-800 to-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-950/20 transition-colors hover:from-brand-900 hover:to-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-brand-700 hover:underline">
              Sign in
            </Link>
          </p>
          <p className="mt-4 text-center text-xs">
            <Link to="/" className="text-brand-700 hover:underline">
              Back to home
            </Link>
          </p>

          <SiteFooter compact className="mt-6 text-center" />
        </div>
      </div>
    </div>
  );
}
