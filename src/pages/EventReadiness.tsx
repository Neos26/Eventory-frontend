import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import useDocumentTitle from '../hooks/useDocumentTitle';
import {
  fetchEvent,
  fetchEventReadiness,
  fetchRequirements,
  getErrorMessage,
  isNotFound,
  refId,
  updateEvent,
} from '../api/eventApi';
import type {
  EventRecord,
  EventStatus,
  ReadinessReport,
  RequirementRecord,
} from '../api/eventApi';
import { formatDate, formatTime } from '../utils/format';

const statusTones: Record<EventStatus, 'gray' | 'indigo' | 'green' | 'red'> = {
  draft: 'gray',
  planned: 'indigo',
  ongoing: 'green',
  completed: 'gray',
  cancelled: 'red',
};

export default function EventReadiness() {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<EventRecord | null>(null);
  const [requirements, setRequirements] = useState<RequirementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [readiness, setReadiness] = useState<ReadinessReport | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);

  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  useDocumentTitle('Event Readiness');

  const load = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setLoadError(null);
    setNotFound(false);
    try {
      const [eventRecord, requirementList] = await Promise.all([
        fetchEvent(eventId),
        fetchRequirements(eventId),
      ]);
      setEvent(eventRecord);
      setRequirements(requirementList);
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

  const checkReadiness = useCallback(async () => {
    if (!eventId) return;
    setChecking(true);
    setCheckError(null);
    try {
      setReadiness(await fetchEventReadiness(eventId));
    } catch (requestError) {
      setReadiness(null);
      setCheckError(getErrorMessage(requestError));
    } finally {
      setChecking(false);
    }
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (event) void checkReadiness();
  }, [event, checkReadiness]);

  const issuesByResource = useMemo(
    () => new Map((readiness?.resourceIssues ?? []).map((issue) => [issue.resourceId, issue])),
    [readiness],
  );

  const requirementNames = useMemo(() => {
    const names = new Map<string, string>();
    for (const requirement of requirements) {
      if (typeof requirement.resource === 'object') {
        names.set(requirement.resource._id, requirement.resource.name);
      }
    }
    return names;
  }, [requirements]);

  const confirmEvent = async () => {
    if (!eventId) return;
    setConfirming(true);
    setConfirmError(null);
    try {
      setEvent(await updateEvent(eventId, { status: 'planned' }));
    } catch (requestError) {
      setConfirmError(getErrorMessage(requestError));
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading event..." />;
  }

  if (notFound) {
    return (
      <>
        <PageHeader title="Event Readiness" />
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
        <PageHeader title="Event Readiness" />
        <ErrorState
          message={loadError ?? 'Unable to load this event.'}
          onRetry={() => void load()}
        />
      </>
    );
  }

  const ready = readiness?.ready ?? false;

  return (
    <>
      <PageHeader
        title="Event Readiness"
        description={`${event.name} · ${formatDate(event.startDate)}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate(`/management/events/${event._id}/edit`)}>
              Edit Event
            </Button>
            <Button variant="secondary" onClick={() => navigate(`/management/events/${event._id}`)}>
              Back to event
            </Button>
          </>
        }
      />

      <div className="space-y-6">
        {checkError && !checking && (
          <ErrorState message={checkError} onRetry={() => void checkReadiness()} />
        )}

        {checking && !readiness && !checkError && (
          <LoadingState message="Checking readiness..." />
        )}

        {readiness && (
          <>
            {/* READY / NOT READY */}
            <div
              className={`rounded-xl border px-5 py-4 ${
                ready ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`grid h-10 w-10 place-items-center rounded-full text-lg font-bold ${
                      ready ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {ready ? '✓' : '!'}
                  </span>
                  <div>
                    <p
                      className={`text-lg font-bold ${
                        ready ? 'text-emerald-800' : 'text-red-800'
                      }`}
                    >
                      {ready ? 'READY' : 'NOT READY'}
                    </p>
                    <p className="text-sm text-slate-600">
                      {ready
                        ? 'Venue, schedule and resource requirements are all clear.'
                        : 'Resolve the shortages and conflicts below, then check again.'}
                    </p>
                  </div>
                </div>
                {event.status === 'draft' ? (
                  ready && (
                    <Button onClick={() => void confirmEvent()} disabled={confirming}>
                      {confirming ? 'Confirming…' : 'Confirm Event'}
                    </Button>
                  )
                ) : (
                  <Badge tone={statusTones[event.status]}>{event.status}</Badge>
                )}
              </div>
              {confirmError && <p className="mt-2 text-sm text-red-600">{confirmError}</p>}
            </div>

            {/* Availability checklist */}
            <Card>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Availability checks
              </h2>
              <div className="mt-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-900">
                    <span
                      aria-hidden
                      className={readiness.venueAvailable ? 'text-emerald-600' : 'text-red-600'}
                    >
                      {readiness.venueAvailable ? '✓' : '✗'}
                    </span>
                    {!event.venue
                      ? 'No venue assigned'
                      : readiness.venueAvailable
                        ? 'Venue available'
                        : 'Venue unavailable'}
                  </span>
                  <Badge tone={readiness.venueAvailable ? 'green' : 'red'}>
                    {readiness.venueAvailable ? 'available' : 'unavailable'}
                  </Badge>
                </div>

                {requirements.map((requirement) => {
                  const resourceId = refId(requirement.resource);
                  const issue = issuesByResource.get(resourceId);
                  const name = requirementNames.get(resourceId) ?? 'Unknown resource';
                  return (
                    <div
                      key={requirement._id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
                    >
                      <span className="flex items-center gap-2 text-sm font-medium text-slate-900">
                        <span
                          aria-hidden
                          className={issue ? 'text-red-600' : 'text-emerald-600'}
                        >
                          {issue ? '✗' : '✓'}
                        </span>
                        {name} {issue ? 'unavailable' : 'available'}
                      </span>
                      <Badge tone={issue ? 'red' : 'green'}>
                        {issue ? `shortage ${issue.shortage}` : 'available'}
                      </Badge>
                    </div>
                  );
                })}

                {requirements.length === 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-sm text-amber-800">
                      No requirements added yet — readiness only reflects the venue and schedule.
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/management/events/${event._id}/requirements`)}
                    >
                      Add Requirements
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* Shortages */}
            {readiness.resourceIssues.length > 0 && (
              <Card>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Resource shortages
                </h2>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {readiness.resourceIssues.map((issue) => (
                    <div
                      key={issue.resourceId}
                      className="rounded-xl border border-red-200 bg-red-50 px-4 py-3"
                    >
                      <p className="text-sm font-semibold text-red-800">{issue.resource}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        Required: <span className="font-medium">{issue.required}</span>
                        <span className="mx-2 text-slate-300">|</span>
                        Available: <span className="font-medium">{issue.available}</span>
                        <span className="mx-2 text-slate-300">|</span>
                        Shortage: <span className="font-semibold text-red-600">{issue.shortage}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Detected conflicts */}
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Detected conflicts
                </h2>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/management/events/${event._id}/conflicts`)}
                >
                  View Conflicts
                </Button>
              </div>
              {readiness.conflicts.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">
                  No venue or schedule conflicts detected.
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  {readiness.conflicts.map((conflict) => (
                    <div
                      key={`${conflict.type}-${conflict._id}`}
                      className="flex flex-wrap items-start gap-3 rounded-lg border border-slate-100 px-4 py-3"
                    >
                      <Badge tone={conflict.type === 'venue' ? 'red' : 'amber'}>
                        {conflict.type}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900">{conflict.name}</p>
                        <p className="text-sm text-slate-600">
                          {formatDate(conflict.startDate)} · {formatTime(conflict.startDate)} -{' '}
                          {formatTime(conflict.endDate)}
                        </p>
                        <p className="text-xs text-slate-400">
                          {conflict.type === 'venue'
                            ? 'Venue double-booked'
                            : 'Same organization — schedule overlap'}
                        </p>
                      </div>
                      <div className="ml-auto">
                        <Badge tone={statusTones[conflict.status]}>{conflict.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </>
  );
}
