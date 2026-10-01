import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Plus,
  XCircle,
} from 'lucide-react';
import { fetchBookerDashboard } from '../../api/dashboardApi';
import { getErrorMessage } from '../../api/eventApi';
import { useAuth } from '../../context/AuthContext';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import LoadingState from '../../components/LoadingState';
import PageHeader from '../../components/PageHeader';
import { BookingStatusBadge, EventStatusBadge } from '../../components/StatusBadges';
import { formatDate, formatTime } from '../../utils/format';
import type { BookerDashboard } from '../../types/dashboard';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning!';
  if (hour < 18) return 'Good afternoon!';
  return 'Good evening!';
}

export default function BookerDashboard() {
  useDocumentTitle('Dashboard');
  const { user } = useAuth();
  const [data, setData] = useState<BookerDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchBookerDashboard());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingState message="Loading your dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <ErrorState message="No dashboard data." onRetry={load} />;

  const stats = [
    {
      key: 'upcoming',
      label: 'Upcoming Events',
      value: data.upcomingEvents.length,
      icon: CalendarDays,
      tone: 'bg-brand-100 text-brand-700',
    },
    {
      key: 'pending',
      label: 'Pending Requests',
      value: data.pendingBookings,
      icon: Clock3,
      tone: 'bg-amber-100 text-amber-700',
    },
    {
      key: 'approved',
      label: 'Approved Bookings',
      value: data.approvedBookings,
      icon: CheckCircle2,
      tone: 'bg-brand-100 text-brand-700',
    },
    {
      key: 'rejected',
      label: 'Rejected Bookings',
      value: data.rejectedBookings,
      icon: XCircle,
      tone: 'bg-red-100 text-red-700',
    },
  ];

  return (
    <>
      <PageHeader
        title={greeting()}
        description={`Welcome back${user ? `, ${user.name.split(' ')[0]}` : ''}. Manage your events and booking requests.`}
        actions={
          <Link
            to="/booker/events/create"
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create Event
          </Link>
        }
      />

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.key}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">{stat.value}</p>
              </div>
              <span className={`grid h-11 w-11 place-items-center rounded-xl ${stat.tone}`}>
                <stat.icon className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Upcoming events */}
        <Card className="lg:col-span-3">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-semibold text-slate-900">Upcoming Events</h2>
            <Link
              to="/booker/events"
              className="inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          {data.upcomingEvents.length === 0 ? (
            <EmptyState
              title="No upcoming events"
              description="Create your first event to get started."
              action={
                <Link
                  to="/booker/events/create"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Create Event
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.upcomingEvents.map((event) => (
                <li key={event._id}>
                  <Link
                    to={`/booker/events/${event._id}`}
                    className="flex cursor-pointer flex-wrap items-center justify-between gap-3 py-3 transition-colors hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{event.name}</p>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {formatDate(event.startDate)} · {formatTime(event.startDate)} –{' '}
                        {formatTime(event.endDate)}
                        {event.venue ? ` · ${event.venue}` : ''}
                      </p>
                    </div>
                    <EventStatusBadge status={event.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Recent activity */}
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-semibold text-slate-900">Recent Activity</h2>
            <ClipboardList className="h-4 w-4 text-slate-400" aria-hidden="true" />
          </div>

          {data.recentActivity.length === 0 ? (
            <EmptyState title="No activity yet" description="Your bookings and events will appear here." />
          ) : (
            <ul className="space-y-3">
              {data.recentActivity.map((activity) => (
                <li
                  key={`${activity.type}-${activity.id}`}
                  className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{activity.label}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{formatDate(activity.date)}</p>
                  </div>
                  {activity.type === 'booking' ? (
                    <BookingStatusBadge status={activity.status} />
                  ) : (
                    <EventStatusBadge status={activity.status} />
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
