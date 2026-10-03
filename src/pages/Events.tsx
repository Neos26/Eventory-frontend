import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Table from '../components/Table';
import type { TableColumn } from '../components/Table';
import SearchBar from '../components/SearchBar';
import Select from '../components/Select';
import DateRangeFilter from '../components/DateRangeFilter';
import FilterPanel from '../components/FilterPanel';
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
  refId,
  resolveName,
} from '../api/eventApi';
import type { EventRecord, EventStatus, OrganizationRecord, VenueRecord } from '../api/eventApi';
import { fetchBookings } from '../api/bookingApi';
import type { BookingRecord } from '../api/bookingApi';
import { formatDate, formatTime, withinDateRange } from '../utils/format';

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
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [orgFilter, setOrgFilter] = useState('all');
  const [venueFilter, setVenueFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<EventRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [eventList, organizationList, venueList, bookingList] = await Promise.all([
        fetchEvents(),
        fetchOrganizations(),
        fetchVenues(),
        fetchBookings().catch(() => [] as BookingRecord[]),
      ]);
      setEvents(eventList);
      setOrganizations(organizationList);
      setVenues(venueList);
      setBookings(bookingList);
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
  // Event id -> booker name, resolved from the populated booking records.
  const bookerByEvent = useMemo(() => {
    const map = new Map<string, string>();
    for (const booking of bookings) {
      if (typeof booking.eventId === 'string' || typeof booking.bookerId === 'string') continue;
      if (!map.has(booking.eventId._id)) {
        map.set(booking.eventId._id, booking.bookerId.name);
      }
    }
    return map;
  }, [bookings]);

  const orgFilterOptions = useMemo(
    () => [
      { value: 'all', label: 'All organizations' },
      ...organizations.map((organization) => ({ value: organization._id, label: organization.name })),
    ],
    [organizations],
  );

  const venueFilterOptions = useMemo(
    () => [
      { value: 'all', label: 'All venues' },
      ...venues.map((venue) => ({ value: venue._id, label: venue.name })),
    ],
    [venues],
  );

  const filteredEvents = useMemo(() => {
    const search = query.trim().toLowerCase();
    return events.filter((event) => {
      if (statusFilter !== 'all' && event.status !== statusFilter) return false;
      if (orgFilter !== 'all' && refId(event.organization) !== orgFilter) return false;
      if (venueFilter !== 'all' && refId(event.venue) !== venueFilter) return false;
      if (!withinDateRange(event.startDate, dateFrom, dateTo)) return false;
      if (!search) return true;
      const haystack = [
        event.name,
        resolveName(event.organization, orgNames),
        resolveName(event.venue, venueNames, 'Unassigned'),
        bookerByEvent.get(event._id) ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(search);
    });
  }, [
    events,
    query,
    statusFilter,
    orgFilter,
    venueFilter,
    dateFrom,
    dateTo,
    orgNames,
    venueNames,
    bookerByEvent,
  ]);

  const activeFilters =
    (statusFilter !== 'all' ? 1 : 0) +
    (orgFilter !== 'all' ? 1 : 0) +
    (venueFilter !== 'all' ? 1 : 0) +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0);

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
      key: 'booker',
      header: 'Booker',
      render: (row) => bookerByEvent.get(row._id) ?? <span className="text-slate-400">—</span>,
    },
    {
      key: 'date',
      header: 'Date',
      render: (row) => (
        <div className="text-xs leading-5">
          <p className="text-slate-700">{formatDate(row.startDate)}</p>
          <p className="text-slate-500">
            {formatTime(row.startDate)} - {formatTime(row.endDate)}
          </p>
        </div>
      ),
    },
    {
      key: 'venue',
      header: 'Venue',
      render: (row) => resolveName(row.venue, venueNames, 'Unassigned'),
    },
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
          <Button variant="secondary" size="sm" onClick={() => navigate(`/management/events/${row._id}`)}>
            View
          </Button>
          <Button variant="secondary" size="sm" onClick={() => navigate(`/management/events/${row._id}/edit`)}>
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

  return (
    <>
      <PageHeader
        title="Events"
        description="All events with their status, dates and venue."
        actions={
          <Button onClick={() => navigate('/management/events/create')}>New Event</Button>
        }
      />

      <FilterPanel
        search={<SearchBar value={query} onChange={setQuery} placeholder="Search events..." />}
        activeCount={activeFilters}
      >
        <div className="w-full sm:w-44">
          <Select
            aria-label="Filter by organization"
            value={orgFilter}
            onChange={(event) => setOrgFilter(event.target.value)}
            options={orgFilterOptions}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            aria-label="Filter by venue"
            value={venueFilter}
            onChange={(event) => setVenueFilter(event.target.value)}
            options={venueFilterOptions}
          />
        </div>
        <DateRangeFilter
          from={dateFrom}
          to={dateTo}
          onFromChange={setDateFrom}
          onToChange={setDateTo}
        />
        <div className="w-full sm:w-48">
          <Select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            options={statusOptions}
          />
        </div>
      </FilterPanel>

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
              action={<Button onClick={() => navigate('/management/events/create')}>Create event</Button>}
            />
          ) : filteredEvents.length === 0 ? (
            <EmptyState
              title="No matching events"
              description="Try a different search term or filters."
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQuery('');
                    setStatusFilter('all');
                    setOrgFilter('all');
                    setVenueFilter('all');
                    setDateFrom('');
                    setDateTo('');
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
