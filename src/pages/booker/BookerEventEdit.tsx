import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { fetchEvent, getErrorMessage, isNotFound, updateEvent } from '../../api/eventApi';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import BookerEventForm from '../../components/BookerEventForm';
import Card from '../../components/Card';
import ErrorState from '../../components/ErrorState';
import LoadingState from '../../components/LoadingState';
import PageHeader from '../../components/PageHeader';
import type { EventPayload, EventRecord } from '../../types/event';

export default function BookerEventEdit() {
  useDocumentTitle('Edit Event');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      setEvent(await fetchEvent(id));
    } catch (err) {
      setError(isNotFound(err) ? 'Event not found.' : getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit = async (payload: EventPayload) => {
    if (!id) return;
    setFormError(null);
    try {
      await updateEvent(id, payload);
      navigate(`/booker/events/${id}`, { replace: true });
    } catch (err) {
      setFormError(getErrorMessage(err));
    }
  };

  if (loading) return <LoadingState message="Loading event..." />;
  if (error || !event) return <ErrorState message={error ?? 'Event not found.'} onRetry={load} />;

  return (
    <>
      <PageHeader
        title="Edit Event"
        description={`Update the details of ${event.name}.`}
        actions={
          <Link
            to={`/booker/events/${event._id}`}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Event
          </Link>
        }
      />

      <Card>
        <BookerEventForm
          initialEvent={event}
          submitLabel="Save Changes"
          error={formError}
          onSubmit={handleSubmit}
        />
      </Card>
    </>
  );
}
