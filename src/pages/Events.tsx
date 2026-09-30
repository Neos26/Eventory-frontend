import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Table from '../components/Table';
import type { TableColumn } from '../components/Table';
import SearchBar from '../components/SearchBar';
import Select from '../components/Select';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import Modal from '../components/Modal';
import useDocumentTitle from '../hooks/useDocumentTitle';
import {
  deleteEvent,
  fetchEvents,
  fetchOrganizations,
  fetchVenues,
  getErrorMessage,
  resolveName,
} from '../api/events';
import type { EventRecord, EventStatus, OrganizationRecord, VenueRecord } from '../api/events';
import { formatDate, formatTime } from '../utils/format';

const statusTones: Record<EventStatus, 'gray' | 'indigo' | 'green' | 'red'> = {
  draft: 'gray',
  planned: 'indigo',
  ongoing: 'green',
  completed: 'gray',
  cancelled: 'red',
};

const statusOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'planned', label: 'Planned' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function Events() {
  useDocumentTitle('Events');
  const navigate = useNavigate();

  const [events, setEvents] = useState<EventRecord[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([]);
  const [venues, setVenues] = useState<VenueRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [deleteTarget, setDeleteTarget] = useState<EventRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [eventList, organizationList, venueList] = await Promise.all([
        fetchEvents(),
        fetchOrganizations(),
        fetchVenues(),
      ]);
      setEvents(eventList);
      setOrganizations(organizationList);
      setVenues(venueList);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const orgNames = useMemo(
    () => new Map(organizations.map((organization) => [organization._id, organization.name])),
    [organizations],
  );
  const venueNames = useMemo(
    () => new Map(venues.map((venue) => [venue._id, venue.name])),
    [venues],
  );

  const filteredEvents = useMemo(() => {
    const search = query.trim().toLowerCase();
    return events.filter((event) => {
      if (statusFilter !== 'all' && event.status !== statusFilter) return false;
      if (!search) return true;
      const haystack = [
        event.name,
        resolveName(event.organization, orgNames),
        resolveName(event.venue, venueNames, 'Unassigned'),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(search);
    });
  }, [events, query, statusFilter, orgNames, venueNames]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteEvent(deleteTarget._id);
      setEvents((previous) => previous.filter((event) => event._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (requestError) {
      setDeleteError(getErrorMessage(requestError));
    } finally {
      setDeleting(false);
    }
  };

  const columns: TableColumn<EventRecord>[] = [
    {
      key: 'name',
      header: 'Event',
      render: (row) => <span className="font-medium text-slate-900">{row.name}</span>,
    },
    {
      key: 'organization',
      header: 'Organization',
      render: (row) => resolveName(row.organization, orgNames),
    },
    {
      key: 'venue',
      header: 'Venue',
      render: (row) => resolveName(row.venue, venueNames, 'Unassigned'),
    },
    { key: 'date', header: 'Date', render: (row) => formatDate(row.startDate) },
    { key: 'start', header: 'Start time', render: (row) => formatTime(row.startDate) },
    { key: 'end', header: 'End time', render: (row) => formatTime(row.endDate) },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge tone={statusTones[row.status]}>{row.status}</Badge>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/events/${row._id}`)}>
            View
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/events/${row._id}/edit`)}>
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

  return (
    <>
      <PageHeader
        title="Events"
        description="All events with their status, dates and venue."
        actions={
          <Button onClick={() => navigate('/events/create')}>New Event</Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search events..."
        />
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
        <LoadingState message="Loading events..." />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : (
        <>
          {deleteError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {deleteError}
            </div>
          )}
          {events.length === 0 ? (
            <EmptyState
              title="No events yet"
              description="Create your first event to start planning."
              action={<Button onClick={() => navigate('/events/create')}>Create event</Button>}
            />
          ) : filteredEvents.length === 0 ? (
            <EmptyState
              title="No matching events"
              description="Try a different search term or status filter."
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQuery('');
                    setStatusFilter('all');
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <Table
              columns={columns}
              rows={filteredEvents}
              rowKey={(row) => row._id}
              emptyMessage="No events found."
            />
          )}
        </>
      )}

      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete event"
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
      </Modal>
    </>
  );
}
