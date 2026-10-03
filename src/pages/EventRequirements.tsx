import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Input from '../components/Input';
import Select from '../components/Select';
import Table from '../components/Table';
import type { TableColumn } from '../components/Table';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import Modal from '../components/Modal';
import useDocumentTitle from '../hooks/useDocumentTitle';
import {
  createRequirement,
  deleteRequirement,
  fetchEvent,
  fetchRequirements,
  getErrorMessage,
  isNotFound,
  refId,
  resolveName,
  updateRequirement,
} from '../api/eventApi';
import { fetchResources } from '../api/resourceApi';
import type {
  EventRecord,
  RequirementPriority,
  RequirementRecord,
  ResourceRecord,
} from '../api/eventApi';
import { formatDate } from '../utils/format';

const priorityTones: Record<RequirementPriority, 'gray' | 'indigo' | 'red'> = {
  low: 'gray',
  medium: 'indigo',
  high: 'red',
};

interface EditFormState {
  resourceId: string;
  quantity: string;
  priority: RequirementPriority;
}

export default function EventRequirements() {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<EventRecord | null>(null);
  const [requirements, setRequirements] = useState<RequirementRecord[]>([]);
  const [resources, setResources] = useState<ResourceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Add form
  const [newResourceId, setNewResourceId] = useState('');
  const [newQuantity, setNewQuantity] = useState('1');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // List-level error (stepper saves, etc.)
  const [listError, setListError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Edit modal
  const [editTarget, setEditTarget] = useState<RequirementRecord | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({
    resourceId: '',
    quantity: '1',
    priority: 'medium',
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<RequirementRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useDocumentTitle('Event Requirements');

  const load = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setLoadError(null);
    setNotFound(false);
    try {
      const [eventRecord, requirementList, resourceList] = await Promise.all([
        fetchEvent(eventId),
        fetchRequirements(eventId),
        fetchResources(),
      ]);
      setEvent(eventRecord);
      setRequirements(requirementList);
      setResources(resourceList);
    } catch (requestError) {
      if (isNotFound(requestError)) {
        setNotFound(true);
      } else {
        setLoadError(getErrorMessage(requestError));
      }
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  const resourceNames = useMemo(
    () => new Map(resources.map((resource) => [resource._id, resource.name])),
    [resources],
  );

  const resourceOptions = useMemo(
    () => [
      { value: '', label: 'Select a resource' },
      ...resources.map((resource) => ({
        value: resource._id,
        label: resource.unit ? `${resource.name} (${resource.unit})` : resource.name,
      })),
    ],
    [resources],
  );

  const parseQuantity = (raw: string): number | null => {
    const quantity = Number(raw);
    if (!Number.isInteger(quantity) || quantity < 1) return null;
    return quantity;
  };

  const handleAdd = async (formEvent: FormEvent) => {
    formEvent.preventDefault();
    if (!eventId) return;

    if (!newResourceId) {
      setAddError('Select a resource');
      return;
    }
    const quantity = parseQuantity(newQuantity);
    if (quantity === null) {
      setAddError('Quantity must be a whole number of at least 1');
      return;
    }

    setAdding(true);
    setAddError(null);
    try {
      const created = await createRequirement(eventId, {
        resource: newResourceId,
        quantity,
      });
      setRequirements((previous) => [...previous, created]);
      setNewResourceId('');
      setNewQuantity('1');
    } catch (requestError) {
      setAddError(getErrorMessage(requestError));
    } finally {
      setAdding(false);
    }
  };

  const stepQuantity = async (requirement: RequirementRecord, delta: number) => {
    if (!eventId) return;
    const next = requirement.quantity + delta;
    if (next < 1) return;

    setBusyId(requirement._id);
    setListError(null);
    try {
      const updated = await updateRequirement(eventId, requirement._id, { quantity: next });
      setRequirements((previous) =>
        previous.map((item) => (item._id === updated._id ? updated : item)),
      );
    } catch (requestError) {
      setListError(getErrorMessage(requestError));
    } finally {
      setBusyId(null);
    }
  };

  const openEdit = (requirement: RequirementRecord) => {
    setEditError(null);
    setEditTarget(requirement);
    setEditForm({
      resourceId: refId(requirement.resource),
      quantity: String(requirement.quantity),
      priority: requirement.priority,
    });
  };

  const saveEdit = async () => {
    if (!eventId || !editTarget) return;

    if (!editForm.resourceId) {
      setEditError('Select a resource');
      return;
    }
    const quantity = parseQuantity(editForm.quantity);
    if (quantity === null) {
      setEditError('Quantity must be a whole number of at least 1');
      return;
    }

    setSavingEdit(true);
    setEditError(null);
    try {
      const updated = await updateRequirement(eventId, editTarget._id, {
        resource: editForm.resourceId,
        quantity,
        priority: editForm.priority,
      });
      setRequirements((previous) =>
        previous.map((item) => (item._id === updated._id ? updated : item)),
      );
      setEditTarget(null);
    } catch (requestError) {
      setEditError(getErrorMessage(requestError));
    } finally {
      setSavingEdit(false);
    }
  };

  const confirmDelete = async () => {
    if (!eventId || !deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteRequirement(eventId, deleteTarget._id);
      setRequirements((previous) => previous.filter((item) => item._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (requestError) {
      setDeleteError(getErrorMessage(requestError));
    } finally {
      setDeleting(false);
    }
  };

  const columns: TableColumn<RequirementRecord>[] = [
    {
      key: 'resource',
      header: 'Resource',
      render: (row) => (
        <span className="font-medium text-slate-900">
          {resolveName(row.resource, resourceNames, 'Unknown resource')}
        </span>
      ),
    },
    {
      key: 'quantity',
      header: 'Quantity',
      render: (row) => (
        <div className="inline-flex items-center gap-2">
          <button
            type="button"
            aria-label={`Decrease quantity of ${resolveName(row.resource, resourceNames)}`}
            disabled={busyId === row._id || row.quantity <= 1}
            onClick={() => void stepQuantity(row, -1)}
            className="grid h-7 w-7 place-items-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            −
          </button>
          <span className="w-8 text-center text-sm font-medium text-slate-900">{row.quantity}</span>
          <button
            type="button"
            aria-label={`Increase quantity of ${resolveName(row.resource, resourceNames)}`}
            disabled={busyId === row._id}
            onClick={() => void stepQuantity(row, 1)}
            className="grid h-7 w-7 place-items-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            +
          </button>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (row) => <Badge tone={priorityTones[row.priority]}>{row.priority}</Badge>,
    },
    {
      key: 'requiredDate',
      header: 'Required',
      render: (row) => formatDate(row.requiredDate),
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

  if (loading) {
    return <LoadingState message="Loading requirements..." />;
  }

  if (notFound) {
    return (
      <>
        <PageHeader title="Event Requirements" />
        <EmptyState
          title="Event not found"
          description="This event may have been deleted."
          action={<Button onClick={() => navigate('/management/events')}>Back to events</Button>}
        />
      </>
    );
  }

  if (loadError || !event) {
    return (
      <>
        <PageHeader title="Event Requirements" />
        <ErrorState
          message={loadError ?? 'Unable to load requirements.'}
          onRetry={() => void load()}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Event Requirements"
        description={`Resources needed for ${event.name}`}
        actions={
          <Button variant="secondary" onClick={() => navigate(`/management/events/${event._id}`)}>
            Back to event
          </Button>
        }
      />

      <Card>
        <form onSubmit={(formEvent) => void handleAdd(formEvent)} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Select
              label="Resource"
              value={newResourceId}
              onChange={(changeEvent) => {
                setNewResourceId(changeEvent.target.value);
                setAddError(null);
              }}
              options={resourceOptions}
            />
          </div>
          <div className="w-full sm:w-32">
            <Input
              label="Quantity"
              type="number"
              min={1}
              step={1}
              value={newQuantity}
              onChange={(changeEvent) => {
                setNewQuantity(changeEvent.target.value);
                setAddError(null);
              }}
            />
          </div>
          <Button type="submit" disabled={adding || resources.length === 0}>
            {adding ? 'Adding…' : 'Add Requirement'}
          </Button>
        </form>
        {addError && <p className="mt-2 text-sm text-red-600">{addError}</p>}
        {resources.length === 0 && !addError && (
          <p className="mt-2 text-sm text-slate-500">
            No resources exist yet. Create resources first to add requirements.
          </p>
        )}
      </Card>

      <div className="mt-6">
        {listError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {listError}
          </div>
        )}

        {requirements.length === 0 ? (
          <EmptyState
            title="No requirements yet"
            description="Select a resource and quantity above to add the first requirement."
          />
        ) : (
          <Table
            columns={columns}
            rows={requirements}
            rowKey={(row) => row._id}
            emptyMessage="No requirements found."
          />
        )}
      </div>

      {/* Edit requirement */}
      <Modal
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
        title="Edit requirement"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditTarget(null)} disabled={savingEdit}>
              Cancel
            </Button>
            <Button onClick={() => void saveEdit()} disabled={savingEdit}>
              {savingEdit ? 'Saving…' : 'Save Changes'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Resource"
            value={editForm.resourceId}
            onChange={(changeEvent) => {
              setEditForm((previous) => ({ ...previous, resourceId: changeEvent.target.value }));
              setEditError(null);
            }}
            options={resourceOptions}
          />
          <Input
            label="Quantity"
            type="number"
            min={1}
            step={1}
            value={editForm.quantity}
            onChange={(changeEvent) => {
              setEditForm((previous) => ({ ...previous, quantity: changeEvent.target.value }));
              setEditError(null);
            }}
          />
          <Select
            label="Priority"
            value={editForm.priority}
            onChange={(changeEvent) => {
              setEditForm((previous) => ({
                ...previous,
                priority: changeEvent.target.value as RequirementPriority,
              }));
              setEditError(null);
            }}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
            ]}
          />
          {editError && <p className="text-sm text-red-600">{editError}</p>}
        </div>
      </Modal>

      {/* Delete requirement */}
      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete requirement"
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
          Remove{' '}
          <span className="font-semibold">
            {deleteTarget ? resolveName(deleteTarget.resource, resourceNames, 'this requirement') : ''}
          </span>{' '}
          from this event?
        </p>
        {deleteError && <p className="mt-2 text-sm text-red-600">{deleteError}</p>}
      </Modal>
    </>
  );
}
