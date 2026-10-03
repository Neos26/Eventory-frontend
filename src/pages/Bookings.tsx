import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, RefreshCw } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import SearchBar from '../components/SearchBar';
import Select from '../components/Select';
import DateRangeFilter from '../components/DateRangeFilter';
import FilterPanel from '../components/FilterPanel';
import Table from '../components/Table';
import type { TableColumn } from '../components/Table';
import Button from '../components/Button';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { BookingStatusBadge } from '../components/StatusBadges';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { bookingEvent, bookingEventId, fetchBookings } from '../api/bookingApi';
import { fetchEvents, fetchOrganizations, getErrorMessage, refId, resolveName } from '../api/eventApi';
import { fetchVenues } from '../api/venueApi';
import type { BookingRecord, BookingStatus } from '../types/booking';
import type { EventRecord } from '../types/event';
import { formatDate, withinDateRange } from '../utils/format';

type StatusFilter = 'all' | BookingStatus;

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Rejected', label: 'Rejected' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'Completed', label: 'Completed' },
];

export default function Bookings() {
  useDocumentTitle('Booking Requests');
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [organizations, setOrganizations] = useState<Map<string, string>>(new Map());
  const [venues, setVenues] = useState<Map<string, string>>(new Map());
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [orgFilter, setOrgFilter] = useState('all');
  const [eventFilter, setEventFilter] = useState('all');
  const [venueFilter, setVenueFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bookingList, organizationList, venueList, eventList] = await Promise.all([
        fetchBookings(),
        fetchOrganizations().catch(() => []),
        fetchVenues().catch(() => []),
        fetchEvents().catch(() => []),
      ]);
      bookingList.sort(
        (a, b) =>
          new Date(b.submittedAt ?? b.createdAt).getTime() -
          new Date(a.submittedAt ?? a.createdAt).getTime(),
      );
      setBookings(bookingList);
      setOrganizations(new Map(organizationList.map((org) => [org._id, org.name])));
      setVenues(new Map(venueList.map((venue) => [venue._id, venue.name])));
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

  const venueOf = (booking: BookingRecord): string => venueNameFor(bookingEvent(booking));

  const venueNameFor = useCallback(
    (eventRef: ReturnType<typeof bookingEvent>): string => {
      if (!eventRef?.venue) return 'No venue';
      if (typeof eventRef.venue === 'string') return venues.get(eventRef.venue) ?? 'Assigned venue';
      return eventRef.venue.name;
    },
    [venues],
  );

  const eventById = useMemo(
    () => new Map(events.map((event) => [event._id, event])),
    [events],
  );

  const orgFilterOptions = useMemo(
    () => [
      { value: 'all', label: 'All organizations' },
      ...[...organizations].map(([id, name]) => ({ value: id, label: name })),
    ],
    [organizations],
  );

  const eventFilterOptions = useMemo(
    () => [
      { value: 'all', label: 'All events' },
      ...events.map((event) => ({ value: event._id, label: event.name })),
    ],
    [events],
  );

  const venueFilterOptions = useMemo(
    () => [
      { value: 'all', label: 'All venues' },
      ...[...venues].map(([id, name]) => ({ value: id, label: name })),
    ],
    [venues],
  );

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return bookings.filter((booking) => {
      if (statusFilter !== 'all' && booking.status !== statusFilter) return false;
      const embedded = bookingEvent(booking);
      const full = eventById.get(bookingEventId(booking));
      if (orgFilter !== 'all' && refId(embedded?.organization ?? full?.organization) !== orgFilter) {
        return false;
      }
      if (eventFilter !== 'all' && bookingEventId(booking) !== eventFilter) return false;
      if (venueFilter !== 'all' && refId(embedded?.venue ?? full?.venue) !== venueFilter) {
        return false;
      }
      if (!withinDateRange(embedded?.startDate ?? full?.startDate, dateFrom, dateTo)) return false;
      if (!search) return true;
      const bookerName =
        typeof booking.bookerId === 'string' ? '' : booking.bookerId.name.toLowerCase();
      const haystack = [
        embedded?.name ?? '',
        bookerName,
        embedded ? resolveName(embedded.organization, organizations) : '',
        venueNameFor(embedded),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(search);
    });
  }, [
    bookings,
    query,
    statusFilter,
    orgFilter,
    eventFilter,
    venueFilter,
    dateFrom,
    dateTo,
    eventById,
    organizations,
    venueNameFor,
  ]);

  const activeFilters =
    (statusFilter !== 'all' ? 1 : 0) +
    (orgFilter !== 'all' ? 1 : 0) +
    (eventFilter !== 'all' ? 1 : 0) +
    (venueFilter !== 'all' ? 1 : 0) +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0);

  const columns: TableColumn<BookingRecord>[] = [
    {
      key: 'event',
      header: 'Event',
      render: (row) => <span className="font-medium text-slate-900">{bookingEvent(row)?.name ?? 'Unknown event'}</span>,
    },
    {
      key: 'booker',
      header: 'Booker',
      render: (row) =>
        typeof row.bookerId === 'string' ? 'Booker' : (
          <div className="text-xs leading-5">
            <p className="text-slate-700">{row.bookerId.name}</p>
            <p className="text-slate-400">{row.bookerId.email}</p>
          </div>
        ),
    },
    {
      key: 'organization',
      header: 'Organization',
      render: (row) => {
        const event = bookingEvent(row);
        return event ? resolveName(event.organization, organizations) : '—';
      },
    },
    {
      key: 'date',
      header: 'Date',
      render: (row) => {
        const event = bookingEvent(row);
        return event ? formatDate(event.startDate) : '—';
      },
    },
    { key: 'venue', header: 'Venue', render: (row) => venueOf(row) },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <BookingStatusBadge status={row.status} />,
    },
    {
      key: 'submitted',
      header: 'Submitted',
      render: (row) => formatDate(row.submittedAt ?? row.createdAt),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <Button
          variant="secondary"
          size="sm"
          className="cursor-pointer"
          onClick={() => navigate(`/management/bookings/${row._id}`)}
        >
          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
          View
        </Button>
      ),
    },
  ];

  if (loading) return <LoadingState message="Loading booking requests..." />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  return (
    <>
      <PageHeader
        title="Booking Requests"
        description="Review, approve or reject booking requests from bookers."
        actions={
          <Button variant="secondary" onClick={() => void load()}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </Button>
        }
      />

      <FilterPanel
        search={
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search by event, booker, organization or venue..."
          />
        }
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
            aria-label="Filter by event"
            value={eventFilter}
            onChange={(event) => setEventFilter(event.target.value)}
            options={eventFilterOptions}
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
        <div className="w-full sm:w-44">
          <Select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            options={STATUS_OPTIONS}
          />
        </div>
      </FilterPanel>

      {bookings.length === 0 ? (
        <Card>
          <EmptyState
            title="No booking requests yet"
            description="Requests submitted by bookers will appear here for review."
          />
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            title="No matching requests"
            description="Try a different search term or filters."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setQuery('');
                  setStatusFilter('all');
                  setOrgFilter('all');
                  setEventFilter('all');
                  setVenueFilter('all');
                  setDateFrom('');
                  setDateTo('');
                }}
              >
                Clear filters
              </Button>
            }
          />
        </Card>
      ) : (
        <Table columns={columns} rows={filtered} rowKey={(row) => row._id} emptyMessage="No requests found." />
      )}
    </>
  );
}
