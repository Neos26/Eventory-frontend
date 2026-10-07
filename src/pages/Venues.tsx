import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import Badge from '../components/Badge';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import FilterPanel from '../components/FilterPanel';
import Modal from '../components/Modal';
import SearchBar from '../components/SearchBar';
import Select from '../components/Select';
import Table from '../components/Table';
import type { TableColumn } from '../components/Table';
import VenueForm from '../components/VenueForm';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { createVenue, fetchVenues, updateVenue } from '../api/venueApi';
import type { VenuePayload, VenueRecord } from '../api/venueApi';
import { venueToFormValues } from '../schemas/venueForm';
import { fetchEvents, getErrorMessage, refId } from '../api/eventApi';
import type { EventRecord } from '../api/eventApi';
import useDocumentTitle from '../hooks/useDocumentTitle';

// One-line address for the Location column: "street, city, state zip, country".
function formatAddress(venue: VenueRecord): string {
  const address = venue.address;
  if (!address) return '—';
  const line = [
    address.street,
    [address.city, address.state].filter(Boolean).join(', '),
    address.zipCode,
  ]
    .filter(Boolean)
    .join(' ');
  const parts = [line, address.country].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : '—';
}

const typeFilterOptions = [
  { value: 'all', label: 'All types' },
  { value: 'indoor', label: 'Indoor' },
  { value: 'outdoor', label: 'Outdoor' },
  { value: 'hybrid', label: 'Hybrid' },
];

const availabilityFilterOptions = [
  { value: 'all', label: 'All availability' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const capacityFilterOptions = [
  { value: 'all', label: 'Any capacity' },
  { value: 'small', label: 'Under 50' },
  { value: 'medium', label: '50 – 199' },
  { value: 'large', label: '200 – 499' },
  { value: 'xl', label: '500 or more' },
];

const usageFilterOptions = [
  { value: 'all', label: 'Any usage' },
  { value: 'booked', label: 'Has upcoming events' },
  { value: 'free', label: 'No upcoming events' },
];

export default function Venues() {
  useDocumentTitle('Venues');

  const [venues, setVenues] = useState<VenueRecord[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [capacityFilter, setCapacityFilter] = useState('all');
  const [usageFilter, setUsageFilter] = useState('all');

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<VenueRecord | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [venueList, eventList] = await Promise.all([
        fetchVenues(),
        fetchEvents().catch(() => [] as EventRecord[]),
      ]);
      setVenues(venueList);
      setEvents(eventList);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Upcoming (not cancelled/completed) event counts per venue.
  const upcomingByVenue = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const map: Record<string, number> = {};
    for (const event of events) {
      const venueId = refId(event.venue);
      if (!venueId) continue;
      if (event.status === 'cancelled' || event.status === 'completed') continue;
      if (new Date(event.startDate) < startOfToday) continue;
      map[venueId] = (map[venueId] ?? 0) + 1;
    }
    return map;
  }, [events]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return venues.filter((venue) => {
      if (typeFilter !== 'all' && venue.venueType !== typeFilter) return false;
      const active = venue.isActive !== false;
      if (availabilityFilter === 'active' && !active) return false;
      if (availabilityFilter === 'inactive' && active) return false;
      const capacity = venue.capacity ?? 0;
      if (capacityFilter === 'small' && capacity >= 50) return false;
      if (capacityFilter === 'medium' && (capacity < 50 || capacity >= 200)) return false;
      if (capacityFilter === 'large' && (capacity < 200 || capacity >= 500)) return false;
      if (capacityFilter === 'xl' && capacity < 500) return false;
      if (usageFilter !== 'all') {
        const hasUpcoming = (upcomingByVenue[venue._id] ?? 0) > 0;
        if (usageFilter === 'booked' && !hasUpcoming) return false;
        if (usageFilter === 'free' && hasUpcoming) return false;
      }
      if (!search) return true;
      return [venue.name, formatAddress(venue), venue.venueType ?? '']
        .join(' ')
        .toLowerCase()
        .includes(search);
    });
  }, [venues, query, typeFilter, availabilityFilter, capacityFilter, usageFilter, upcomingByVenue]);

  const activeFilters =
    (typeFilter !== 'all' ? 1 : 0) +
    (availabilityFilter !== 'all' ? 1 : 0) +
    (capacityFilter !== 'all' ? 1 : 0) +
    (usageFilter !== 'all' ? 1 : 0);

  const clearFilters = () => {
    setQuery('');
    setTypeFilter('all');
    setAvailabilityFilter('all');
    setCapacityFilter('all');
    setUsageFilter('all');
  };

  const handleSubmitForm = async (payload: VenuePayload) => {
    setFormSubmitting(true);
    setFormError(null);
    try {
      if (editTarget) {
        const updated = await updateVenue(editTarget._id, payload);
        setVenues((previous) =>
          previous.map((venue) => (venue._id === updated._id ? updated : venue)),
        );
        setEditTarget(null);
      } else {
        const created = await createVenue(payload);
        setVenues((previous) => [...previous, created]);
        setCreateOpen(false);
      }
    } catch (requestError) {
      setFormError(getErrorMessage(requestError));
    } finally {
      setFormSubmitting(false);
    }
  };

  // Deactivate / reactivate a venue without touching its details.
  const handleToggleActive = async (venue: VenueRecord) => {
    setTogglingId(venue._id);
    setActionError(null);
    try {
      const updated = await updateVenue(venue._id, {
        name: venue.name,
        isActive: !venue.isActive,
      });
      setVenues((previous) =>
        previous.map((candidate) => (candidate._id === updated._id ? updated : candidate)),
      );
    } catch (requestError) {
      setActionError(getErrorMessage(requestError));
    } finally {
      setTogglingId(null);
    }
  };

  const columns: TableColumn<VenueRecord>[] = [
    {
      key: 'name',
      header: 'Venue',
      render: (row) => <span className="font-medium text-slate-900">{row.name}</span>,
    },
    { key: 'location', header: 'Location', render: (row) => formatAddress(row) },
    {
      key: 'capacity',
      header: 'Capacity',
      render: (row) => (row.capacity ?? 0).toLocaleString(),
    },
    {
      key: 'availability',
      header: 'Availability',
      render: (row) => {
        const active = row.isActive !== false;
        const upcoming = upcomingByVenue[row._id] ?? 0;
        return (
          <div className="flex items-center gap-2">
            <Badge tone={active ? 'green' : 'gray'}>{active ? 'Active' : 'Inactive'}</Badge>
            <span className="text-xs text-slate-500">
              {upcoming === 0
                ? 'No upcoming events'
                : `${upcoming} upcoming event${upcoming === 1 ? '' : 's'}`}
            </span>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-1">
          <Button variant="secondary" size="sm" onClick={() => {
            setFormError(null);
            setEditTarget(row);
          }}>
            Edit
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={togglingId === row._id}
            className={
              row.isActive !== false
                ? 'text-amber-700 hover:bg-amber-50'
                : 'text-brand-700 hover:bg-brand-50'
            }
            onClick={() => void handleToggleActive(row)}
          >
            {togglingId === row._id ? 'Saving…' : row.isActive !== false ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      ),
    },
  ];

  if (loading) return <LoadingState message="Loading venues..." />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  return (
    <>
      <PageHeader
        title="Venues"
        description="Locations where events take place."
        actions={
          <Button onClick={() => { setFormError(null); setCreateOpen(true); }}>Add Venue</Button>
        }
      />

      <FilterPanel
        search={
          <div className="flex flex-wrap items-center gap-3">
            <SearchBar value={query} onChange={setQuery} placeholder="Search venues..." />
            <span className="text-sm text-slate-500">
              {filtered.length} of {venues.length} venue{venues.length === 1 ? '' : 's'}
            </span>
          </div>
        }
        activeCount={activeFilters}
      >
        <div className="w-full sm:w-44">
          <Select
            aria-label="Filter by venue type"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            options={typeFilterOptions}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            aria-label="Filter by availability"
            value={availabilityFilter}
            onChange={(event) => setAvailabilityFilter(event.target.value)}
            options={availabilityFilterOptions}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            aria-label="Filter by capacity"
            value={capacityFilter}
            onChange={(event) => setCapacityFilter(event.target.value)}
            options={capacityFilterOptions}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            aria-label="Filter by usage"
            value={usageFilter}
            onChange={(event) => setUsageFilter(event.target.value)}
            options={usageFilterOptions}
          />
        </div>
      </FilterPanel>

      {actionError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {venues.length === 0 ? (
        <EmptyState
          title="No venues yet"
          description="Add your first venue so events can be booked into it."
          action={
            <Button onClick={() => { setFormError(null); setCreateOpen(true); }}>Add Venue</Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No matching venues"
          description="Try a different search term or filters."
          action={
            <Button variant="secondary" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <Table
          columns={columns}
          rows={filtered}
          rowKey={(row) => row._id}
          emptyMessage="No venues found."
        />
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add Venue"
      >
        <VenueForm
          submitLabel="Create Venue"
          submitting={formSubmitting}
          error={formError}
          onSubmit={(payload) => void handleSubmitForm(payload)}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>

      <Modal
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
        title="Edit Venue"
      >
        {editTarget && (
          <VenueForm
            submitLabel="Save Changes"
            submitting={formSubmitting}
            error={formError}
            initialValues={venueToFormValues(editTarget)}
            onSubmit={(payload) => void handleSubmitForm(payload)}
            onCancel={() => setEditTarget(null)}
          />
        )}
      </Modal>
    </>
  );
}
