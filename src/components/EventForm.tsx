import { useState } from 'react';
import type { FormEvent } from 'react';
import Button from './Button';
import Input from './Input';
import Select from './Select';
import {
  emptyEventForm,
  eventFormToPayload,
  EVENT_STATUSES,
  validateEventForm,
} from '../schemas/eventForm';
import type { EventFormErrors, EventFormValues } from '../schemas/eventForm';
import type { EventPayload, RefWithName } from '../api/eventApi';

interface EventFormProps {
  organizations: RefWithName[];
  venues: RefWithName[];
  submitLabel: string;
  submitting: boolean;
  error?: string | null;
  initialValues?: EventFormValues;
  onSubmit: (payload: EventPayload) => void;
  onCancel: () => void;
}

const capitalize = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);

// Shared create/edit form. Validates before handing a payload to the page.
export default function EventForm({
  organizations,
  venues,
  submitLabel,
  submitting,
  error,
  initialValues,
  onSubmit,
  onCancel,
}: EventFormProps) {
  const [values, setValues] = useState<EventFormValues>(initialValues ?? emptyEventForm);
  const [errors, setErrors] = useState<EventFormErrors>({});

  const setField = (field: keyof EventFormValues, value: string) => {
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
    const validationErrors = validateEventForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    onSubmit(eventFormToPayload(values));
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input
            label="Event name"
            required
            name="name"
            value={values.name}
            onChange={(event) => setField('name', event.target.value)}
            error={errors.name}
            placeholder="e.g. Students' Night"
            maxLength={200}
          />
        </div>

        <Select
          label="Organization"
          required
          name="organization"
          value={values.organization}
          onChange={(event) => setField('organization', event.target.value)}
          error={errors.organization}
          options={[
            { value: '', label: 'Select an organization' },
            ...organizations.map((organization) => ({
              value: organization._id,
              label: organization.name,
            })),
          ]}
        />

        <Select
          label="Venue"
          name="venue"
          value={values.venue}
          onChange={(event) => setField('venue', event.target.value)}
          error={errors.venue}
          options={[
            { value: '', label: 'No venue assigned' },
            ...venues.map((venue) => ({ value: venue._id, label: venue.name })),
          ]}
        />

        <Input
          label="Date"
          required
          name="date"
          type="date"
          value={values.date}
          onChange={(event) => setField('date', event.target.value)}
          error={errors.date}
        />

        <Select
          label="Status"
          name="status"
          value={values.status}
          onChange={(event) => setField('status', event.target.value)}
          error={errors.status}
          options={EVENT_STATUSES.map((status) => ({
            value: status,
            label: capitalize(status),
          }))}
        />

        <Input
          label="Start time"
          required
          name="startTime"
          type="time"
          value={values.startTime}
          onChange={(event) => setField('startTime', event.target.value)}
          error={errors.startTime}
        />

        <Input
          label="End time"
          required
          name="endTime"
          type="time"
          value={values.endTime}
          onChange={(event) => setField('endTime', event.target.value)}
          error={errors.endTime}
        />

        <div className="sm:col-span-2">
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={values.description}
            onChange={(event) => setField('description', event.target.value)}
            placeholder="What is this event about?"
            className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
              errors.description ? 'border-red-400' : 'border-slate-200'
            }`}
          />
          {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
