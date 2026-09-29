import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Table from '../components/Table';
import type { TableColumn } from '../components/Table';
import { dashboardStats, upcomingEvents } from '../api/mockData';
import type { EventSummary } from '../api/mockData';
import useDocumentTitle from '../hooks/useDocumentTitle';

const eventTones: Record<EventSummary['status'], 'gray' | 'indigo' | 'green'> = {
  draft: 'gray',
  planned: 'indigo',
  ongoing: 'green',
  completed: 'gray',
};

const columns: TableColumn<EventSummary>[] = [
  { key: 'name', header: 'Event', render: (row) => <span className="font-medium text-slate-900">{row.name}</span> },
  { key: 'date', header: 'Date', render: (row) => row.date },
  { key: 'venue', header: 'Venue', render: (row) => row.venue },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <Badge tone={eventTones[row.status]}>{row.status}</Badge>,
  },
];

export default function Dashboard() {
  useDocumentTitle('Dashboard');

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Events, resources and reservations at a glance."
        actions={<Button variant="secondary">Export</Button>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {dashboardStats.map((stat) => (
          <Card key={stat.label}>
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p
              className={`mt-2 text-3xl font-bold ${
                stat.tone === 'red' ? 'text-red-600' : 'text-slate-900'
              }`}
            >
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-slate-400">{stat.hint}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Upcoming events
        </h2>
        <Table
          columns={columns}
          rows={upcomingEvents}
          rowKey={(row) => row.id}
          emptyMessage="No upcoming events."
        />
      </div>
    </>
  );
}
