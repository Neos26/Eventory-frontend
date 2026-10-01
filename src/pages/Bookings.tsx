import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, RefreshCw } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import SearchBar from '../components/SearchBar';
import Select from '../components/Select';
import Table from '../components/Table';
import type { TableColumn } from '../components/Table';
import Button from '../components/Button';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { BookingStatusBadge } from '../components/StatusBadges';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { bookingEvent, fetchBookings } from '../api/bookingApi';
import { fetchOrganizations, getErrorMessage, resolveName } from '../api/eventApi';
import { fetchVenues } from '../api/venueApi';
import type { BookingRecord, BookingStatus } from '../types/booking';
import { formatDate } from '../utils/format';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bookingList, organizationList, venueList] = await Promise.all([
        fetchBookings(),
        fetchOrganizations().catch(() => []),
        fetchVenues().catch(() => []),
      ]);
      bookingList.sort(
        (a, b) =>
          new Date(b.submittedAt ?? b.createdAt).getTime() -
          new Date(a.submittedAt ?? a.createdAt).getTime(),
      );
      setBookings(bookingList);
      setOrganizations(new Map(organizationList.map((org) => [org._id, org.name])));
      setVenues(new Map(venueList.map((venue) => [venue._id, venue.name])));
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

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return bookings.filter((booking) => {
      if (statusFilter !== 'all' && booking.status !== statusFilter) return false;
      if (!search) return true;
      const event = bookingEvent(booking);
      const bookerName =
        typeof booking.bookerId === 'string' ? '' : booking.bookerId.name.toLowerCase();
      const haystack = [
        event?.name ?? '',
        bookerName,
        event ? resolveName(event.organization, organizations) : '',
        venueNameFor(event),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(search);
    });
  }, [bookings, query, statusFilter, organizations, venueNameFor]);

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
          variant="ghost"
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

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search by event, booker, organization or venue..."
        />
        <div className="w-full sm:w-48">
          <Select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            options={STATUS_OPTIONS}
          />
        </div>
      </div>

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
        </Card>
      ) : (
        <Table columns={columns} rows={filtered} rowKey={(row) => row._id} emptyMessage="No requests found." />
      )}
    </>
  );
}
