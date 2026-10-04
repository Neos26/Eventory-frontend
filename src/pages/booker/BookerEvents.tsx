import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Clock3, MapPin, Pencil, Plus, Search, Settings2 } from 'lucide-react';
import { fetchEvents, getErrorMessage } from '../../api/eventApi';
import { fetchVenues } from '../../api/venueApi';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import LoadingState from '../../components/LoadingState';
import PageHeader from '../../components/PageHeader';
import PaginatedList from '../../components/PaginatedList';
import Select from '../../components/Select';
import { EventStatusBadge } from '../../components/StatusBadges';
import { formatDate, formatTime } from '../../utils/format';
import type { EventRecord, EventStatus } from '../../types/event';

type StatusFilter = 'all' | EventStatus;

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'planned', label: 'Planned' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function BookerEvents() {
  useDocumentTitle('My Events');

  const [events, setEvents] = useState<EventRecord[]>([]);
  const [venueNames, setVenueNames] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [eventList, venues] = await Promise.all([
        fetchEvents(),
        fetchVenues().catch(() => []),
      ]);
      setEvents(eventList);
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

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return events
      .filter((event) => (status === 'all' ? true : event.status === status))
      .filter((event) => (needle ? event.name.toLowerCase().includes(needle) : true))
      .sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
      );
  }, [events, query, status]);

  const venueOf = (event: EventRecord): string => {
    if (!event.venue) return 'No venue';
    if (typeof event.venue === 'string') return venueNames.get(event.venue) ?? 'Assigned venue';
    return event.venue.name;
  };

  if (loading) return <LoadingState message="Loading your events..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
      <PageHeader
        title="My Events"
        description="Everything you have created, from draft to completed."
        actions={
          <Link
            to="/booker/events/create"
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create Event
          </Link>
        }
      />

      {/* Toolbar */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(changeEvent) => setQuery(changeEvent.target.value)}
            placeholder="Search events by name..."
            aria-label="Search events"
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
        <div className="sm:w-48">
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            value={status}
            onChange={(changeEvent) => setStatus(changeEvent.target.value as StatusFilter)}
          />
        </div>
      </div>

      {events.length === 0 ? (
        <Card>
          <EmptyState
            title="No events yet"
            description="Create your first event, pick a venue and request resources."
            action={
              <Link
                to="/booker/events/create"
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Create Event
              </Link>
            }
          />
        </Card>
      ) : visible.length === 0 ? (
        <Card>
          <EmptyState
            title="No matching events"
            description="Adjust your search or status filter to find what you need."
          />
        </Card>
      ) : (
        <PaginatedList
          items={visible}
          itemKey={(event) => event._id}
          pageSize={9}
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          renderItem={(event) => (
            <Card className="flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <Link
                  to={`/booker/events/${event._id}`}
                  className="min-w-0 font-semibold text-slate-900 transition-colors hover:text-brand-700"
                >
                  <span className="line-clamp-2">{event.name}</span>
                </Link>
                <EventStatusBadge status={event.status} />
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                <p className="flex items-center gap-2">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden="true" />
                  {formatDate(event.startDate)} · {formatTime(event.startDate)} –{' '}
                  {formatTime(event.endDate)}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden="true" />
                  {venueOf(event)}
                </p>
              </div>

              {event.description && (
                <p className="mt-3 line-clamp-2 text-xs text-slate-500">{event.description}</p>
              )}

              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                <Link
                  to={`/booker/events/${event._id}`}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-800"
                >
                  <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                  Details
                </Link>
                <Link
                  to={`/booker/events/${event._id}/requirements`}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                >
                  <Settings2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Resources
                </Link>
                <Link
                  to={`/booker/events/${event._id}/edit`}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  Edit
                </Link>
              </div>
            </Card>
          )}
        />
      )}
    </>
  );
}
