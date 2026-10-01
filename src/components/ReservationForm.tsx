import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import Button from './Button';
import Input from './Input';
import Select from './Select';
import {
  emptyReservationForm,
  reservationFormToPayload,
  validateReservationForm,
} from '../schemas/reservationForm';
import type { ReservationFormErrors, ReservationFormValues } from '../schemas/reservationForm';
import type { ReservationPayload } from '../api/reservations';
import { fetchResourceAvailability } from '../api/resourceApi';
import type { ResourceAvailability } from '../api/resourceApi';
import { getErrorMessage } from '../api/eventApi';

export interface FormRef {
  _id: string;
  name: string;
  unit?: string;
}

interface ReservationFormProps {
  events: FormRef[];
  resources: FormRef[];
  submitLabel: string;
  submitting: boolean;
  error?: string | null;
  initialValues?: ReservationFormValues;
  // Units this reservation already holds (edit case) - released before the
  // availability check so keeping the same quantity stays valid.
  heldQuantity?: number;
  onSubmit: (payload: ReservationPayload) => void;
  onCancel: () => void;
}

// Shared create/edit form. Validates before handing a payload to the page and
// checks live availability whenever a resource is selected.
export default function ReservationForm({
  events,
  resources,
  submitLabel,
  submitting,
  error,
  initialValues,
  heldQuantity = 0,
  onSubmit,
  onCancel,
}: ReservationFormProps) {
  const [values, setValues] = useState<ReservationFormValues>(initialValues ?? emptyReservationForm);
  const [errors, setErrors] = useState<ReservationFormErrors>({});

  const [availability, setAvailability] = useState<ResourceAvailability | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  // Refresh availability whenever the selected resource changes.
  useEffect(() => {
    const resourceId = values.resourceId;
    if (!resourceId) {
      setAvailability(null);
      setAvailabilityError(null);
      setAvailabilityLoading(false);
      return;
    }

    let cancelled = false;
    setAvailabilityLoading(true);
    setAvailabilityError(null);
    fetchResourceAvailability(resourceId)
      .then((data) => {
        if (!cancelled) setAvailability(data);
      })
      .catch((requestError) => {
        if (!cancelled) {
          setAvailability(null);
          setAvailabilityError(getErrorMessage(requestError));
        }
      })
      .finally(() => {
        if (!cancelled) setAvailabilityLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [values.resourceId]);

  const maxQuantity =
    availability !== null
      ? Math.max(0, availability.available + heldQuantity)
      : null;

  const setField = (field: keyof ReservationFormValues, value: string) => {
    setValues((previous) => ({ ...previous, [field]: value }));
    // Clear the field's error as soon as the user edits it.
    setErrors((previous) => {
      if (!previous[field]) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const validationErrors = validateReservationForm(values, maxQuantity);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    onSubmit(reservationFormToPayload(values));
  };

  const selectedResource = resources.find((resource) => resource._id === values.resourceId);

  const availabilityHint = (() => {
    if (!values.resourceId) return null;
    if (availabilityLoading) return 'Checking availability...';
    if (availabilityError) return 'Availability could not be checked right now.';
    if (!availability) return null;
    const suffix = heldQuantity > 0 ? ` (incl. ${heldQuantity} held by this reservation)` : '';
    const unitSuffix = selectedResource?.unit ? ` (${selectedResource.unit})` : '';
    return `${availability.available} of ${availability.total} available${unitSuffix}${suffix}`;
  })();

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Event"
          name="eventId"
          value={values.eventId}
          onChange={(event) => setField('eventId', event.target.value)}
          error={errors.eventId}
          options={[
            { value: '', label: 'Select an event' },
            ...events.map((event) => ({ value: event._id, label: event.name })),
          ]}
        />

        <div>
          <Select
            label="Resource"
            name="resourceId"
            value={values.resourceId}
            onChange={(event) => setField('resourceId', event.target.value)}
            error={errors.resourceId}
            options={[
              { value: '', label: 'Select a resource' },
              ...resources.map((resource) => ({
                value: resource._id,
                label: resource.unit ? `${resource.name} (${resource.unit})` : resource.name,
              })),
            ]}
          />
          {availabilityHint && (
            <p
              className={`mt-1 text-xs ${
                availabilityError ? 'text-slate-500' : 'text-slate-600'
              }`}
            >
              {availabilityHint}
            </p>
          )}
        </div>

        <Input
          label="Quantity"
          name="quantity"
          type="number"
          min={1}
          step={1}
          value={values.quantity}
          onChange={(event) => setField('quantity', event.target.value)}
          error={errors.quantity}
          placeholder="e.g. 20"
        />

        <Input
          label="Date"
          name="date"
          type="date"
          value={values.date}
          onChange={(event) => setField('date', event.target.value)}
          error={errors.date}
        />

        <Input
          label="Start time"
          name="startTime"
          type="time"
          value={values.startTime}
          onChange={(event) => setField('startTime', event.target.value)}
          error={errors.startTime}
        />

        <Input
          label="End time"
          name="endTime"
          type="time"
          value={values.endTime}
          onChange={(event) => setField('endTime', event.target.value)}
          error={errors.endTime}
        />

        <div className="sm:col-span-2">
          <label htmlFor="reservationNotes" className="mb-1 block text-sm font-medium text-slate-700">
            Notes
          </label>
          <textarea
            id="reservationNotes"
            name="notes"
            rows={3}
            value={values.notes}
            onChange={(event) => setField('notes', event.target.value)}
            placeholder="Anything the team should know about this booking"
            className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
              errors.notes ? 'border-red-400' : 'border-slate-200'
            }`}
          />
          {errors.notes && <p className="mt-1 text-xs text-red-600">{errors.notes}</p>}
        </div>
      </div>

      {events.length === 0 && !error && (
        <p className="mt-3 text-sm text-slate-500">
          No events exist yet. Create an event first to reserve resources for it.
        </p>
      )}
      {resources.length === 0 && !error && (
        <p className="mt-3 text-sm text-slate-500">
          No resources exist yet. Create a resource first to reserve it.
        </p>
      )}

      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting || availabilityLoading}>
          {submitting ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
