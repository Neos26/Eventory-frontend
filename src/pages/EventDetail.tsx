import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
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
      navigate('/events');
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
        <PageHeader title="Event" />
        <EmptyState
          title="Event not found"
          description="This event may have been deleted."
          action={<Button onClick={() => navigate('/events')}>Back to events</Button>}
        />
      </>
    );
  }

  if (loadError || !event) {
    return (
      <>
        <PageHeader title="Event" />
        <ErrorState message={loadError ?? 'Unable to load this event.'} onRetry={() => void load()} />
      </>
    );
  }

  const orgNames = new Map(organizations.map((organization) => [organization._id, organization.name]));
  const venueNames = new Map(venues.map((venue) => [venue._id, venue.name]));

  return (
    <>
      <PageHeader
        title={event.name}
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate(`/events/${event._id}/edit`)}>
              Edit Event
            </Button>
            <Button variant="secondary" onClick={() => navigate(`/events/${event._id}/requirements`)}>
              Requirements
            </Button>
            <Button variant="secondary" onClick={() => navigate(`/events/${event._id}/readiness`)}>
              Check Readiness
            </Button>
            <Button variant="secondary" onClick={() => navigate(`/events/${event._id}/conflicts`)}>
              View Conflicts
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setDeleteError(null);
                setShowDelete(true);
              }}
            >
              Delete
            </Button>
          </>
        }
      />

      <Card>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Status">
            <Badge tone={statusTones[event.status]}>{event.status}</Badge>
          </Field>
          <Field label="Organization">{resolveName(event.organization, orgNames)}</Field>
          <Field label="Venue">{resolveName(event.venue, venueNames, 'Unassigned')}</Field>
          <Field label="Category">{event.category}</Field>
          <Field label="Date">{formatDate(event.startDate)}</Field>
          <Field label="Start time">{formatTime(event.startDate)}</Field>
          <Field label="End time">{formatTime(event.endDate)}</Field>
          <Field label="Expected attendees">{event.expectedAttendees}</Field>
        </div>

        {event.description && (
          <div className="mt-6 border-t border-slate-100 pt-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Description
            </h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {event.description}
            </p>
          </div>
        )}
      </Card>

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
