import PageHeader from '../components/PageHeader';
import Badge from '../components/Badge';
import Table from '../components/Table';
import type { TableColumn } from '../components/Table';
import { venues } from '../api/mockData';
import type { Venue } from '../api/mockData';
import useDocumentTitle from '../hooks/useDocumentTitle';

const statusTones: Record<Venue['status'], 'green' | 'amber' | 'gray'> = {
  active: 'green',
  maintenance: 'amber',
  inactive: 'gray',
};

const columns: TableColumn<Venue>[] = [
  {
    key: 'name',
    header: 'Venue',
    render: (row) => <span className="font-medium text-slate-900">{row.name}</span>,
  },
  { key: 'location', header: 'Location', render: (row) => row.location },
  { key: 'capacity', header: 'Capacity', render: (row) => row.capacity.toLocaleString() },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <Badge tone={statusTones[row.status]}>{row.status}</Badge>,
  },
];

export default function Venues() {
  useDocumentTitle('Venues');

  return (
    <>
      <PageHeader
        title="Venues"
        description="Locations where events take place."
      />

      <Table
        columns={columns}
        rows={venues}
        rowKey={(row) => row.id}
        emptyMessage="No venues yet."
      />
    </>
  );
}
