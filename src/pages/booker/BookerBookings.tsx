import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ban, Eye, Inbox, RefreshCw } from 'lucide-react';
import {
  bookingEventId,
  bookingEventName,
  cancelBooking,
  fetchBookings,
} from '../../api/bookingApi';
import { getErrorMessage } from '../../api/eventApi';
import { fetchVenues } from '../../api/venueApi';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import Button from '../../components/Button';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import LoadingState from '../../components/LoadingState';
import Modal from '../../components/Modal';
import PageHeader from '../../components/PageHeader';
import { BookingStatusBadge } from '../../components/StatusBadges';
import { formatDate } from '../../utils/format';
import type { BookingRecord, BookingStatus } from '../../types/booking';

type Filter = 'All' | BookingStatus;

const FILTERS: Filter[] = ['All', 'Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed'];

export default function BookerBookings() {
  useDocumentTitle('My Bookings');

  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [venueNames, setVenueNames] = useState<Map<string, string>>(new Map());
  const [filter, setFilter] = useState<Filter>('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [cancelling, setCancelling] = useState<BookingRecord | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bookingList, venues] = await Promise.all([
        fetchBookings(),
        fetchVenues().catch(() => []),
      ]);
      bookingList.sort(
        (a, b) =>
          new Date(b.submittedAt ?? b.createdAt).getTime() -
          new Date(a.submittedAt ?? a.createdAt).getTime(),
      );
      setBookings(bookingList);
      setVenueNames(new Map(venues.map((venue) => [venue._id, venue.name])));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { All: bookings.length };
    for (const status of FILTERS.slice(1)) {
      map[status] = bookings.filter((booking) => booking.status === status).length;
    }
    return map;
  }, [bookings]);

  const visible = useMemo(
    () => (filter === 'All' ? bookings : bookings.filter((booking) => booking.status === filter)),
    [bookings, filter],
  );

  const venueOf = (booking: BookingRecord): string => {
    const event = typeof booking.eventId === 'string' ? null : booking.eventId;
    const venueRef = event?.venue;
    if (!venueRef) return 'No venue';
    if (typeof venueRef === 'string') return venueNames.get(venueRef) ?? 'Assigned venue';
    return venueRef.name;
  };

  const handleCancel = async () => {
    if (!cancelling) return;
    setSaving(true);
    setActionError(null);
    try {
      const updated = await cancelBooking(cancelling._id);
      setBookings((current) =>
        current.map((booking) => (booking._id === updated._id ? updated : booking)),
      );
      setCancelling(null);
    } catch (err) {
      setActionError(getErrorMessage(err));
      setCancelling(null);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState message="Loading bookings..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
      <PageHeader
        title="My Bookings"
        description="Track every booking request and its review status."
        actions={
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </button>
        }
      />

      {actionError && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {actionError}
        </div>
      )}

      {/* Filter pills */}
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((status) => {
          const active = filter === status;
          return (
            <button
              key={status}
              type="button"
              onClick={() => setFilter(status)}
              aria-pressed={active}
              className={`cursor-pointer rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                active
                  ? 'bg-brand-700 text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {status}
              <span className={active ? 'ml-1.5 text-brand-100' : 'ml-1.5 text-slate-400'}>
                {counts[status] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {bookings.length === 0 ? (
        <Card>
          <EmptyState
            title="No bookings yet"
            description="Create an event and submit it for approval to see bookings here."
            action={
              <Link
                to="/booker/events/create"
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
              >
                Create Event
              </Link>
            }
          />
        </Card>
      ) : visible.length === 0 ? (
        <Card>
          <EmptyState
            title={`No ${filter.toLowerCase()} bookings`}
            description="Try another filter to see your other requests."
          />
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden overflow-x-auto p-0! md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">Event</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Venue</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Submitted</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((booking) => (
                  <tr key={booking._id} className="border-b border-slate-100 last:border-0">
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-slate-800">
                        {bookingEventName(booking)}
                      </span>
                      {booking.status === 'Rejected' && booking.rejectionReason && (
                        <p className="mt-0.5 text-xs text-red-600">
                          Reason: {booking.rejectionReason}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {(() => {
                        const event = typeof booking.eventId === 'string' ? null : booking.eventId;
                        return event ? formatDate(event.startDate) : '—';
                      })()}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{venueOf(booking)}</td>
                    <td className="px-5 py-3.5">
                      <BookingStatusBadge status={booking.status} />
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {formatDate(booking.submittedAt ?? booking.createdAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1.5">
                        <Link
                          to={`/booker/events/${bookingEventId(booking)}`}
                          aria-label={`View ${bookingEventName(booking)}`}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                        >
                          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                          View
                        </Link>
                        {booking.status === 'Pending' && (
                          <button
                            type="button"
                            onClick={() => {
                              setCancelling(booking);
                              setActionError(null);
                            }}
                            aria-label={`Cancel ${bookingEventName(booking)}`}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                          >
                            <Ban className="h-3.5 w-3.5" aria-hidden="true" />
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {visible.map((booking) => {
              const event = typeof booking.eventId === 'string' ? null : booking.eventId;
              return (
                <Card key={booking._id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">{bookingEventName(booking)}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {event ? formatDate(event.startDate) : '—'} · {venueOf(booking)}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Submitted {formatDate(booking.submittedAt ?? booking.createdAt)}
                      </p>
                    </div>
                    <BookingStatusBadge status={booking.status} />
                  </div>

                  {booking.status === 'Rejected' && booking.rejectionReason && (
                    <p className="mt-2 text-xs text-red-600">
                      Reason: {booking.rejectionReason}
                    </p>
                  )}

                  <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                    <Link
                      to={`/booker/events/${bookingEventId(booking)}`}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      View
                    </Link>
                    {booking.status === 'Pending' && (
                      <button
                        type="button"
                        onClick={() => {
                          setCancelling(booking);
                          setActionError(null);
                        }}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                      >
                        <Ban className="h-3.5 w-3.5" aria-hidden="true" />
                        Cancel
                      </button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {bookings.length > 0 && visible.length === 0 && (
        <p className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
          <Inbox className="h-3.5 w-3.5" aria-hidden="true" />
          Nothing here right now.
        </p>
      )}

      {/* Cancel confirmation */}
      <Modal
        open={cancelling !== null}
        onClose={() => setCancelling(null)}
        title="Cancel this booking?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelling(null)} disabled={saving}>
              Keep Booking
            </Button>
            <Button variant="danger" onClick={handleCancel} disabled={saving}>
              {saving ? 'Cancelling...' : 'Cancel Booking'}
            </Button>
          </>
        }
      >
        <p>
          {cancelling
            ? `${bookingEventName(cancelling)} will lose its pending request. You can submit a new booking later.`
            : ''}
        </p>
      </Modal>
    </>
  );
}
