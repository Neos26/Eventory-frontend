import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertTriangle, CalendarDays, CheckCircle2, Check, Clock3, MapPin, Package, X, Users } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import BackButton from '../components/BackButton';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Table from '../components/Table';
import type { TableColumn } from '../components/Table';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import PaginatedList from '../components/PaginatedList';
import { BookingStatusBadge, EventStatusBadge } from '../components/StatusBadges';
import useDocumentTitle from '../hooks/useDocumentTitle';
import {
  approvalConflictsOf,
  approveBooking,
  bookingEventId,
  fetchBooking,
  rejectBooking,
} from '../api/bookingApi';
import type { BookingConflict } from '../types/booking';
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
} from '../api/eventApi';
import { fetchResourceAvailability } from '../api/resourceApi';
import { fetchVenues } from '../api/venueApi';
import type { BookingRecord } from '../types/booking';
import type { ConflictReport, EventRecord, Readiness, RequirementRecord } from '../types/event';
import type { VenueRecord } from '../types/venue';
import { formatDate, formatTime } from '../utils/format';

interface ResourceRow {
  resourceId: string;
  name: string;
  required: number;
  available: number;
  shortage: number;
}

function venueLocation(venue?: VenueRecord | null): string {
  if (!venue?.address) return 'No address on file';
  const address = venue.address;
  const line = [address.street, [address.city, address.state, address.zipCode].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ');
  return [line, address.country].filter(Boolean).join(', ') || 'No address on file';
}

const conflictLabels: Record<string, string> = {
  VENUE_CONFLICT: 'Venue conflict',
  SCHEDULE_CONFLICT: 'Schedule conflict',
  RESOURCE_SHORTAGE: 'Resource shortage',
  INVALID_SCHEDULE: 'Invalid schedule',
};

// Structural view shared by the event Conflict and booking 409 payloads.
interface ConflictDetailInput {
  type: string;
  message?: string;
  venue?: string | null;
  event?: string;
  resource?: string;
  required?: number;
  available?: number;
  shortage?: number;
  startDate?: string;
}

function conflictDetail(conflict: ConflictDetailInput): string {
  switch (conflict.type) {
    case 'VENUE_CONFLICT':
      return `${conflict.venue ?? 'Venue'} is already used by ${conflict.event ?? 'another event'}${
        conflict.startDate ? ` on ${formatDate(conflict.startDate)}` : ''
      }.`;
    case 'SCHEDULE_CONFLICT':
      return `${conflict.event ?? 'Another event'} of the same organization overlaps${
        conflict.startDate ? ` on ${formatDate(conflict.startDate)}` : ''
      }.`;
    case 'RESOURCE_SHORTAGE':
      return `${conflict.resource ?? 'Resource'}: ${conflict.required} required, ${
        conflict.available
      } available — shortage of ${conflict.shortage}.`;
    default:
      return conflict.message ?? 'Conflict detected.';
  }
}

export default function BookingReview() {
  useDocumentTitle('Booking Review');
  const { id } = useParams<{ id: string }>();

  const [booking, setBooking] = useState<BookingRecord | null>(null);
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [conflicts, setConflicts] = useState<ConflictReport | null>(null);
  const [rows, setRows] = useState<ResourceRow[]>([]);
  const [venue, setVenue] = useState<VenueRecord | null>(null);
  const [orgNames, setOrgNames] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [approving, setApproving] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [approveConflicts, setApproveConflicts] = useState<BookingConflict[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [rejectError, setRejectError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const bookingRecord = await fetchBooking(id);
      setBooking(bookingRecord);

      const eventId = bookingEventId(bookingRecord);
      const [eventRecord, requirementList, readinessReport, conflictReport, venueList, orgList] =
        await Promise.all([
          fetchEvent(eventId),
          fetchRequirements(eventId),
          fetchEventReadiness(eventId),
          fetchEventConflicts(eventId),
          fetchVenues().catch(() => [] as VenueRecord[]),
          fetchOrganizations().catch(() => []),
        ]);
      setEvent(eventRecord);
      setReadiness(readinessReport);
      setConflicts(conflictReport);
      setOrgNames(new Map(orgList.map((org) => [org._id, org.name])));

      // Venue record (address + capacity) for the venue section.
      const venueId = refId(eventRecord.venue);
      setVenue(venueList.find((candidate) => candidate._id === venueId) ?? null);

      // Resource rows: required vs currently available, with authoritative
      // shortages from the readiness report.
      const rowsData = await Promise.all(
        requirementList.map(async (requirement: RequirementRecord) => {
          const resourceId = refId(requirement.resource);
          const issue = readinessReport.resourceIssues.find(
            (item) => item.resourceId === resourceId,
          );
          let available = issue ? issue.available : requirement.quantity;
          if (!issue) {
            try {
              available = (await fetchResourceAvailability(resourceId)).available;
            } catch {
              available = requirement.quantity;
            }
          }
          return {
            resourceId,
            name:
              typeof requirement.resource === 'string' ? 'Resource' : requirement.resource.name,
            required: requirement.quantity,
            available,
            shortage: issue ? issue.shortage : 0,
          };
        }),
      );
      setRows(rowsData);
    } catch (requestError) {
      setError(isNotFound(requestError) ? 'Booking not found.' : getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleApprove = async () => {
    if (!booking) return;
    setApproving(true);
    setApproveError(null);
    setApproveConflicts([]);
    setNotice(null);
    try {
      await approveBooking(booking._id);
      setNotice('Booking approved — resources are now reserved for this event.');
      await load();
    } catch (requestError) {
      const blocked = approvalConflictsOf(requestError);
      if (blocked) setApproveConflicts(blocked);
      setApproveError(getErrorMessage(requestError));
    } finally {
      setApproving(false);
    }
  };

  const openReject = () => {
    setRejectionReason('');
    setRejectError(null);
    setRejectOpen(true);
  };

  const handleReject = async () => {
    if (!booking) return;
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
      await rejectBooking(booking._id, reason);
      setRejectOpen(false);
      setNotice('Booking rejected — your reason was sent to the booker.');
      await load();
    } catch (requestError) {
      setRejectError(getErrorMessage(requestError));
    } finally {
      setRejecting(false);
    }
  };

  if (loading) return <LoadingState message="Loading booking..." />;
  if (error || !booking || !event) {
    return (
      <>
        <BackButton to="/management/bookings" label="Back to bookings" />
        <ErrorState message={error ?? 'Booking not found.'} onRetry={() => void load()} />
      </>
    );
  }

  const booker = typeof booking.bookerId === 'string' ? null : booking.bookerId;
  const conflictCount = conflicts?.conflicts.length ?? 0;
  const shortageCount = readiness?.resourceIssues.length ?? 0;
  const isReady = readiness?.ready ?? false;
  const decisionNote =
    booking.status === 'Approved'
      ? 'This booking is approved — the venue is held and every requested resource is reserved.'
      : booking.status === 'Rejected'
        ? 'This booking was rejected and the booker has been notified of the reason.'
        : booking.status === 'Cancelled'
          ? 'This booking was cancelled before a decision was made.'
          : 'This booking is complete — nothing further to do.';

  const resourceColumns: TableColumn<ResourceRow>[] = [
    {
      key: 'name',
      header: 'Resource',
      render: (row) => <span className="font-medium text-slate-900">{row.name}</span>,
    },
    { key: 'required', header: 'Required', render: (row) => row.required },
    { key: 'available', header: 'Available', render: (row) => row.available },
    {
      key: 'status',
      header: 'Status',
      render: (row) =>
        row.shortage > 0 ? (
          <Badge tone="red">Shortage of {row.shortage}</Badge>
        ) : (
          <Badge tone="green">Available</Badge>
        ),
    },
  ];

  const readinessRows = [
    {
      label: 'Venue',
      ok: readiness?.venueAvailable ?? false,
      okText: 'Available',
      badText: 'Unavailable',
      icon: MapPin,
    },
    {
      label: 'Resources',
      ok: shortageCount === 0,
      okText: 'All covered',
      badText: `${shortageCount} warning${shortageCount === 1 ? '' : 's'}`,
      icon: Package,
    },
    {
      label: 'Conflicts',
      ok: conflictCount === 0,
      okText: 'None found',
      badText: `${conflictCount} found`,
      icon: AlertTriangle,
    },
  ];

  return (
    <>
      <BackButton to="/management/bookings" label="Back to bookings" />
      <PageHeader
        title="Booking Review"
        description={`Submitted ${formatDate(booking.submittedAt ?? booking.createdAt)} · ${event.name}`}
      />

      {/* Booking status banner */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <BookingStatusBadge status={booking.status} />
        <span className="text-sm text-slate-500">
          {booking.status === 'Pending'
            ? 'Awaiting your decision.'
            : booking.status === 'Rejected'
              ? `Rejected${booking.rejectionReason ? ` — ${booking.rejectionReason}` : ''}`
              : booking.status === 'Approved'
                ? 'Approved — reservations are held.'
                : booking.status}
        </span>
        {booker && (
          <span className="ml-auto text-xs text-slate-400">
            Booker: {booker.name} · {booker.email}
          </span>
        )}
      </div>

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
        <div className="space-y-6 lg:col-span-3">
          {/* Event */}
          <Card>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-semibold text-slate-900">Event</h2>
              <EventStatusBadge status={event.status} />
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Name</dt>
                <dd className="mt-0.5 font-medium text-slate-900">{event.name}</dd>
              </div>
              <div className="flex items-start gap-2 sm:col-span-2">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Date</dt>
                  <dd className="text-sm text-slate-800">{formatDate(event.startDate)}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Start</dt>
                  <dd className="text-sm text-slate-800">{formatTime(event.startDate)}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">End</dt>
                  <dd className="text-sm text-slate-800">{formatTime(event.endDate)}</dd>
                </div>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Organization
                </dt>
                <dd className="text-sm text-slate-800">{resolveName(event.organization, orgNames)}</dd>
              </div>
              <div className="flex items-start gap-2">
                <Users className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Booker
                  </dt>
                  <dd className="text-sm text-slate-800">
                    {booker ? `${booker.name} · ${booker.email}` : 'Booker'}
                  </dd>
                </div>
              </div>
            </dl>

            {event.description && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Description
                </dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{event.description}</dd>
              </div>
            )}
          </Card>

          {/* Resources */}
          <Card>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-semibold text-slate-900">Resources</h2>
              <span className="text-xs text-slate-400">{rows.length} requested</span>
            </div>
            {rows.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-500">
                No resources were requested for this event.
              </p>
            ) : (
              <Table columns={resourceColumns} rows={rows} rowKey={(row) => row.resourceId} />
            )}
          </Card>
        </div>

        {/* Review rail: venue, readiness, decision */}
        <div className="space-y-6 lg:col-span-2">
          {/* Venue */}
          <Card>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-semibold text-slate-900">Venue</h2>
              <Badge tone={readiness?.venueAvailable ? 'green' : 'red'}>
                {readiness?.venueAvailable ? 'Available' : 'Unavailable'}
              </Badge>
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Venue</dt>
                <dd className="mt-0.5 text-sm font-medium text-slate-900">
                  {venue?.name ?? (typeof event.venue === 'object' && event.venue ? event.venue.name : 'No venue assigned')}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Location
                </dt>
                <dd className="text-sm text-slate-700">{venueLocation(venue)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Capacity
                </dt>
                <dd className="text-sm text-slate-700">
                  {venue?.capacity ? `${venue.capacity} seats` : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Availability
                </dt>
                <dd className="text-sm text-slate-700">
                  {readiness?.venueAvailable
                    ? 'Free for the requested date'
                    : 'Booked or inactive for the requested date'}
                </dd>
              </div>
            </dl>

            {conflicts && conflicts.venueConflicts.length > 0 && (
              <PaginatedList
                as="ul"
                items={conflicts.venueConflicts}
                itemKey={(other) => other._id}
                pageSize={5}
                className="mt-4 space-y-2 border-t border-slate-100 pt-4"
                renderItem={(other) => (
                  <li className="flex items-center gap-2 text-sm text-red-600">
                    <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    Overlaps with <span className="font-medium">{other.name}</span> on{' '}
                    {formatDate(other.startDate)}, {formatTime(other.startDate)}–
                    {formatTime(other.endDate)}
                  </li>
                )}
              />
            )}
          </Card>

          {/* Readiness */}
          <Card>
            <h2 className="mb-4 font-semibold text-slate-900">Readiness</h2>

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
                  Overall: {isReady ? 'Ready' : 'Not Ready'}
                </p>
                <p className="mt-0.5 text-xs">
                  {isReady
                    ? 'Venue, resources and schedule all check out.'
                    : 'Resolve the warnings below before approving.'}
                </p>
              </div>
            </div>

            <ul className="mt-4 space-y-2">
              {readinessRows.map((row) => {
                const Icon = row.icon;
                return (
                  <li
                    key={row.label}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <Icon className="h-4 w-4 text-brand-600" aria-hidden="true" />
                      {row.label}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                        row.ok ? 'text-brand-700' : 'text-red-600'
                      }`}
                    >
                      {row.ok ? (
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      {row.ok ? row.okText : row.badText}
                    </span>
                  </li>
                );
              })}
            </ul>

            {readiness && readiness.resourceIssues.length > 0 && (
              <PaginatedList
                as="ul"
                items={readiness.resourceIssues}
                itemKey={(issue) => issue.resourceId}
                pageSize={5}
                className="mt-4 space-y-2"
                renderItem={(issue) => (
                  <li className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                    <span className="font-semibold">{issue.resource}</span>: needs{' '}
                    {issue.required}, only {issue.available} available —{' '}
                    <span className="font-semibold">shortage of {issue.shortage}</span>.
                  </li>
                )}
              />
            )}
          </Card>

          {/* Approval decision — conflicts are shown before the approve action */}
          <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-semibold text-slate-900">Approval Check</h2>
              <Badge tone={conflictCount === 0 ? 'green' : 'red'}>
                {conflictCount} conflict{conflictCount === 1 ? '' : 's'}
              </Badge>
            </div>

            {approveError && (
              <div
                role="alert"
                className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                <p className="font-semibold">Approval blocked</p>
                <p className="mt-0.5">{approveError}</p>
                {approveConflicts.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {approveConflicts.map((conflict, index) => (
                      <li key={`${conflict.type}-${index}`} className="text-xs">
                        • {conflictDetail(conflict)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {conflicts && conflicts.conflicts.length > 0 ? (
              <PaginatedList
                as="ul"
                items={conflicts.conflicts}
                itemKey={(conflict, index) => `${conflict.type}-${index}`}
                pageSize={10}
                className="space-y-2"
                renderItem={(conflict, index) => (
                  <li
                    key={`${conflict.type}-${index}`}
                    className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5"
                  >
                    <Badge tone={conflict.type === 'RESOURCE_SHORTAGE' ? 'amber' : 'red'}>
                      {conflictLabels[conflict.type] ?? conflict.type}
                    </Badge>
                    <p className="min-w-0 text-sm text-slate-700">{conflictDetail(conflict)}</p>
                  </li>
                )}
              />
            ) : (
              <div className="flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                {booking.status === 'Pending'
                  ? 'No venue, schedule or resource conflicts — safe to approve.'
                  : 'No venue, schedule or resource conflicts.'}
              </div>
            )}

            {booking.status === 'Pending' ? (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <p className="text-xs text-slate-500">
                  {conflictCount > 0
                    ? `Approval is blocked until ${conflictCount} conflict${conflictCount === 1 ? '' : 's'} ${
                        conflictCount === 1 ? 'is' : 'are'
                      } resolved.`
                    : 'Approving holds the venue and reserves every requested resource.'}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="danger" onClick={openReject} disabled={rejecting || approving}>
                    <X className="h-4 w-4" aria-hidden="true" />
                    Reject Booking
                  </Button>
                  <Button
                    onClick={handleApprove}
                    disabled={approving || rejecting || conflictCount > 0}
                    title={conflictCount > 0 ? 'Resolve conflicts before approving' : undefined}
                  >
                    <Check className="h-4 w-4" aria-hidden="true" />
                    {approving ? 'Approving...' : 'Approve Booking'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="text-xs text-slate-500">{decisionNote}</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Rejection reason modal */}
      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Reject Booking"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setRejectOpen(false)}
              disabled={rejecting}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleReject} disabled={rejecting}>
              {rejecting ? 'Rejecting...' : 'Reject Booking'}
            </Button>
          </>
        }
      >
        <p className="mb-3 text-sm text-slate-600">
          Rejecting sends your reason to{' '}
          <span className="font-medium">{booker?.name ?? 'the booker'}</span>. A reason is
          required.
        </p>
        <label htmlFor="rejectionReason" className="mb-1 block text-sm font-medium text-slate-700">
          Rejection Reason
        </label>
        <textarea
          id="rejectionReason"
          rows={4}
          maxLength={500}
          value={rejectionReason}
          onChange={(changeEvent) => {
            setRejectionReason(changeEvent.target.value);
            if (rejectError) setRejectError(null);
          }}
          placeholder="e.g. The venue is already booked for that time."
          aria-invalid={rejectError ? true : undefined}
          aria-describedby={rejectError ? 'rejectionReason-error' : undefined}
          className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
            rejectError ? 'border-red-400' : 'border-slate-200'
          }`}
        />
        {rejectError && (
          <p id="rejectionReason-error" role="alert" className="mt-1 text-xs text-red-600">
            {rejectError}
          </p>
        )}
      </Modal>
    </>
  );
}
