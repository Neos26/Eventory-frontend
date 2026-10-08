import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import BackButton from '../components/BackButton';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import useDocumentTitle from '../hooks/useDocumentTitle';
import {
  deleteEvent,
  fetchEvent,
  fetchOrganizations,
  fetchVenues,
  getErrorMessage,
  isNotFound,
  resolveName,
  updateEvent,
} from '../api/eventApi';
import {
  approvalConflictsOf,
  approveBooking,
  bookingEventId,
  fetchBookings,
  rejectBooking,
} from '../api/bookingApi';
import type { BookingConflict, BookingRecord } from '../api/bookingApi';
import type { EventRecord, EventStatus, OrganizationRecord, VenueRecord } from '../api/eventApi';
import { formatDate, formatTime } from '../utils/format';

const statusTones: Record<EventStatus, 'gray' | 'indigo' | 'green' | 'red'> = {
  pending: 'gray',
  approved: 'indigo',
  rejected: 'red',
  completed: 'gray',
  cancelled: 'red',
};

const statusHeadlines: Record<EventStatus, string> = {
  pending: 'Awaiting approval',
  approved: 'Approved and scheduled',
  rejected: 'Booking rejected',
  completed: 'Finished',
  cancelled: 'Cancelled',
};

const statusBlurb: Record<EventStatus, string> = {
  pending: 'Booking request submitted — waiting for management.',
  approved: 'Dates, venue and resources are locked in.',
  rejected: 'The booking was rejected — update the details and resubmit.',
  completed: 'This event has concluded.',
  cancelled: 'No longer going ahead — resources are released.',
};

const statusBanner: Record<EventStatus, string> = {
  pending: 'border-slate-200 bg-slate-50 text-slate-700',
  approved: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  rejected: 'border-red-200 bg-red-50 text-red-700',
  completed: 'border-slate-200 bg-slate-100 text-slate-700',
  cancelled: 'border-red-200 bg-red-50 text-red-700',
};

interface FieldProps {
  label: string;
  children: ReactNode;
}

function Field({ label, children }: FieldProps) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <div className="mt-1 text-sm font-medium text-slate-900">{children}</div>
    </div>
  );
}

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<EventRecord | null>(null);
  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([]);
  const [venues, setVenues] = useState<VenueRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Pending booking review - approve/reject live in the Actions card.
  const [pendingBooking, setPendingBooking] = useState<BookingRecord | null>(null);
  const [approving, setApproving] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewConflicts, setReviewConflicts] = useState<BookingConflict[]>([]);
  const [showReject, setShowReject] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [rejectError, setRejectError] = useState<string | null>(null);

  const [showComplete, setShowComplete] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  const [notice, setNotice] = useState<string | null>(null);

  useDocumentTitle(event?.name ?? 'Event');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setLoadError(null);
    setNotFound(false);
    try {
      const [eventRecord, organizationList, venueList, bookingList] = await Promise.all([
        fetchEvent(id),
        fetchOrganizations(),
        fetchVenues(),
        // Resilient: if this fails the decision buttons stay hidden.
        fetchBookings().catch(() => [] as BookingRecord[]),
      ]);
      setEvent(eventRecord);
      setOrganizations(organizationList);
      setVenues(venueList);
      setPendingBooking(
        bookingList.find((item) => item.status === 'Pending' && bookingEventId(item) === id) ??
          null,
      );
    } catch (requestError) {
      if (isNotFound(requestError)) {
        setNotFound(true);
      } else {
        setLoadError(getErrorMessage(requestError));
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const confirmDelete = async () => {
    if (!id) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteEvent(id);
      navigate('/management/events');
    } catch (requestError) {
      setDeleteError(getErrorMessage(requestError));
      setDeleting(false);
    }
  };

  // Completing returns every reservation to stock and marks the event's
  // approved booking as Completed (backend cascade).
  const confirmComplete = async () => {
    if (!id) return;
    setCompleting(true);
    setCompleteError(null);
    try {
      const updated = await updateEvent(id, { status: 'completed' });
      setEvent(updated);
      setShowComplete(false);
      setNotice('Event completed — resource reservations were returned to stock.');
    } catch (requestError) {
      setCompleteError(getErrorMessage(requestError));
    } finally {
      setCompleting(false);
    }
  };

  // Approving reserves the venue and resources; the event status follows
  // the booking to 'approved' on the backend.
  const handleApprove = async () => {
    if (!pendingBooking || !id) return;
    setApproving(true);
    setReviewError(null);
    setReviewConflicts([]);
    try {
      await approveBooking(pendingBooking._id);
      setPendingBooking(null);
      setEvent(await fetchEvent(id));
      setNotice('Booking approved — venue and resources are now reserved.');
    } catch (requestError) {
      setReviewError(getErrorMessage(requestError));
      setReviewConflicts(approvalConflictsOf(requestError) ?? []);
    } finally {
      setApproving(false);
    }
  };

  const openReject = () => {
    setRejectionReason('');
    setRejectError(null);
    setShowReject(true);
  };

  // Rejecting stores the reason for the booker; the event status follows
  // the booking to 'rejected' and stays resubmittable.
  const handleReject = async () => {
    if (!pendingBooking || !id) return;
    const reason = rejectionReason.trim();
    if (!reason) {
      setRejectError('A rejection reason is required.');
      return;
    }
    if (reason.length > 500) {
      setRejectError('Rejection reason must be 500 characters or fewer.');
      return;
    }
    setRejecting(true);
    setRejectError(null);
    try {
      await rejectBooking(pendingBooking._id, reason);
      setShowReject(false);
      setPendingBooking(null);
      setEvent(await fetchEvent(id));
      setNotice('Booking rejected — the booker can update the event and resubmit.');
    } catch (requestError) {
      setRejectError(getErrorMessage(requestError));
    } finally {
      setRejecting(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading event..." />;
  }

  if (notFound) {
    return (
      <>
        <BackButton to="/management/events" label="Back to events" />
        <PageHeader title="Event" />
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
        <BackButton to="/management/events" label="Back to events" />
        <PageHeader title="Event" />
        <ErrorState message={loadError ?? 'Unable to load this event.'} onRetry={() => void load()} />
      </>
    );
  }

  const orgNames = new Map(organizations.map((organization) => [organization._id, organization.name]));
  const venueNames = new Map(venues.map((venue) => [venue._id, venue.name]));

  return (
    <>
      <BackButton to="/management/events" label="Back to events" />
      <PageHeader
        title={event.name}
        description={`${event.category} · ${formatDate(event.startDate)}`}
      />

      {notice && (
        <div
          role="status"
          className="mb-6 flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          {notice}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Main: full event information */}
        <div className="space-y-6 lg:col-span-3">
          <Card>
            <h2 className="mb-4 font-semibold text-slate-900">Event details</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Status">
                <Badge tone={statusTones[event.status]}>{event.status}</Badge>
              </Field>
              <Field label="Category">{event.category}</Field>
              <Field label="Organization">{resolveName(event.organization, orgNames)}</Field>
              <Field label="Venue">{resolveName(event.venue, venueNames, 'Unassigned')}</Field>
              <Field label="Date">{formatDate(event.startDate)}</Field>
              <Field label="Start time">{formatTime(event.startDate)}</Field>
              <Field label="End time">{formatTime(event.endDate)}</Field>
              <Field label="Expected attendees">{event.expectedAttendees}</Field>
            </div>

            {event.description && (
              <div className="mt-6 border-t border-slate-100 pt-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Description
                </h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {event.description}
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Action rail: status banner + quick actions */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Status
            </h2>
            <div className={`rounded-xl border px-4 py-3 ${statusBanner[event.status]}`}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold">{statusHeadlines[event.status]}</span>
                <Badge tone={statusTones[event.status]}>{event.status}</Badge>
              </div>
              <p className="mt-1 text-xs opacity-80">{statusBlurb[event.status]}</p>
            </div>
          </Card>

          <Card>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Actions
            </h2>
            <div className="space-y-2">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => navigate(`/management/events/${event._id}/edit`)}
              >
                Edit Event
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => navigate(`/management/events/${event._id}/requirements`)}
              >
                Requirements
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => navigate(`/management/events/${event._id}/readiness`)}
              >
                Check Readiness
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => navigate(`/management/events/${event._id}/conflicts`)}
              >
                View Conflicts
              </Button>

              {/* Status-driven decision: pending -> approve/reject,
                  approved -> complete/delete, everything else -> delete. */}
              {event.status === 'pending' &&
                (pendingBooking ? (
                  <>
                    {reviewError && (
                      <div
                        role="alert"
                        className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                      >
                        <p className="font-semibold">Approval blocked</p>
                        <p className="mt-0.5">{reviewError}</p>
                        {reviewConflicts.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {reviewConflicts.map((conflict, index) => (
                              <li key={`${conflict.type}-${index}`} className="text-xs">
                                • {conflict.message ?? conflict.type}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-slate-500">
                      Booking submitted {formatDate(pendingBooking.submittedAt ?? pendingBooking.createdAt)}
                      {pendingBooking.notes ? ` · ${pendingBooking.notes}` : ''}
                    </p>
                    <Button
                      className="w-full"
                      onClick={() => void handleApprove()}
                      disabled={approving || rejecting}
                    >
                      {approving ? 'Approving…' : 'Approve Booking'}
                    </Button>
                    <Button
                      variant="danger"
                      className="w-full"
                      onClick={openReject}
                      disabled={rejecting || approving}
                    >
                      Reject Booking
                    </Button>
                    <Link
                      to={`/management/bookings/${pendingBooking._id}`}
                      className="block pt-1 text-center text-xs font-medium text-brand-700 hover:underline"
                    >
                      Open full review
                    </Link>
                  </>
                ) : (
                  <p className="text-xs text-slate-500">
                    No booking submitted yet — approve and reject appear once the booker submits.
                  </p>
                ))}

              {event.status === 'approved' && (
                <>
                  <Button
                    className="w-full"
                    onClick={() => {
                      setCompleteError(null);
                      setShowComplete(true);
                    }}
                  >
                    Mark as Completed
                  </Button>
                  <Button
                    variant="danger"
                    className="w-full"
                    onClick={() => {
                      setDeleteError(null);
                      setShowDelete(true);
                    }}
                  >
                    Delete Event
                  </Button>
                </>
              )}

              {(event.status === 'rejected' ||
                event.status === 'completed' ||
                event.status === 'cancelled') && (
                <Button
                  variant="danger"
                  className="w-full"
                  onClick={() => {
                    setDeleteError(null);
                    setShowDelete(true);
                  }}
                >
                  Delete Event
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={showComplete}
        onClose={() => setShowComplete(false)}
        title="Mark event as completed"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowComplete(false)} disabled={completing}>
              Cancel
            </Button>
            <Button onClick={() => void confirmComplete()} disabled={completing}>
              {completing ? 'Completing…' : 'Mark as Completed'}
            </Button>
          </>
        }
      >
        <p>
          Mark <span className="font-semibold">{event.name}</span> as completed? Its resource
          reservations will be returned to stock and any approved booking will be marked
          Completed.
        </p>
        {completeError && <p className="mt-2 text-sm text-red-600">{completeError}</p>}
      </Modal>

      <Modal
        open={showReject}
        onClose={() => setShowReject(false)}
        title="Reject booking"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowReject(false)} disabled={rejecting}>
              Keep booking
            </Button>
            <Button variant="danger" onClick={() => void handleReject()} disabled={rejecting}>
              {rejecting ? 'Rejecting…' : 'Reject Booking'}
            </Button>
          </>
        }
      >
        <p>
          Reject the booking for <span className="font-semibold">{event.name}</span>? The booker
          sees your reason and can update the event before resubmitting.
        </p>
        <label htmlFor="rejection-reason" className="mt-4 block text-sm font-medium text-slate-700">
          Rejection reason <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <textarea
          id="rejection-reason"
          rows={3}
          maxLength={500}
          value={rejectionReason}
          onChange={(changeEvent) => {
            setRejectionReason(changeEvent.target.value);
            if (rejectError) setRejectError(null);
          }}
          placeholder="e.g. The venue is already booked that day."
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        {rejectError && <p className="mt-2 text-sm text-red-600">{rejectError}</p>}
      </Modal>

      <Modal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        title="Delete event"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDelete(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => void confirmDelete()} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </>
        }
      >
        <p>
          Delete <span className="font-semibold">{event.name}</span>? This cannot be undone.
        </p>
        {deleteError && <p className="mt-2 text-sm text-red-600">{deleteError}</p>}
      </Modal>
    </>
  );
}
