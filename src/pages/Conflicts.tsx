import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import Badge from '../components/Badge';
import Button from '../components/Button';
import SearchBar from '../components/SearchBar';
import Select from '../components/Select';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import useDocumentTitle from '../hooks/useDocumentTitle';
import {
  fetchEvents,
  fetchVenues,
  getErrorMessage,
} from '../api/eventApi';
import type { EventRecord, EventStatus, VenueRecord } from '../api/eventApi';
import {
  fetchEventConflicts,
  type ConflictType,
  type EventConflicts,
} from '../api/insights';
import { formatDate, formatTime } from '../utils/format';

type ConflictKind = ConflictType;

interface ConflictItem {
  id: string;
  kind: ConflictKind;
  primaryEvent: { id: string; name: string; status: EventStatus };
  otherEvent?: { id: string; name: string; startDate: string; endDate: string; status: EventStatus };
  venueName?: string;
  resourceName?: string;
  required?: number;
  available?: number;
  shortage?: number;
  date: string;
}

const kindTones: Record<ConflictKind, 'red' | 'amber' | 'indigo'> = {
  venue: 'red',
  schedule: 'amber',
  resource: 'indigo',
};

const statusTones: Record<EventStatus, 'gray' | 'indigo' | 'green' | 'red'> = {
  draft: 'gray',
  planned: 'indigo',
  ongoing: 'green',
  completed: 'gray',
  cancelled: 'red',
};

const filterOptions = [
  { value: 'all', label: 'All types' },
  { value: 'venue', label: 'Venue conflicts' },
  { value: 'schedule', label: 'Schedule conflicts' },
  { value: 'resource', label: 'Resource conflicts' },
];

// Turn the per-event conflict responses into one deduplicated list.
function normalizeConflicts(
  scans: EventConflicts[],
  eventsById: Map<string, EventRecord>,
  venueNames: Map<string, string>,
): ConflictItem[] {
  const items: ConflictItem[] = [];
  const seen = new Set<string>();
  // A pair that already has a venue conflict is not repeated as a schedule
  // conflict (venue wins, matching the readiness/dashboard count).
  const venuePairs = new Set<string>();

  for (const scan of scans) {
    const primaryRecord = eventsById.get(scan.event.id);
    const primary = {
      id: scan.event.id,
      name: scan.event.name,
      status: primaryRecord?.status ?? 'draft',
    };
    const primaryVenueId =
      typeof primaryRecord?.venue === 'string' ? primaryRecord.venue : null;
    const primaryVenueName = primaryVenueId
      ? venueNames.get(primaryVenueId) ?? 'Unassigned'
      : 'Unassigned';

    for (const other of scan.venueConflicts) {
      const pair = [scan.event.id, other._id].sort().join(':');
      const key = `venue:${pair}`;
      if (seen.has(key)) continue;
      seen.add(key);
      venuePairs.add(pair);
      items.push({
        id: key,
        kind: 'venue',
        primaryEvent: primary,
        otherEvent: {
          id: other._id,
          name: other.name,
          startDate: other.startDate,
          endDate: other.endDate,
          status: other.status,
        },
        venueName: primaryVenueName,
        date: other.startDate,
      });
    }

    for (const other of scan.scheduleConflicts) {
      const pair = [scan.event.id, other._id].sort().join(':');
      const key = `schedule:${pair}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (venuePairs.has(pair)) continue;
      items.push({
        id: key,
        kind: 'schedule',
        primaryEvent: primary,
        otherEvent: {
          id: other._id,
          name: other.name,
          startDate: other.startDate,
          endDate: other.endDate,
          status: other.status,
        },
        date: other.startDate,
      });
    }

    for (const resource of scan.resourceConflicts) {
      const key = `resource:${scan.event.id}:${resource.resourceId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({
        id: key,
        kind: 'resource',
        primaryEvent: primary,
        resourceName: resource.resource,
        required: resource.required,
        available: resource.available,
        shortage: resource.shortage,
        date: scan.event.startDate,
      });
    }
  }

  return items.sort((a, b) => b.date.localeCompare(a.date));
}

export default function Conflicts() {
  useDocumentTitle('Conflicts');
  const navigate = useNavigate();

  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [kindFilter, setKindFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [events, venues] = await Promise.all([fetchEvents(), fetchVenues()]);
      const venueNames = new Map(venues.map((venue: VenueRecord) => [venue._id, venue.name]));

      // Scan every event that is not cancelled for conflicts.
      const active = events.filter((event) => event.status !== 'cancelled');
      const scans = await Promise.all(active.map((event) => fetchEventConflicts(event._id)));

      const eventsById = new Map(events.map((event) => [event._id, event]));
      setConflicts(normalizeConflicts(scans, eventsById, venueNames));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredConflicts = useMemo(() => {
    const search = query.trim().toLowerCase();
    return conflicts.filter((conflict) => {
      if (kindFilter !== 'all' && conflict.kind !== kindFilter) return false;
      if (!search) return true;
      const haystack = [
        conflict.primaryEvent.name,
        conflict.otherEvent?.name ?? '',
        conflict.venueName ?? '',
        conflict.resourceName ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(search);
    });
  }, [conflicts, query, kindFilter]);

  const renderConflict = (conflict: ConflictItem) => {
    if (conflict.kind === 'resource') {
      return (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">{conflict.resourceName}</span>
            <Badge tone={statusTones[conflict.primaryEvent.status]}>
              {conflict.primaryEvent.status}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Required: <span className="font-medium">{conflict.required}</span>
            <span className="mx-2 text-slate-300">|</span>
            Available: <span className="font-medium">{conflict.available}</span>
            <span className="mx-2 text-slate-300">|</span>
            Shortage:{' '}
            <span className="font-semibold text-red-600">{conflict.shortage}</span>
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Needed for {conflict.primaryEvent.name} · {formatDate(conflict.date)}
          </p>
        </>
      );
    }

    if (conflict.kind === 'venue') {
      return (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">{conflict.venueName}</span>
            <Badge tone={statusTones[conflict.otherEvent!.status]}>
              {conflict.otherEvent!.status}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {formatDate(conflict.otherEvent!.startDate)} · {formatTime(conflict.otherEvent!.startDate)}{' '}
            - {formatTime(conflict.otherEvent!.endDate)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {conflict.primaryEvent.name} overlaps with {conflict.otherEvent!.name}
          </p>
        </>
      );
    }

    return (
      <>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">
            {conflict.primaryEvent.name} and {conflict.otherEvent!.name}
          </span>
          <Badge tone={statusTones[conflict.otherEvent!.status]}>
            {conflict.otherEvent!.status}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          {formatDate(conflict.otherEvent!.startDate)} · {formatTime(conflict.otherEvent!.startDate)}{' '}
          - {formatTime(conflict.otherEvent!.endDate)}
        </p>
        <p className="mt-1 text-xs text-slate-400">Same organization - schedule overlap</p>
      </>
    );
  };

  if (loading) {
    return <LoadingState message="Scanning events for conflicts..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => void load()} />;
  }

  return (
    <>
      <PageHeader
        title="Conflicts"
        description="Double-bookings and shortages across events."
        actions={
          <Button variant="secondary" onClick={() => navigate('/events')}>
            View events
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar value={query} onChange={setQuery} placeholder="Search conflicts..." />
        <div className="w-full sm:w-52">
          <Select
            aria-label="Filter by conflict type"
            value={kindFilter}
            onChange={(event) => setKindFilter(event.target.value)}
            options={filterOptions}
          />
        </div>
      </div>

      {conflicts.length === 0 ? (
        <EmptyState
          title="No conflicts detected"
          description="Venue bookings, schedules and resource stock all look clear."
        />
      ) : filteredConflicts.length === 0 ? (
        <EmptyState
          title="No matching conflicts"
          description="Try a different search term or conflict type."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setQuery('');
                setKindFilter('all');
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredConflicts.map((conflict) => (
            <div
              key={conflict.id}
              className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm"
            >
              <Badge tone={kindTones[conflict.kind]}>{conflict.kind}</Badge>
              <div className="min-w-0 flex-1">{renderConflict(conflict)}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
