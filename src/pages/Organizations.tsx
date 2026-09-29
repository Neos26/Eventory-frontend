import PageHeader from '../components/PageHeader';
import Table from '../components/Table';
import type { TableColumn } from '../components/Table';
import { organizations } from '../api/mockData';
import type { Organization } from '../api/mockData';
import useDocumentTitle from '../hooks/useDocumentTitle';

const columns: TableColumn<Organization>[] = [
  {
    key: 'name',
    header: 'Organization',
    render: (row) => <span className="font-medium text-slate-900">{row.name}</span>,
  },
  { key: 'description', header: 'Description', render: (row) => row.description },
  {
    key: 'contact',
    header: 'Contact',
    render: (row) => (
      <div className="text-xs leading-5">
        <p className="text-slate-700">{row.email}</p>
        <p className="text-slate-500">{row.phone}</p>
      </div>
    ),
  },
];

export default function Organizations() {
  useDocumentTitle('Organizations');

  return (
    <>
      <PageHeader
        title="Organizations"
        description="Groups that own and manage events, venues and resources."
      />

      <Table
        columns={columns}
        rows={organizations}
        rowKey={(row) => row.id}
        emptyMessage="No organizations yet."
      />
    </>
  );
}
