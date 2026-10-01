import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Package,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Table from '../components/Table';
import type { TableColumn } from '../components/Table';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { BookingStatusBadge } from '../components/StatusBadges';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { fetchManagementDashboard } from '../api/dashboardApi';
import { bookingEvent, bookingEventId, fetchBookings } from '../api/bookingApi';
import { fetchEvents, fetchOrganizations, resolveName, getErrorMessage } from '../api/eventApi';
import { fetchDashboardSummary } from '../api/insights';
import type { ManagementDashboard, ManagementDashboardResource } from '../types/dashboard';
import type { BookingRecord } from '../types/booking';
import type { EventRecord } from '../types/event';
import { formatDate, formatTime } from '../utils/format';

interface RecentRequestRow {
  booking: BookingRecord;
  eventName: string;
  eventDate: string | null;
  bookerName: string;
  organization: string;
}

function ResourceBar({ item }: { item: ManagementDashboardResource }) {
  const percent = Math.min(100, Math.max(0, item.utilization));
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <span className="w-24 shrink-0 truncate text-xs text-slate-600 sm:w-32 sm:text-sm" title={item.name}>
        {item.name}
      </span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${percent >= 80 ? 'bg-amber-500' : 'bg-brand-600'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="w-10 shrink-0 text-right text-xs font-medium text-slate-800 sm:w-12 sm:text-sm">
        {percent}%
      </span>
    </div>
  );
}

export default function Dashboard() {
  useDocumentTitle('Dashboard');
  const navigate = useNavigate();

  const [summary, setSummary] = useState<ManagementDashboard | null>(null);
  const [recentRequests, setRecentRequests] = useState<RecentRequestRow[]>([]);
  const [upcoming, setUpcoming] = useState<EventRecord[]>([]);
  const [conflictMessages, setConflictMessages] = useState<{ type: string; message: string; date: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashboard, bookings, events, organizations, overview] = await Promise.all([
        fetchManagementDashboard(),
        fetchBookings(),
        fetchEvents(),
        fetchOrganizations().catch(() => []),
        fetchDashboardSummary().catch(() => null),
      ]);
      setSummary(dashboard);

      const orgNames = new Map(organizations.map((org) => [org._id, org.name]));

      // Recent requests: newest first.
      const sortedBookings = [...bookings].sort(
        (a, b) =>
          new Date(b.submittedAt ?? b.createdAt).getTime() -
          new Date(a.submittedAt ?? a.createdAt).getTime(),
      );
      setRecentRequests(
        sortedBookings.slice(0, 6).map((booking) => {
          const event = bookingEvent(booking);
          return {
            booking,
            eventName: event?.name ?? 'Unknown event',
            eventDate: event?.startDate ?? null,
            bookerName:
              typeof booking.bookerId === 'string' ? 'Booker' : booking.bookerId.name,
            organization: event ? resolveName(event.organization, orgNames) : '—',
          };
        }),
      );

      // Upcoming approved events: has an Approved booking and starts in the future.
      const approvedEventIds = new Set(
        bookings.filter((booking) => booking.status === 'Approved').map(bookingEventId),
      );
      const now = Date.now();
      setUpcoming(
        events
          .filter(
            (event) =>
              approvedEventIds.has(event._id) &&
              new Date(event.startDate).getTime() >= now &&
              event.status !== 'cancelled',
          )
          .sort(
            (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
          )
          .slice(0, 6),
      );

      setConflictMessages(
        (overview?.recentConflicts ?? []).slice(0, 5).map((conflict) => ({
          type: conflict.type,
          message: conflict.message,
          date: conflict.date,
        })),
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingState message="Loading dashboard..." />;
  if (error || !summary) {
    return <ErrorState message={error ?? 'Unable to load the dashboard.'} onRetry={() => void load()} />;
  }

  const cards = [
    { label: 'Pending Requests', value: summary.pendingRequests, icon: Clock3, tone: 'bg-amber-100 text-amber-700', alert: summary.pendingRequests > 0 },
    { label: 'Approved Events', value: summary.approvedEvents, icon: CheckCircle2, tone: 'bg-brand-100 text-brand-700', alert: false },
    { label: 'Upcoming Events', value: summary.upcomingEvents, icon: CalendarDays, tone: 'bg-brand-100 text-brand-700', alert: false },
    { label: 'Total Resources', value: summary.totalResources, icon: Package, tone: 'bg-lime-100 text-lime-800', alert: false },
    { label: 'Total Venues', value: summary.totalVenues, icon: Building2, tone: 'bg-slate-100 text-slate-700', alert: false },
    { label: 'Active Conflicts', value: summary.activeConflicts, icon: AlertTriangle, tone: 'bg-red-100 text-red-700', alert: summary.activeConflicts > 0 },
  ];

  const requestColumns: TableColumn<RecentRequestRow>[] = [
    {
      key: 'event',
      header: 'Event',
      render: (row) => <span className="font-medium text-slate-900">{row.eventName}</span>,
    },
    { key: 'booker', header: 'Booker', render: (row) => row.bookerName },
    { key: 'organization', header: 'Organization', render: (row) => row.organization },
    {
      key: 'date',
      header: 'Date',
      render: (row) => (row.eventDate ? formatDate(row.eventDate) : '—'),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <BookingStatusBadge status={row.booking.status} />,
    },
    {
      key: 'action',
      header: 'Action',
      render: (row) => (
        <button
          type="button"
          onClick={() => navigate(`/management/bookings/${row.booking._id}`)}
          className="cursor-pointer font-medium text-brand-700 hover:underline"
        >
          Review
        </button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Requests, approvals and conflicts across the whole system."
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {cards.map((card) => (
          <Card key={card.label}>
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <div className="min-w-0">
                <p className="text-xs leading-tight text-slate-500 sm:text-sm">{card.label}</p>
                <p
                  className={`mt-1 text-2xl font-bold sm:text-3xl ${
                    card.alert ? 'text-red-600' : 'text-slate-900'
                  }`}
                >
                  {card.value}
                </p>
              </div>
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl sm:h-10 sm:w-10 ${card.tone}`}
              >
                <card.icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
              </span>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Recent requests */}
        <Card className="lg:col-span-3">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-semibold text-slate-900">Recent Requests</h2>
            <Link
              to="/management/bookings"
              className="inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          {recentRequests.length === 0 ? (
            <EmptyState
              title="No booking requests yet"
              description="When bookers submit events, their requests appear here."
            />
          ) : (
            <Table columns={requestColumns} rows={recentRequests} rowKey={(row) => row.booking._id} emptyMessage="No requests." />
          )}
        </Card>

        {/* Upcoming approved events */}
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-semibold text-slate-900">Upcoming Events</h2>
            <Link
              to="/management/events"
              className="inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              No approved events are scheduled yet.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {upcoming.map((event) => (
                <li key={event._id}>
                  <Link
                    to={`/management/events/${event._id}`}
                    className="flex cursor-pointer flex-wrap items-center justify-between gap-2 py-3 transition-colors hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{event.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatDate(event.startDate)} · {formatTime(event.startDate)}
                      </p>
                    </div>
                    <Badge tone="indigo">approved</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Resource utilization */}
        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-semibold text-slate-900">Resource Utilization</h2>
            <span className="text-sm font-bold text-slate-900">
              {summary.resourceUtilization.average}% avg
            </span>
          </div>
          {summary.resourceUtilization.resources.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">No resources tracked yet.</p>
          ) : (
            <div className="space-y-3">
              {summary.resourceUtilization.resources.map((item) => (
                <ResourceBar key={item._id} item={item} />
              ))}
            </div>
          )}
        </Card>

        {/* Conflict alerts */}
        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-semibold text-slate-900">Conflict Alerts</h2>
            <Link
              to="/management/conflicts"
              className="inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          {conflictMessages.length === 0 ? (
            <div className="flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              No active conflicts — everything looks clear.
            </div>
          ) : (
            <ul className="space-y-3">
              {conflictMessages.map((conflict, index) => (
                <li
                  key={`${conflict.type}-${index}`}
                  className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5"
                >
                  <Badge tone={conflict.type === 'resource' ? 'amber' : 'red'}>
                    {conflict.type === 'resource'
                      ? 'Resource'
                      : conflict.type === 'schedule'
                        ? 'Schedule'
                        : 'Venue'}
                  </Badge>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-700">{conflict.message}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{formatDate(conflict.date)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
