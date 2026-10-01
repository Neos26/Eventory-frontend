import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { fetchEvent, fetchEventConflicts, getErrorMessage, isNotFound } from '../api/eventApi';
import type { ConflictRecord, ConflictsReport, EventRecord, EventStatus } from '../api/eventApi';
import { formatDate, formatTime } from '../utils/format';

const statusTones: Record<EventStatus, 'gray' | 'indigo' | 'green' | 'red'> = {
  draft: 'gray',
  planned: 'indigo',
  ongoing: 'green',
  completed: 'gray',
  cancelled: 'red',
};

export default function EventConflicts() {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<EventRecord | null>(null);
  const [report, setReport] = useState<ConflictsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useDocumentTitle('Event Conflicts');

  const load = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setLoadError(null);
    setNotFound(false);
    try {
      const [eventRecord, conflictsReport] = await Promise.all([
        fetchEvent(eventId),
        fetchEventConflicts(eventId),
      ]);
      setEvent(eventRecord);
      setReport(conflictsReport);
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

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <LoadingState message="Checking conflicts..." />;
  }

  if (notFound) {
    return (
      <>
        <PageHeader title="Event Conflicts" />
        <EmptyState
          title="Event not found"
          description="This event may have been deleted."
          action={<Button onClick={() => navigate('/management/events')}>Back to events</Button>}
        />
      </>
    );
  }

  if (loadError || !event || !report) {
    return (
      <>
        <PageHeader title="Event Conflicts" />
        <ErrorState
          message={loadError ?? 'Unable to load conflicts for this event.'}
          onRetry={() => void load()}
        />
      </>
    );
  }

  const renderEventConflict = (conflict: ConflictRecord, kind: 'venue' | 'schedule') => (
    <div
      key={conflict._id}
      className="flex flex-wrap items-start gap-3 rounded-lg border border-slate-100 px-4 py-3"
    >
      <Badge tone={kind === 'venue' ? 'red' : 'amber'}>{kind}</Badge>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900">{conflict.name}</p>
        <p className="text-sm text-slate-600">
          {formatDate(conflict.startDate)} · {formatTime(conflict.startDate)} -{' '}
          {formatTime(conflict.endDate)}
        </p>
        <p className="text-xs text-slate-400">
          {kind === 'venue'
            ? 'Same venue, overlapping time'
            : 'Same organization, overlapping time'}
        </p>
      </div>
      <div className="ml-auto">
        <Badge tone={statusTones[conflict.status]}>{conflict.status}</Badge>
      </div>
    </div>
  );

  return (
    <>
      <PageHeader
        title="Event Conflicts"
        description={`Venue, schedule and resource conflicts for ${event.name}`}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => navigate(`/management/events/${event._id}/readiness`)}
            >
              Check Readiness
            </Button>
            <Button variant="secondary" onClick={() => navigate(`/management/events/${event._id}`)}>
              Back to event
            </Button>
          </>
        }
      />

      <div className="space-y-6">
        {/* Summary */}
        <div
          className={`rounded-xl border px-5 py-4 ${
            report.hasConflicts ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className={`grid h-10 w-10 place-items-center rounded-full text-lg font-bold ${
                  report.hasConflicts ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {report.hasConflicts ? '!' : '✓'}
              </span>
              <div>
                <p
                  className={`text-lg font-bold ${
                    report.hasConflicts ? 'text-red-800' : 'text-emerald-800'
                  }`}
                >
                  {report.hasConflicts ? 'CONFLICTS DETECTED' : 'NO CONFLICTS'}
                </p>
                <p className="text-sm text-slate-600">
                  {report.hasConflicts
                    ? 'Resolve the conflicts below, then check readiness again.'
                    : 'Venue, schedule and resource stock all look clear.'}
                </p>
              </div>
            </div>
            <Badge tone={statusTones[event.status]}>{event.status}</Badge>
          </div>
        </div>

        {/* Venue conflicts */}
        <Card>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Venue conflicts
          </h2>
          {report.venueConflicts.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No venue conflicts.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {report.venueConflicts.map((conflict) => renderEventConflict(conflict, 'venue'))}
            </div>
          )}
        </Card>

        {/* Schedule conflicts */}
        <Card>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Schedule conflicts
          </h2>
          {report.scheduleConflicts.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No schedule conflicts.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {report.scheduleConflicts.map((conflict) => renderEventConflict(conflict, 'schedule'))}
            </div>
          )}
        </Card>

        {/* Resource conflicts */}
        <Card>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Resource conflicts
          </h2>
          {report.resourceConflicts.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No resource shortages.</p>
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {report.resourceConflicts.map((issue) => (
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
          )}
        </Card>
      </div>
    </>
  );
}
