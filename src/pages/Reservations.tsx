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
import ReservationForm from '../components/ReservationForm';
import useDocumentTitle from '../hooks/useDocumentTitle';
import {
  cancelReservation,
  createReservation,
  fetchReservations,
  isActiveReservation,
  releaseReservation,
  updateReservation,
} from '../api/reservations';
import type {
  ReservationPayload,
  ReservationRecord,
  ReservationStatus,
} from '../api/reservations';
import { fetchEvents, getErrorMessage, refId, resolveName } from '../api/eventApi';
import type { EventRecord } from '../api/eventApi';
import { fetchResources } from '../api/resourceApi';
import type { ResourceRecord } from '../api/resourceApi';
import { reservationToFormValues } from '../schemas/reservationForm';
import { formatDate, formatTime } from '../utils/format';

const statusTones: Record<ReservationStatus, 'gray' | 'indigo' | 'amber' | 'green' | 'red'> = {
  reserved: 'indigo',
  issued: 'amber',
  returned: 'green',
  cancelled: 'red',
};

const statusOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'issued', label: 'Issued' },
  { value: 'returned', label: 'Returned' },
  { value: 'cancelled', label: 'Cancelled' },
];

interface ActionTarget {
  reservation: ReservationRecord;
  action: 'cancel' | 'release';
}

export default function Reservations() {
  useDocumentTitle('Reservations');
  const navigate = useNavigate();

  const [reservations, setReservations] = useState<ReservationRecord[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [resources, setResources] = useState<ResourceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ReservationRecord | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [actionTarget, setActionTarget] = useState<ActionTarget | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reservationList, eventList, resourceList] = await Promise.all([
        fetchReservations(),
        fetchEvents(),
        fetchResources(),
      ]);
      setReservations(reservationList);
      setEvents(eventList);
      setResources(resourceList);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const eventNames = useMemo(
    () => new Map(events.map((event) => [event._id, event.name])),
    [events],
  );
  const resourceNames = useMemo(
    () => new Map(resources.map((resource) => [resource._id, resource.name])),
    [resources],
  );

  const eventFilterOptions = useMemo(
    () => [
      { value: 'all', label: 'All events' },
      ...events.map((event) => ({ value: event._id, label: event.name })),
    ],
    [events],
  );

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return reservations.filter((reservation) => {
      if (statusFilter !== 'all' && reservation.status !== statusFilter) return false;
      if (eventFilter !== 'all' && refId(reservation.event) !== eventFilter) return false;
      if (!search) return true;
      const haystack = [
        resolveName(reservation.event, eventNames),
        resolveName(reservation.resource, resourceNames),
        reservation.notes ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(search);
    });
  }, [reservations, query, eventFilter, statusFilter, eventNames, resourceNames]);

  const openCreate = () => {
    setFormError(null);
    setCreateOpen(true);
  };

  const openEdit = (reservation: ReservationRecord) => {
    setFormError(null);
    setEditTarget(reservation);
  };

  const handleFormSubmit = async (payload: ReservationPayload) => {
    setFormSubmitting(true);
    setFormError(null);
    try {
      if (editTarget) {
        const updated = await updateReservation(editTarget._id, payload);
        setReservations((previous) =>
          previous.map((reservation) => (reservation._id === updated._id ? updated : reservation)),
        );
        setEditTarget(null);
      } else {
        const created = await createReservation(payload);
        setReservations((previous) => [created, ...previous]);
        setCreateOpen(false);
      }
    } catch (requestError) {
      setFormError(getErrorMessage(requestError));
    } finally {
      setFormSubmitting(false);
    }
  };

  const confirmAction = async () => {
    if (!actionTarget) return;
    setActionBusy(true);
    setActionError(null);
    try {
      const updated =
        actionTarget.action === 'cancel'
          ? await cancelReservation(actionTarget.reservation._id)
          : await releaseReservation(actionTarget.reservation._id);
      setReservations((previous) =>
        previous.map((reservation) => (reservation._id === updated._id ? updated : reservation)),
      );
      setActionTarget(null);
    } catch (requestError) {
      setActionError(getErrorMessage(requestError));
    } finally {
      setActionBusy(false);
    }
  };

  const columns: TableColumn<ReservationRecord>[] = [
    {
      key: 'event',
      header: 'Event',
      render: (row) => {
        const eventId = refId(row.event);
        const label = resolveName(row.event, eventNames, 'Unknown event');
        return eventId ? (
          <button
            type="button"
            onClick={() => navigate(`/management/events/${eventId}`)}
            className="font-medium text-slate-900 hover:text-brand-700 hover:underline"
          >
            {label}
          </button>
        ) : (
          <span className="font-medium text-slate-900">{label}</span>
        );
      },
    },
    {
      key: 'resource',
      header: 'Resource',
      render: (row) => resolveName(row.resource, resourceNames, 'Unknown resource'),
    },
    { key: 'quantity', header: 'Quantity', render: (row) => row.quantity },
    { key: 'date', header: 'Date', render: (row) => formatDate(row.reservedFrom) },
    {
      key: 'time',
      header: 'Time',
      render: (row) => `${formatTime(row.reservedFrom)} – ${formatTime(row.reservedUntil)}`,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge tone={statusTones[row.status]}>{row.status}</Badge>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => {
        if (row.status === 'reserved' || row.status === 'issued') {
          return (
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
                Edit
              </Button>
              {row.status === 'reserved' ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => {
                    setActionError(null);
                    setActionTarget({ reservation: row, action: 'cancel' });
                  }}
                >
                  Cancel
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => {
                    setActionError(null);
                    setActionTarget({ reservation: row, action: 'release' });
                  }}
                >
                  Release
                </Button>
              )}
            </div>
          );
        }
        return <span className="text-slate-400">—</span>;
      },
    },
  ];

  const clearFilters = () => {
    setQuery('');
    setEventFilter('all');
    setStatusFilter('all');
  };

  const closeForm = () => {
    setCreateOpen(false);
    setEditTarget(null);
  };

  return (
    <>
      <PageHeader
        title="Reservations"
        description="Booked resources, time periods and their statuses."
        actions={<Button onClick={openCreate}>New Reservation</Button>}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar value={query} onChange={setQuery} placeholder="Search reservations..." />
        <div className="w-full sm:w-56">
          <Select
            aria-label="Filter by event"
            value={eventFilter}
            onChange={(event) => setEventFilter(event.target.value)}
            options={eventFilterOptions}
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
        <LoadingState message="Loading reservations..." />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : (
        <>
          {actionError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {actionError}
            </div>
          )}
          {reservations.length === 0 ? (
            <EmptyState
              title="No reservations yet"
              description="Reserve resources for an event to see them here."
              action={<Button onClick={openCreate}>Create reservation</Button>}
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No matching reservations"
              description="Try a different search term, event or status filter."
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
              emptyMessage="No reservations found."
            />
          )}
        </>
      )}

      {/* Create / edit reservation */}
      <Modal
        open={createOpen || editTarget !== null}
        onClose={closeForm}
        title={editTarget ? 'Edit reservation' : 'New reservation'}
      >
        <ReservationForm
          key={editTarget?._id ?? 'create'}
          events={events}
          resources={resources}
          submitLabel={editTarget ? 'Save Changes' : 'Create Reservation'}
          submitting={formSubmitting}
          error={formError}
          initialValues={editTarget ? reservationToFormValues(editTarget) : undefined}
          heldQuantity={editTarget && isActiveReservation(editTarget) ? editTarget.quantity : 0}
          onSubmit={(payload) => void handleFormSubmit(payload)}
          onCancel={closeForm}
        />
      </Modal>

      {/* Cancel / release confirmation */}
      <Modal
        open={actionTarget !== null}
        onClose={() => setActionTarget(null)}
        title={actionTarget?.action === 'release' ? 'Release reservation' : 'Cancel reservation'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setActionTarget(null)} disabled={actionBusy}>
              Keep it
            </Button>
            <Button variant="danger" onClick={() => void confirmAction()} disabled={actionBusy}>
              {actionBusy
                ? 'Working…'
                : actionTarget?.action === 'release'
                  ? 'Release'
                  : 'Cancel reservation'}
            </Button>
          </>
        }
      >
        <p>
          {actionTarget?.action === 'release' ? (
            <>
              Mark{' '}
              <span className="font-semibold">
                {actionTarget
                  ? `${resolveName(actionTarget.reservation.resource, resourceNames, 'this resource')} × ${actionTarget.reservation.quantity}`
                  : ''}
              </span>{' '}
              as returned? The stock becomes available again.
            </>
          ) : (
            <>
              Cancel the reservation of{' '}
              <span className="font-semibold">
                {actionTarget
                  ? `${resolveName(actionTarget.reservation.resource, resourceNames, 'this resource')} × ${actionTarget.reservation.quantity}`
                  : ''}
              </span>
              ? This cannot be undone.
            </>
          )}
        </p>
        {actionError && <p className="mt-2 text-sm text-red-600">{actionError}</p>}
      </Modal>
    </>
  );
}
