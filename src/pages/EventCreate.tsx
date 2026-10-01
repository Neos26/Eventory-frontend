import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EventForm from '../components/EventForm';
import useDocumentTitle from '../hooks/useDocumentTitle';
import {
  createEvent,
  fetchOrganizations,
  fetchVenues,
  getErrorMessage,
} from '../api/eventApi';
import type { EventPayload, OrganizationRecord, VenueRecord } from '../api/eventApi';

export default function EventCreate() {
  useDocumentTitle('Create Event');
  const navigate = useNavigate();

  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([]);
  const [venues, setVenues] = useState<VenueRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [organizationList, venueList] = await Promise.all([
        fetchOrganizations(),
        fetchVenues(),
      ]);
      setOrganizations(organizationList);
      setVenues(venueList);
    } catch (requestError) {
      setLoadError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit = async (payload: EventPayload) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const created = await createEvent(payload);
      navigate(`/management/events/${created._id}`);
    } catch (requestError) {
      setSubmitError(getErrorMessage(requestError));
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Create Event"
        description="Schedule a new event and assign its organization and venue."
      />

      <Card>
        {loading ? (
          <LoadingState message="Loading form..." />
        ) : loadError ? (
          <ErrorState message={loadError} onRetry={() => void load()} />
        ) : (
          <EventForm
            organizations={organizations}
            venues={venues}
            submitLabel="Create Event"
            submitting={submitting}
            error={submitError}
            onSubmit={(payload) => void handleSubmit(payload)}
            onCancel={() => navigate('/management/events')}
          />
        )}
      </Card>
    </>
  );
}
