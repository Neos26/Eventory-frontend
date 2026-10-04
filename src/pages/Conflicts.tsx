import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import Badge from '../components/Badge';
import Button from '../components/Button';
import SearchBar from '../components/SearchBar';
import Select from '../components/Select';
import DateRangeFilter from '../components/DateRangeFilter';
import FilterPanel from '../components/FilterPanel';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import PaginatedList from '../components/PaginatedList';
import useDocumentTitle from '../hooks/useDocumentTitle';
import {
  fetchEvents,
  fetchOrganizations,
  fetchVenues,
  getErrorMessage,
  refId,
} from '../api/eventApi';
import type { EventRecord, EventStatus, OrganizationRecord, VenueRecord } from '../api/eventApi';
import {
  fetchEventConflicts,
  type ConflictType,
  type EventConflicts,
} from '../api/insights';
import { formatDate, formatTime, withinDateRange } from '../utils/format';

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
  orgIds: string[];
  venueId: string;
}

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

// Sections shown when filtering is set to "all".
const groupMeta: { kind: ConflictKind; label: string; tone: 'red' | 'amber' | 'indigo'; blurb: string }[] = [
  { kind: 'venue', label: 'Venue Overlaps', tone: 'red', blurb: 'Two events want the same venue at the same time.' },
  { kind: 'schedule', label: 'Schedule Overlaps', tone: 'amber', blurb: 'Events in the same organization overlap in time.' },
  { kind: 'resource', label: 'Resource Shortages', tone: 'indigo', blurb: 'Not enough stock to cover requested quantities.' },
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
    const primaryOrgId = refId(primaryRecord?.organization);
    const primaryVenue = refId(primaryRecord?.venue);

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
        orgIds: [primaryOrgId, refId(eventsById.get(other._id)?.organization)].filter(Boolean),
        venueId: primaryVenue,
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
        orgIds: [primaryOrgId, refId(eventsById.get(other._id)?.organization)].filter(Boolean),
        venueId: primaryVenue,
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
        orgIds: [primaryOrgId].filter(Boolean),
        venueId: primaryVenue,
      });
    }
  }

  return items.sort((a, b) => b.date.localeCompare(a.date));
}

export default function Conflicts() {
  useDocumentTitle('Conflicts');
  const navigate = useNavigate();

  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [venues, setVenues] = useState<VenueRecord[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [kindFilter, setKindFilter] = useState('all');
  const [orgFilter, setOrgFilter] = useState('all');
  const [eventFilter, setEventFilter] = useState('all');
  const [venueFilter, setVenueFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [eventList, venueList, orgList] = await Promise.all([
        fetchEvents(),
        fetchVenues(),
        fetchOrganizations().catch(() => []),
      ]);
      const venueNames = new Map(venueList.map((venue: VenueRecord) => [venue._id, venue.name]));

      // Scan every event that is not cancelled for conflicts.
      const active = eventList.filter((event) => event.status !== 'cancelled');
      const scans = await Promise.all(active.map((event) => fetchEventConflicts(event._id)));

      const eventsById = new Map(eventList.map((event) => [event._id, event]));
      setEvents(eventList);
      setVenues(venueList);
      setOrganizations(orgList);
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

  const orgFilterOptions = useMemo(
    () => [
      { value: 'all', label: 'All organizations' },
      ...organizations.map((organization) => ({ value: organization._id, label: organization.name })),
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
      ...venues.map((venue) => ({ value: venue._id, label: venue.name })),
    ],
    [venues],
  );

  const filteredConflicts = useMemo(() => {
    const search = query.trim().toLowerCase();
    return conflicts.filter((conflict) => {
      if (kindFilter !== 'all' && conflict.kind !== kindFilter) return false;
      if (orgFilter !== 'all' && !conflict.orgIds.includes(orgFilter)) return false;
      if (
        eventFilter !== 'all' &&
        conflict.primaryEvent.id !== eventFilter &&
        conflict.otherEvent?.id !== eventFilter
      ) {
        return false;
      }
      if (venueFilter !== 'all' && conflict.venueId !== venueFilter) return false;
      if (!withinDateRange(conflict.date, dateFrom, dateTo)) return false;
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
  }, [conflicts, query, kindFilter, orgFilter, eventFilter, venueFilter, dateFrom, dateTo]);

  const activeFilters =
    (kindFilter !== 'all' ? 1 : 0) +
    (orgFilter !== 'all' ? 1 : 0) +
    (eventFilter !== 'all' ? 1 : 0) +
    (venueFilter !== 'all' ? 1 : 0) +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0);

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
            Only <span className="font-semibold text-red-600">{conflict.available}</span> of{' '}
            <span className="font-medium">{conflict.required}</span> available — short by{' '}
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
            Double-booked on {formatDate(conflict.otherEvent!.startDate)} ·{' '}
            {formatTime(conflict.otherEvent!.startDate)} - {formatTime(conflict.otherEvent!.endDate)}
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

  // Counts per conflict kind (unfiltered, for the summary row).
  const kindCounts = useMemo(() => {
    const counts: Record<ConflictKind, number> = { venue: 0, schedule: 0, resource: 0 };
    for (const conflict of conflicts) counts[conflict.kind] += 1;
    return counts;
  }, [conflicts]);

  // Grouped sections — venue overlaps, schedule overlaps, resource shortages.
  const grouped = useMemo(() => {
    const groups: Record<ConflictKind, ConflictItem[]> = { venue: [], schedule: [], resource: [] };
    for (const conflict of filteredConflicts) groups[conflict.kind].push(conflict);
    return groups;
  }, [filteredConflicts]);

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
          <Button variant="secondary" onClick={() => navigate('/management/events')}>
            View events
          </Button>
        }
      />

      <FilterPanel
        search={<SearchBar value={query} onChange={setQuery} placeholder="Search conflicts..." />}
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
        <div className="w-full sm:w-52">
          <Select
            aria-label="Filter by conflict type"
            value={kindFilter}
            onChange={(event) => setKindFilter(event.target.value)}
            options={filterOptions}
          />
        </div>
      </FilterPanel>

      {/* Conflict summary */}
      {conflicts.length > 0 && (
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {groupMeta.map((group) => (
            <div
              key={group.kind}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Badge tone={group.tone}>{group.label}</Badge>
              </div>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {kindCounts[group.kind]}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">{group.blurb}</p>
            </div>
          ))}
        </div>
      )}

      {conflicts.length === 0 ? (
        <EmptyState
          title="No conflicts detected"
          description="Venue bookings, schedules and resource stock all look clear."
        />
      ) : filteredConflicts.length === 0 ? (
        <EmptyState
          title="No matching conflicts"
            description="Try a different search term or filters."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setQuery('');
                  setKindFilter('all');
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
      ) : (
        <div className="space-y-6">
          {groupMeta
            .filter((group) => kindFilter === 'all' || kindFilter === group.kind)
            .filter((group) => grouped[group.kind].length > 0)
            .map((group) => (
              <section key={group.kind}>
                <div className="mb-2 flex items-center gap-2">
                  <Badge tone={group.tone}>{group.label}</Badge>
                  <span className="text-xs text-slate-500">
                    {grouped[group.kind].length} conflict
                    {grouped[group.kind].length === 1 ? '' : 's'}
                  </span>
                </div>
                <PaginatedList
                  items={grouped[group.kind]}
                  itemKey={(conflict) => conflict.id}
                  pageSize={8}
                  className="space-y-3"
                  renderItem={(conflict) => (
                    <div className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
                      <div className="min-w-0 flex-1">{renderConflict(conflict)}</div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/management/events/${conflict.primaryEvent.id}`)}
                      >
                        Review
                      </Button>
                    </div>
                  )}
                />
              </section>
            ))}
        </div>
      )}
    </>
  );
}
