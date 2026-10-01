import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import Button from './Button';
import Input from './Input';
import Select from './Select';
import VenueSelect from './VenueSelect';
import { fetchOrganizations } from '../api/eventApi';
import { getErrorMessage } from '../api/eventApi';
import { useAuth } from '../context/AuthContext';
import {
  bookerEventFormToPayload,
  bookerEventSchema,
  emptyBookerEventForm,
  eventToBookerFormValues,
} from '../schemas/bookerEventForm';
import type { BookerEventFormValues } from '../schemas/bookerEventForm';
import type { EventPayload, EventRecord } from '../types/event';
import type { OrganizationRecord } from '../types/organization';

interface BookerEventFormProps {
  /** Prefill values for editing; omitted when creating. */
  initialEvent?: EventRecord;
  submitLabel: string;
  /** API error surfaced above the form. */
  error?: string | null;
  onSubmit: (payload: EventPayload) => Promise<void>;
}

// Shared React Hook Form + Zod form for creating and editing booker events.
export default function BookerEventForm({
  initialEvent,
  submitLabel,
  error,
  onSubmit,
}: BookerEventFormProps) {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([]);
  const [orgError, setOrgError] = useState<string | null>(null);

  const defaultValues: BookerEventFormValues = initialEvent
    ? eventToBookerFormValues(initialEvent)
    : {
        ...emptyBookerEventForm,
        organization: user?.organizationId ?? '',
      };

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BookerEventFormValues>({
    resolver: zodResolver(bookerEventSchema),
    defaultValues,
    // Show a field's error as soon as the user leaves it, then live-update.
    mode: 'onTouched',
  });

  useEffect(() => {
    let cancelled = false;
    fetchOrganizations()
      .then((list) => {
        if (!cancelled) {
          setOrganizations(list);
          setOrgError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setOrgError(getErrorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const date = watch('date');

  const submit = handleSubmit(
    async (values) => {
      await onSubmit(
        bookerEventFormToPayload(values, initialEvent ? initialEvent.status : 'draft'),
      );
    },
    (fieldErrors) => {
      // Move focus to the first invalid control so keyboard users land
      // directly on the problem after a failed submit.
      const first = Object.keys(fieldErrors)[0];
      if (!first) return;
      const target =
        document.getElementById(first) ??
        document.querySelector<HTMLElement>('[aria-invalid="true"]');
      target?.focus();
    },
  );

  const organizationOptions = organizations.map((organization) => ({
    value: organization._id,
    label: organization.name,
  }));

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}
      {orgError && (
        <div
          role="alert"
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          {orgError}
        </div>
      )}

      <Input
        label="Event Name"
        placeholder="e.g. Tech Summit 2027"
        error={errors.name?.message}
        {...register('name')}
      />

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium text-slate-700">
          Description
        </label>
        <textarea
          id="description"
          rows={4}
          placeholder="What is this event about?"
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={errors.description ? 'description-error' : undefined}
          className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
            errors.description ? 'border-red-400' : 'border-slate-200'
          }`}
          {...register('description')}
        />
        {errors.description && (
          <p id="description-error" role="alert" className="mt-1 text-xs text-red-600">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Organization"
          options={organizationOptions}
          error={errors.organization?.message}
          {...register('organization')}
        />
        <Input
          label="Date"
          type="date"
          error={errors.date?.message}
          {...register('date')}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Start Time"
          type="time"
          error={errors.startTime?.message}
          {...register('startTime')}
        />
        <Input
          label="End Time"
          type="time"
          error={errors.endTime?.message}
          {...register('endTime')}
        />
      </div>

      <Controller
        control={control}
        name="venue"
        render={({ field }) => (
          <VenueSelect
            value={field.value}
            onChange={field.onChange}
            date={date || undefined}
            error={errors.venue?.message}
          />
        )}
      />

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
