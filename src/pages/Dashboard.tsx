import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Table from '../components/Table';
import type { TableColumn } from '../components/Table';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { fetchDashboardSummary, getErrorMessage } from '../api/insights';
import type {
  DashboardSummary,
  EventStatus,
  RecentConflict,
  ResourceAlert,
  UpcomingEvent,
} from '../api/insights';
import { formatDate, formatTime } from '../utils/format';

const statusTones: Record<EventStatus, 'gray' | 'indigo' | 'green' | 'red'> = {
  draft: 'gray',
  planned: 'indigo',
  ongoing: 'green',
  completed: 'gray',
  cancelled: 'red',
};

const conflictTones: Record<RecentConflict['type'], 'red' | 'amber' | 'indigo'> = {
  venue: 'red',
  schedule: 'amber',
  resource: 'indigo',
};

const upcomingColumns: TableColumn<UpcomingEvent>[] = [
  {
    key: 'name',
    header: 'Event',
    render: (row) => <span className="font-medium text-slate-900">{row.name}</span>,
  },
  { key: 'date', header: 'Date', render: (row) => formatDate(row.startDate) },
  { key: 'time', header: 'Time', render: (row) => `${formatTime(row.startDate)} - ${formatTime(row.endDate)}` },
  { key: 'venue', header: 'Venue', render: (row) => row.venue ?? 'Unassigned' },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <Badge tone={statusTones[row.status]}>{row.status}</Badge>,
  },
];

export default function Dashboard() {
  useDocumentTitle('Dashboard');
  const navigate = useNavigate();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSummary(await fetchDashboardSummary());
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <LoadingState message="Loading dashboard..." />;
  }

  if (error || !summary) {
    return <ErrorState message={error ?? 'Unable to load the dashboard.'} onRetry={() => void load()} />;
  }

  const { stats, upcoming, recentConflicts, resourceAlerts } = summary;

  const cards = [
    { label: 'Total Events', value: stats.totalEvents, hint: 'All time' },
    { label: 'Upcoming Events', value: stats.upcomingEvents, hint: 'Starting in the future' },
    { label: 'Confirmed Events', value: stats.confirmedEvents, hint: 'Planned or ongoing' },
    { label: 'Total Resources', value: stats.totalResources, hint: 'Tracked items' },
    { label: 'Active Reservations', value: stats.activeReservations, hint: 'Reserved or issued' },
    { label: 'Conflicts', value: stats.conflicts, hint: 'Needs attention', tone: 'red' as const },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Events, resources and reservations at a glance."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((card) => (
          <Card key={card.label}>
            <p className="text-sm text-slate-500">{card.label}</p>
            <p
              className={`mt-2 text-3xl font-bold ${
                card.tone === 'red' ? 'text-red-600' : 'text-slate-900'
              }`}
            >
              {card.value}
            </p>
            <p className="mt-1 text-xs text-slate-400">{card.hint}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Upcoming events
        </h2>
        {upcoming.length === 0 ? (
          <EmptyState
            title="No upcoming events"
            description="Scheduled events will appear here."
            action={<Button onClick={() => navigate('/events/create')}>Create event</Button>}
          />
        ) : (
          <Table
            columns={upcomingColumns}
            rows={upcoming}
            rowKey={(row) => row._id}
            emptyMessage="No upcoming events."
          />
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Recent conflicts
          </h2>
          {recentConflicts.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              No conflicts detected. Everything looks clear.
            </p>
          ) : (
            <ul className="space-y-3">
              {recentConflicts.map((conflict, index) => (
                <li
                  key={`${conflict.type}-${index}`}
                  className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5"
                >
                  <Badge tone={conflictTones[conflict.type]}>{conflict.type}</Badge>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-700">{conflict.message}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{formatDate(conflict.date)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 text-right">
            <button
              type="button"
              onClick={() => navigate('/conflicts')}
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              View all conflicts →
            </button>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Resource alerts
          </h2>
          {resourceAlerts.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              All resources are sufficiently stocked.
            </p>
          ) : (
            <ul className="space-y-3">
              {resourceAlerts.map((alert: ResourceAlert) => (
                <li
                  key={alert._id}
                  className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5"
                >
                  <Badge tone={alert.level === 'critical' ? 'red' : 'amber'}>{alert.message}</Badge>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800">{alert.name}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {alert.available} of {alert.total} available
                    </p>
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
