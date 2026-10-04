import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
} from '../api/eventApi';
import type { EventRecord, EventStatus, OrganizationRecord, VenueRecord } from '../api/eventApi';
import { formatDate, formatTime } from '../utils/format';

const statusTones: Record<EventStatus, 'gray' | 'indigo' | 'green' | 'red'> = {
  draft: 'gray',
  planned: 'indigo',
  ongoing: 'green',
  completed: 'gray',
  cancelled: 'red',
};

const statusHeadlines: Record<EventStatus, string> = {
  draft: 'Awaiting confirmation',
  planned: 'Confirmed and scheduled',
  ongoing: 'Happening now',
  completed: 'Finished',
  cancelled: 'Cancelled',
};

const statusBlurb: Record<EventStatus, string> = {
  draft: 'Not confirmed yet — details can still change.',
  planned: 'Dates, venue and resources are locked in.',
  ongoing: 'The event is in progress.',
  completed: 'This event has concluded.',
  cancelled: 'No longer going ahead — resources are released.',
};

const statusBanner: Record<EventStatus, string> = {
  draft: 'border-slate-200 bg-slate-50 text-slate-700',
  planned: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  ongoing: 'border-emerald-200 bg-emerald-50 text-emerald-800',
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

  useDocumentTitle(event?.name ?? 'Event');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setLoadError(null);
    setNotFound(false);
    try {
      const [eventRecord, organizationList, venueList] = await Promise.all([
        fetchEvent(id),
        fetchOrganizations(),
        fetchVenues(),
      ]);
      setEvent(eventRecord);
      setOrganizations(organizationList);
      setVenues(venueList);
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
            </div>
          </Card>
        </div>
      </div>

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
