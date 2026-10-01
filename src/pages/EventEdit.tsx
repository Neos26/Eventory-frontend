import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import EventForm from '../components/EventForm';
import useDocumentTitle from '../hooks/useDocumentTitle';
import {
  fetchEvent,
  fetchOrganizations,
  fetchVenues,
  getErrorMessage,
  isNotFound,
  updateEvent,
} from '../api/eventApi';
import type { EventPayload, EventRecord, OrganizationRecord, VenueRecord } from '../api/eventApi';
import { eventToFormValues } from '../schemas/eventForm';

export default function EventEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  useDocumentTitle('Edit Event');

  const [event, setEvent] = useState<EventRecord | null>(null);
  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([]);
  const [venues, setVenues] = useState<VenueRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  const handleSubmit = async (payload: EventPayload) => {
    if (!id) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await updateEvent(id, payload);
      navigate(`/events/${id}`);
    } catch (requestError) {
      setSubmitError(getErrorMessage(requestError));
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading event..." />;
  }

  if (notFound) {
    return (
      <>
        <PageHeader title="Edit Event" />
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
        <PageHeader title="Edit Event" />
        <ErrorState message={loadError ?? 'Unable to load this event.'} onRetry={() => void load()} />
      </>
    );
  }

  return (
    <>
      <PageHeader title={`Edit ${event.name}`} description="Update the event details below." />

      <Card>
        <EventForm
          organizations={organizations}
          venues={venues}
          initialValues={eventToFormValues(event)}
          submitLabel="Save Changes"
          submitting={submitting}
          error={submitError}
          onSubmit={(payload) => void handleSubmit(payload)}
          onCancel={() => navigate(`/events/${event._id}`)}
        />
      </Card>
    </>
  );
}
