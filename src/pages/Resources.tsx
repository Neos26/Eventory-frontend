import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Select from '../components/Select';
import Modal from '../components/Modal';
import Table from '../components/Table';
import type { TableColumn } from '../components/Table';
import SearchBar from '../components/SearchBar';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import ResourceForm from '../components/ResourceForm';
import useDocumentTitle from '../hooks/useDocumentTitle';
import {
  createResource,
  deleteResource,
  fetchResources,
  resourceStatus,
  updateResource,
} from '../api/resourceApi';
import type { ResourcePayload, ResourceRecord } from '../api/resourceApi';
import { getErrorMessage } from '../api/eventApi';
import {
  RESOURCE_CATEGORIES,
  resourceCategoryLabel,
  resourceToFormValues,
} from '../schemas/resourceForm';

const statusOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'In stock' },
  { value: 'low_stock', label: 'Low stock' },
  { value: 'out_of_stock', label: 'Out of stock' },
  { value: 'inactive', label: 'Inactive' },
];

const categoryFilterOptions = [
  { value: 'all', label: 'All categories' },
  ...RESOURCE_CATEGORIES.map((category) => ({
    value: category,
    label: resourceCategoryLabel(category),
  })),
];

export default function Resources() {
  useDocumentTitle('Resources');
  const navigate = useNavigate();

  const [resources, setResources] = useState<ResourceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ResourceRecord | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<ResourceRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setResources(await fetchResources());
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return resources.filter((resource) => {
      if (categoryFilter !== 'all' && resource.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && resourceStatus(resource).key !== statusFilter) return false;
      if (!search) return true;
      const haystack = [resource.name, resourceCategoryLabel(resource.category), resource.unit ?? '']
        .join(' ')
        .toLowerCase();
      return haystack.includes(search);
    });
  }, [resources, query, categoryFilter, statusFilter]);

  const openCreate = () => {
    setFormError(null);
    setCreateOpen(true);
  };

  const openEdit = (resource: ResourceRecord) => {
    setFormError(null);
    setEditTarget(resource);
  };

  const handleFormSubmit = async (payload: ResourcePayload) => {
    setFormSubmitting(true);
    setFormError(null);
    try {
      if (editTarget) {
        const updated = await updateResource(editTarget._id, payload);
        setResources((previous) =>
          previous.map((resource) => (resource._id === updated._id ? updated : resource)),
        );
        setEditTarget(null);
      } else {
        const created = await createResource(payload);
        setResources((previous) => [created, ...previous]);
        setCreateOpen(false);
      }
    } catch (requestError) {
      setFormError(getErrorMessage(requestError));
    } finally {
      setFormSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteResource(deleteTarget._id);
      setResources((previous) => previous.filter((resource) => resource._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (requestError) {
      setDeleteError(getErrorMessage(requestError));
    } finally {
      setDeleting(false);
    }
  };

  const columns: TableColumn<ResourceRecord>[] = [
    {
      key: 'name',
      header: 'Resource',
      render: (row) => (
        <button
          type="button"
          onClick={() => navigate(`/resources/${row._id}`)}
          className="font-medium text-slate-900 hover:text-brand-700 hover:underline"
        >
          {row.name}
        </button>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (row) => resourceCategoryLabel(row.category),
    },
    { key: 'total', header: 'Total Qty', render: (row) => row.quantityTotal },
    { key: 'available', header: 'Available', render: (row) => row.quantityAvailable },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const status = resourceStatus(row);
        return <Badge tone={status.tone}>{status.label}</Badge>;
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/resources/${row._id}`)}>
            View
          </Button>
          <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:bg-red-50"
            onClick={() => {
              setDeleteError(null);
              setDeleteTarget(row);
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const clearFilters = () => {
    setQuery('');
    setCategoryFilter('all');
    setStatusFilter('all');
  };

  return (
    <>
      <PageHeader
        title="Resources"
        description="Equipment and materials available for events."
        actions={<Button onClick={openCreate}>Add Resource</Button>}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar value={query} onChange={setQuery} placeholder="Search resources..." />
        <div className="w-full sm:w-48">
          <Select
            aria-label="Filter by category"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            options={categoryFilterOptions}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            options={statusOptions}
          />
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading resources..." />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : (
        <>
          {deleteError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {deleteError}
            </div>
          )}
          {resources.length === 0 ? (
            <EmptyState
              title="No resources yet"
              description="Create your first resource to start reserving it for events."
              action={<Button onClick={openCreate}>Create resource</Button>}
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No matching resources"
              description="Try a different search term, category or status filter."
              action={
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <Table
              columns={columns}
              rows={filtered}
              rowKey={(row) => row._id}
              emptyMessage="No resources found."
            />
          )}
        </>
      )}

      {/* Create / edit resource */}
      <Modal
        open={createOpen || editTarget !== null}
        onClose={() => {
          setCreateOpen(false);
          setEditTarget(null);
        }}
        title={editTarget ? 'Edit resource' : 'Add resource'}
      >
        <ResourceForm
          key={editTarget?._id ?? 'create'}
          submitLabel={editTarget ? 'Save Changes' : 'Create Resource'}
          submitting={formSubmitting}
          error={formError}
          initialValues={editTarget ? resourceToFormValues(editTarget) : undefined}
          onSubmit={(payload) => void handleFormSubmit(payload)}
          onCancel={() => {
            setCreateOpen(false);
            setEditTarget(null);
          }}
        />
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete resource"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => void confirmDelete()} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </>
        }
      >
        <p>
          Delete <span className="font-semibold">{deleteTarget?.name}</span>? This cannot be undone.
        </p>
        {deleteError && <p className="mt-2 text-sm text-red-600">{deleteError}</p>}
      </Modal>
    </>
  );
}
