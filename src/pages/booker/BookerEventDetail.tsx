import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  Ban,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Layers,
  MapPin,
  Package,
  Pencil,
  RefreshCw,
  Send,
  XCircle,
} from 'lucide-react';
import {
  fetchEvent,
  fetchEventConflicts,
  fetchEventReadiness,
  fetchOrganizations,
  fetchRequirements,
  getErrorMessage,
  isNotFound,
  refId,
  resolveName,
} from '../../api/eventApi';
import { bookingEventId, createBooking, fetchBookings } from '../../api/bookingApi';
import { fetchResourceAvailability } from '../../api/resourceApi';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import BackButton from '../../components/BackButton';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ErrorState from '../../components/ErrorState';
import LoadingState from '../../components/LoadingState';
import PageHeader from '../../components/PageHeader';
import PaginatedList from '../../components/PaginatedList';
import { BookingStatusBadge, EventStatusBadge } from '../../components/StatusBadges';
import { formatDate, formatTime } from '../../utils/format';
import type { ConflictReport, EventRecord, Readiness, RequirementRecord } from '../../types/event';
import type { BookingRecord } from '../../types/booking';

const conflictLabels: Record<string, string> = {
  VENUE_CONFLICT: 'Venue conflict',
  SCHEDULE_CONFLICT: 'Schedule conflict',
  RESOURCE_SHORTAGE: 'Resource shortage',
  INVALID_SCHEDULE: 'Invalid schedule',
};

function conflictTone(type: string): string {
  if (type === 'RESOURCE_SHORTAGE') return 'bg-amber-100 text-amber-800';
  if (type === 'INVALID_SCHEDULE') return 'bg-red-100 text-red-700';
  return 'bg-red-100 text-red-700';
}

function conflictDetail(conflict: ConflictReport['conflicts'][number]): string {
  switch (conflict.type) {
    case 'VENUE_CONFLICT':
      return `${conflict.venue ?? 'Venue'} is already used by ${conflict.event ?? 'another event'}${
        conflict.startDate ? ` on ${formatDate(conflict.startDate)}` : ''
      }.`;
    case 'SCHEDULE_CONFLICT':
      return `${conflict.event ?? 'Another event'} of your organization overlaps${
        conflict.startDate ? ` on ${formatDate(conflict.startDate)}` : ''
      }.`;
    case 'RESOURCE_SHORTAGE':
      return `${conflict.resource ?? 'Resource'}: ${conflict.required} required, ${
        conflict.available
      } available (${conflict.shortage} short).`;
    case 'INVALID_SCHEDULE':
      return conflict.message ?? 'The event schedule is invalid.';
    default:
      return conflict.message ?? 'Conflict detected.';
  }
}

export default function BookerEventDetail() {
  useDocumentTitle('Event Details');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [requirements, setRequirements] = useState<RequirementRecord[]>([]);
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [conflicts, setConflicts] = useState<ConflictReport | null>(null);
  const [orgNames, setOrgNames] = useState<Map<string, string>>(new Map());
  const [availability, setAvailability] = useState<Record<string, number>>({});
  const [booking, setBooking] = useState<BookingRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [eventRecord, requirementList, readinessReport, conflictReport, organizations, bookings] =
        await Promise.all([
          fetchEvent(id),
          fetchRequirements(id),
          fetchEventReadiness(id),
          fetchEventConflicts(id),
          fetchOrganizations().catch(() => []),
          fetchBookings().catch(() => [] as BookingRecord[]),
        ]);
      setEvent(eventRecord);
      setRequirements(requirementList);
      setReadiness(readinessReport);
      setConflicts(conflictReport);
      setOrgNames(new Map(organizations.map((organization) => [organization._id, organization.name])));
      setBooking(bookings.find((item) => bookingEventId(item) === id) ?? null);

      const ids = Array.from(new Set(requirementList.map((requirement) => refId(requirement.resource))));
      const entries = await Promise.all(
        ids.map(async (resourceId) => {
          try {
            const data = await fetchResourceAvailability(resourceId);
            return [resourceId, data.available] as const;
          } catch {
            return null;
          }
        }),
      );
      const map: Record<string, number> = {};
      for (const entry of entries) {
        if (entry) map[entry[0]] = entry[1];
      }
      setAvailability(map);
    } catch (err) {
      setError(isNotFound(err) ? 'Event not found.' : getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const orgLabel = useMemo(() => {
    if (!event) return '—';
    return resolveName(event.organization, orgNames);
  }, [event, orgNames]);

  const venueLabel = useMemo(() => {
    if (!event?.venue) return 'No venue assigned';
    return typeof event.venue === 'string' ? 'Venue' : event.venue.name;
  }, [event]);

  const handleSubmitBooking = async () => {
    if (!id) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      setBooking(await createBooking({ eventId: id }));
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Loading event..." />;
  if (error || !event) return <ErrorState message={error ?? 'Event not found.'} onRetry={load} />;

  const isReady = readiness?.ready ?? false;
  const canResubmit = booking !== null && (booking.status === 'Rejected' || booking.status === 'Cancelled');

  return (
    <>
      <BackButton to="/booker/events" label="Back to events" />
      <PageHeader
        title={event.name}
        description={`${formatDate(event.startDate)} · ${formatTime(event.startDate)} – ${formatTime(event.endDate)}`}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: information + resources */}
        <div className="space-y-6 lg:col-span-3">
          <Card>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-semibold text-slate-900">Event Information</h2>
              <EventStatusBadge status={event.status} />
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Date
                  </dt>
                  <dd className="text-sm text-slate-800">{formatDate(event.startDate)}</dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Time
                  </dt>
                  <dd className="text-sm text-slate-800">
                    {formatTime(event.startDate)} – {formatTime(event.endDate)}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Venue
                  </dt>
                  <dd className="text-sm text-slate-800">{venueLabel}</dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Layers className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Organization
                  </dt>
                  <dd className="text-sm text-slate-800">{orgLabel}</dd>
                </div>
              </div>
            </dl>

            {event.description && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Description
                </dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                  {event.description}
                </dd>
              </div>
            )}
          </Card>

          <Card>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-semibold text-slate-900">Resources</h2>
              <Link
                to={`/booker/events/${event._id}/requirements`}
                className="inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                Manage
              </Link>
            </div>

            {requirements.length === 0 ? (
              <p className="text-sm text-slate-500">
                No resources requested yet.{' '}
                <Link
                  to={`/booker/events/${event._id}/requirements`}
                  className="font-medium text-brand-700 hover:underline"
                >
                  Add resources
                </Link>
              </p>
            ) : (
              <PaginatedList
                as="ul"
                items={requirements}
                itemKey={(requirement) => requirement._id}
                pageSize={10}
                className="space-y-2"
                renderItem={(requirement) => {
                  const resourceId = refId(requirement.resource);
                  const issue = readiness?.resourceIssues.find(
                    (item) => item.resourceId === resourceId,
                  );
                  const available = issue
                    ? issue.available
                    : Math.max(availability[resourceId] ?? requirement.quantity, requirement.quantity);
                  const shortage = issue ? issue.shortage : 0;

                  return (
                    <li
                      key={requirement._id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-4 py-3"
                    >
                      <span className="text-sm font-medium text-slate-800">
                        {typeof requirement.resource === 'string'
                          ? 'Resource'
                          : requirement.resource.name}
                      </span>
                      <span className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-white px-2.5 py-1 font-medium text-slate-700">
                          Required {requirement.quantity}
                        </span>
                        <span className="rounded-full bg-white px-2.5 py-1 font-medium text-slate-700">
                          Available {available}
                        </span>
                        {shortage > 0 ? (
                          <span className="rounded-full bg-red-100 px-2.5 py-1 font-medium text-red-700">
                            Shortage {shortage}
                          </span>
                        ) : (
                          <span className="rounded-full bg-brand-100 px-2.5 py-1 font-medium text-brand-800">
                            Covered
                          </span>
                        )}
                      </span>
                    </li>
                  );
                }}
              />
            )}
          </Card>
        </div>

        {/* Right: actions + readiness + conflicts */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Actions
            </h2>
            <div className="space-y-2">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => navigate(`/booker/events/${event._id}/edit`)}
              >
                Edit Event
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => navigate(`/booker/events/${event._id}/requirements`)}
              >
                Manage Requirements
              </Button>
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-semibold text-slate-900">Readiness</h2>
              <RefreshCw className="h-4 w-4 text-slate-400" aria-hidden="true" />
            </div>

            <div
              className={`flex items-start gap-3 rounded-xl px-4 py-3 ${
                isReady ? 'bg-brand-50 text-brand-800' : 'bg-amber-50 text-amber-800'
              }`}
            >
              {isReady ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              ) : (
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              )}
              <div>
                <p className="text-sm font-semibold">
                  {isReady ? 'Ready to submit' : 'Not ready yet'}
                </p>
                <p className="mt-0.5 text-xs">
                  {isReady
                    ? 'Venue, schedule and resources all check out.'
                    : 'Resolve the issues below before submitting the booking.'}
                </p>
              </div>
            </div>

            {readiness && !readiness.venueAvailable && (
              <p className="mt-3 flex items-start gap-2 text-sm text-red-600">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {event.venue
                  ? 'The assigned venue is unavailable or inactive.'
                  : 'No venue is assigned to this event.'}
              </p>
            )}

            {readiness && readiness.resourceIssues.length > 0 && (
              <PaginatedList
                as="ul"
                items={readiness.resourceIssues}
                itemKey={(issue) => issue.resourceId}
                pageSize={5}
                className="mt-3 space-y-2"
                renderItem={(issue) => (
                  <li className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                    <Package className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>
                      {issue.resource}: needs {issue.required}, only {issue.available} available.
                    </span>
                  </li>
                )}
              />
            )}
          </Card>

          <Card>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-semibold text-slate-900">Conflicts</h2>
              {conflicts && (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    conflicts.hasConflicts
                      ? 'bg-red-100 text-red-700'
                      : 'bg-brand-100 text-brand-800'
                  }`}
                >
                  {conflicts.conflicts.length} found
                </span>
              )}
            </div>

            {!conflicts || conflicts.conflicts.length === 0 ? (
              <div className="flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                No conflicts detected for this event.
              </div>
            ) : (
              <PaginatedList
                as="ul"
                items={conflicts.conflicts}
                itemKey={(conflict, index) => `${conflict.type}-${index}`}
                pageSize={10}
                className="space-y-2"
                renderItem={(conflict, index) => (
                  <li
                    key={`${conflict.type}-${index}`}
                    className="rounded-lg border border-slate-100 bg-white p-3"
                  >
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${conflictTone(
                        conflict.type,
                      )}`}
                    >
                      {conflictLabels[conflict.type] ?? conflict.type}
                    </span>
                    <p className="mt-1.5 text-sm text-slate-700">{conflictDetail(conflict)}</p>
                  </li>
                )}
              />
            )}
          </Card>
        </div>
      </div>

      {/* Booking submission / status */}
      <Card className="mt-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-slate-900">Booking</h2>
          {booking && <BookingStatusBadge status={booking.status} />}
        </div>

        {submitError && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {submitError}
          </div>
        )}

        {booking ? (
          <div className="space-y-4">
            {booking.status === 'Pending' && (
              <div className="flex items-start gap-3 rounded-xl bg-amber-50 px-4 py-3 text-amber-800">
                <Clock3 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold">Pending management review</p>
                  <p className="mt-0.5 text-xs">
                    Submitted {formatDate(booking.submittedAt ?? booking.createdAt)}. Your request
                    is queued for an administrator to approve or reject.{' '}
                    <Link
                      to="/booker/bookings"
                      className="font-medium text-brand-700 underline-offset-2 hover:underline"
                    >
                      Manage in My Bookings
                    </Link>
                  </p>
                </div>
              </div>
            )}

            {booking.status === 'Approved' && (
              <div className="flex items-start gap-3 rounded-xl bg-brand-50 px-4 py-3 text-brand-800">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold">Booking approved</p>
                  <p className="mt-0.5 text-xs">
                    Confirmed{booking.reviewedAt ? ` on ${formatDate(booking.reviewedAt)}` : ''} —
                    your venue and resources are reserved.
                  </p>
                </div>
              </div>
            )}

            {booking.status === 'Rejected' && (
              <div className="flex items-start gap-3 rounded-xl bg-red-50 px-4 py-3 text-red-700">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold">Booking rejected</p>
                  <p className="mt-0.5 text-xs">
                    {booking.rejectionReason
                      ? `Reason: ${booking.rejectionReason}`
                      : 'No reason was provided.'}
                  </p>
                </div>
              </div>
            )}

            {booking.status === 'Cancelled' && (
              <div className="flex items-start gap-3 rounded-xl bg-slate-100 px-4 py-3 text-slate-700">
                <Ban className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold">Booking cancelled</p>
                  <p className="mt-0.5 text-xs">
                    This request was cancelled. You can submit a new one.
                  </p>
                </div>
              </div>
            )}

            {booking.status === 'Completed' && (
              <div className="flex items-start gap-3 rounded-xl bg-brand-50 px-4 py-3 text-brand-800">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold">Booking completed</p>
                  <p className="mt-0.5 text-xs">This event and its bookings are finished.</p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-500">
                Booking ID:{' '}
                <span className="break-all font-mono">{booking._id}</span>
              </p>
              {canResubmit && (
                <button
                  type="button"
                  onClick={handleSubmitBooking}
                  disabled={submitting}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                  {submitting ? 'Submitting...' : 'Submit Again'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <dl className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-4 py-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Event
                </dt>
                <dd className="mt-0.5 text-sm font-medium text-slate-800">{event.name}</dd>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-4 py-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  When
                </dt>
                <dd className="mt-0.5 text-sm font-medium text-slate-800">
                  {formatDate(event.startDate)}, {formatTime(event.startDate)} –{' '}
                  {formatTime(event.endDate)}
                </dd>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-4 py-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Venue
                </dt>
                <dd className="mt-0.5 text-sm font-medium text-slate-800">{venueLabel}</dd>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-4 py-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Resources / Conflicts
                </dt>
                <dd className="mt-0.5 text-sm font-medium text-slate-800">
                  {requirements.length} requested ·{' '}
                  {conflicts?.conflicts.length ?? 0} conflict
                  {(conflicts?.conflicts.length ?? 0) === 1 ? '' : 's'}
                </dd>
              </div>
            </dl>

            {!isReady && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>
                  Some issues are still open (see Readiness above). You can submit anyway, but
                  management will likely reject a booking with conflicts.
                </span>
              </div>
            )}

            <div className="flex justify-end border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={handleSubmitBooking}
                disabled={submitting}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                {submitting ? 'Submitting...' : 'Submit for Approval'}
              </button>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
