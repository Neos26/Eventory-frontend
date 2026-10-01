import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { createEvent, getErrorMessage } from '../../api/eventApi';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import BookerEventForm from '../../components/BookerEventForm';
import Card from '../../components/Card';
import PageHeader from '../../components/PageHeader';
import type { EventPayload } from '../../types/event';

export default function BookerEventCreate() {
  useDocumentTitle('Create Event');
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (payload: EventPayload) => {
    setError(null);
    try {
      const created = await createEvent(payload);
      // Next step of the flow: request resources for the new event.
      navigate(`/booker/events/${created._id}/requirements`, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <>
      <PageHeader
        title="Create Event"
        description="Set the schedule, pick a free venue, then request resources."
        actions={
          <Link
            to="/booker/events"
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to My Events
          </Link>
        }
      />

      <Card>
        <BookerEventForm submitLabel="Create Event" error={error} onSubmit={handleSubmit} />
      </Card>
    </>
  );
}
