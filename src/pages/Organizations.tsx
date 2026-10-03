import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import SearchBar from '../components/SearchBar';
import Table from '../components/Table';
import type { TableColumn } from '../components/Table';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import OrganizationForm from '../components/OrganizationForm';
import { fetchEvents, fetchOrganizations, getErrorMessage, refId } from '../api/eventApi';
import { createOrganization, updateOrganization } from '../api/organizationApi';
import { organizationToFormValues } from '../schemas/organizationForm';
import type { EventRecord, OrganizationRecord } from '../api/eventApi';
import type { CreateOrganizationPayload } from '../types/organization';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function Organizations() {
  useDocumentTitle('Organizations');

  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<OrganizationRecord | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [organizationList, eventList] = await Promise.all([
        fetchOrganizations(),
        fetchEvents().catch(() => [] as EventRecord[]),
      ]);
      setOrganizations(organizationList);
      setEvents(eventList);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Number of events (excluding cancelled) per organization.
  const eventCountByOrg = useMemo(() => {
    const map: Record<string, number> = {};
    for (const event of events) {
      if (event.status === 'cancelled') continue;
      const orgId = refId(event.organization);
      if (!orgId) continue;
      map[orgId] = (map[orgId] ?? 0) + 1;
    }
    return map;
  }, [events]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return organizations;
    return organizations.filter((organization) =>
      [organization.name, organization.email ?? '', organization.phone ?? '', organization.description ?? '']
        .join(' ')
        .toLowerCase()
        .includes(search),
    );
  }, [organizations, query]);

  const openCreate = () => {
    setFormError(null);
    setCreateOpen(true);
  };

  const openEdit = (organization: OrganizationRecord) => {
    setFormError(null);
    setEditTarget(organization);
  };

  const handleFormSubmit = async (payload: CreateOrganizationPayload) => {
    setFormSubmitting(true);
    setFormError(null);
    try {
      if (editTarget) {
        const updated = await updateOrganization(editTarget._id, payload);
        setOrganizations((previous) =>
          previous.map((organization) => (organization._id === updated._id ? updated : organization)),
        );
        setEditTarget(null);
      } else {
        const created = await createOrganization(payload);
        setOrganizations((previous) => [created, ...previous]);
        setCreateOpen(false);
      }
    } catch (requestError) {
      setFormError(getErrorMessage(requestError));
    } finally {
      setFormSubmitting(false);
    }
  };

  // Deactivate / reactivate without touching the other fields.
  const handleToggleActive = async (organization: OrganizationRecord) => {
    setTogglingId(organization._id);
    setActionError(null);
    try {
      const updated = await updateOrganization(organization._id, {
        isActive: organization.isActive === false,
      });
      setOrganizations((previous) =>
        previous.map((candidate) => (candidate._id === updated._id ? updated : candidate)),
      );
    } catch (requestError) {
      setActionError(getErrorMessage(requestError));
    } finally {
      setTogglingId(null);
    }
  };

  const columns: TableColumn<OrganizationRecord>[] = [
    {
      key: 'name',
      header: 'Organization',
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-slate-900">{row.name}</p>
          {row.description && (
            <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{row.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (row) => (
        <div className="text-xs leading-5">
          <p className="text-slate-700">{row.email || '—'}</p>
          <p className="text-slate-500">{row.phone || '—'}</p>
        </div>
      ),
    },
    {
      key: 'events',
      header: 'Number of Events',
      render: (row) => (
        <span className="font-medium text-slate-800">{eventCountByOrg[row._id] ?? 0}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const active = row.isActive !== false;
        return <Badge tone={active ? 'green' : 'gray'}>{active ? 'Active' : 'Inactive'}</Badge>;
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-1">
          <Button variant="secondary" size="sm" onClick={() => openEdit(row)}>
            Edit
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={togglingId === row._id}
            className={
              row.isActive === false
                ? 'text-brand-700 hover:bg-brand-50'
                : 'text-amber-700 hover:bg-amber-50'
            }
            onClick={() => void handleToggleActive(row)}
          >
            {togglingId === row._id ? 'Saving…' : row.isActive === false ? 'Activate' : 'Deactivate'}
          </Button>
        </div>
      ),
    },
  ];

  if (loading) return <LoadingState message="Loading organizations..." />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  return (
    <>
      <PageHeader
        title="Organizations"
        description="Groups that own and manage events, venues and resources."
        actions={<Button onClick={openCreate}>Add Organization</Button>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchBar value={query} onChange={setQuery} placeholder="Search organizations..." />
        <span className="text-sm text-slate-500">
          {filtered.length} of {organizations.length} organization
          {organizations.length === 1 ? '' : 's'}
        </span>
      </div>

      {actionError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      <Table
        columns={columns}
        rows={filtered}
        rowKey={(row) => row._id}
        emptyMessage={
          organizations.length === 0 ? 'No organizations yet.' : 'No organizations match your search.'
        }
      />

      {/* Create / edit organization */}
      <Modal
        open={createOpen || editTarget !== null}
        onClose={() => {
          setCreateOpen(false);
          setEditTarget(null);
        }}
        title={editTarget ? 'Edit organization' : 'Add organization'}
      >
        <OrganizationForm
          key={editTarget?._id ?? 'create'}
          submitLabel={editTarget ? 'Save Changes' : 'Create Organization'}
          submitting={formSubmitting}
          error={formError}
          initialValues={editTarget ? organizationToFormValues(editTarget) : undefined}
          onSubmit={(payload) => void handleFormSubmit(payload)}
          onCancel={() => {
            setCreateOpen(false);
            setEditTarget(null);
          }}
        />
      </Modal>
    </>
  );
}
