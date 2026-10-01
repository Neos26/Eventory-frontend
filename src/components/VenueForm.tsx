import { useState } from 'react';
import type { FormEvent } from 'react';
import Button from './Button';
import Input from './Input';
import Select from './Select';
import {
  emptyVenueForm,
  validateVenueForm,
  venueFormToPayload,
  VENUE_TYPE_OPTIONS,
} from '../schemas/venueForm';
import type { VenueFormErrors, VenueFormValues } from '../schemas/venueForm';
import type { VenuePayload } from '../types/venue';

interface VenueFormProps {
  submitLabel: string;
  submitting: boolean;
  error?: string | null;
  initialValues?: VenueFormValues;
  onSubmit: (payload: VenuePayload) => void;
  onCancel: () => void;
}

// Shared create/edit venue form. Validates before handing a payload to the page.
export default function VenueForm({
  submitLabel,
  submitting,
  error,
  initialValues,
  onSubmit,
  onCancel,
}: VenueFormProps) {
  const [values, setValues] = useState<VenueFormValues>(initialValues ?? emptyVenueForm);
  const [errors, setErrors] = useState<VenueFormErrors>({});

  const setField = (field: keyof VenueFormValues, value: string) => {
    setValues((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => {
      if (!previous[field]) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const validationErrors = validateVenueForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    onSubmit(venueFormToPayload(values));
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
            label="Venue name"
            name="venueName"
            value={values.name}
            onChange={(event) => setField('name', event.target.value)}
            error={errors.name}
            placeholder="e.g. Grand Auditorium"
            maxLength={200}
          />
        </div>

        <Input
          label="Capacity"
          name="capacity"
          type="number"
          min={0}
          step={1}
          value={values.capacity}
          onChange={(event) => setField('capacity', event.target.value)}
          error={errors.capacity}
          placeholder="e.g. 250"
        />

        <Select
          label="Venue type"
          name="venueType"
          value={values.venueType}
          onChange={(event) => setField('venueType', event.target.value)}
          error={errors.venueType}
          options={VENUE_TYPE_OPTIONS}
        />

        <Input
          label="Contact phone"
          name="contactPhone"
          value={values.contactPhone}
          onChange={(event) => setField('contactPhone', event.target.value)}
          error={errors.contactPhone}
          placeholder="e.g. +63 917 123 4567"
          maxLength={30}
        />
      </div>

      <fieldset className="mt-4">
        <legend className="mb-2 text-sm font-medium text-slate-700">Address</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label="Street"
              name="street"
              value={values.street}
              onChange={(event) => setField('street', event.target.value)}
              placeholder="e.g. 123 Rizal Avenue"
              maxLength={200}
            />
          </div>
          <Input
            label="City"
            name="city"
            value={values.city}
            onChange={(event) => setField('city', event.target.value)}
            placeholder="e.g. Manila"
            maxLength={100}
          />
          <Input
            label="State / Province"
            name="state"
            value={values.state}
            onChange={(event) => setField('state', event.target.value)}
            placeholder="e.g. Metro Manila"
            maxLength={100}
          />
          <Input
            label="ZIP Code"
            name="zipCode"
            value={values.zipCode}
            onChange={(event) => setField('zipCode', event.target.value)}
            placeholder="e.g. 1002"
            maxLength={20}
          />
          <Input
            label="Country"
            name="country"
            value={values.country}
            onChange={(event) => setField('country', event.target.value)}
            placeholder="e.g. Philippines"
            maxLength={100}
          />
        </div>
      </fieldset>

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
