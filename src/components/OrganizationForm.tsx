import { useState } from 'react';
import type { FormEvent } from 'react';
import Button from './Button';
import Input from './Input';
import {
  emptyOrganizationForm,
  organizationFormToPayload,
  validateOrganizationForm,
} from '../schemas/organizationForm';
import type { OrganizationFormErrors, OrganizationFormValues } from '../schemas/organizationForm';
import type { CreateOrganizationPayload } from '../types/organization';

interface OrganizationFormProps {
  submitLabel: string;
  submitting: boolean;
  error?: string | null;
  initialValues?: OrganizationFormValues;
  onSubmit: (payload: CreateOrganizationPayload) => void;
  onCancel: () => void;
}

// Shared create/edit form. Validates before handing a payload to the page.
export default function OrganizationForm({
  submitLabel,
  submitting,
  error,
  initialValues,
  onSubmit,
  onCancel,
}: OrganizationFormProps) {
  const [values, setValues] = useState<OrganizationFormValues>(initialValues ?? emptyOrganizationForm);
  const [errors, setErrors] = useState<OrganizationFormErrors>({});

  const setField = (field: keyof OrganizationFormValues, value: string) => {
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
    const validationErrors = validateOrganizationForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    onSubmit(organizationFormToPayload(values));
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
            label="Organization name"
            required
            name="organizationName"
            value={values.name}
            onChange={(event) => setField('name', event.target.value)}
            error={errors.name}
            placeholder="e.g. Acme Events"
            maxLength={150}
          />
        </div>

        <Input
          label="Contact email"
          name="organizationEmail"
          type="email"
          value={values.email}
          onChange={(event) => setField('email', event.target.value)}
          error={errors.email}
          placeholder="events@acme.com"
          maxLength={254}
        />

        <Input
          label="Phone"
          name="organizationPhone"
          value={values.phone}
          onChange={(event) => setField('phone', event.target.value)}
          error={errors.phone}
          placeholder="e.g. +1 555 0100"
          maxLength={30}
        />

        <div className="sm:col-span-2">
          <Input
            label="Website"
            name="organizationWebsite"
            value={values.website}
            onChange={(event) => setField('website', event.target.value)}
            error={errors.website}
            placeholder="https://acme.com"
            maxLength={200}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="organizationDescription" className="mb-1 block text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            id="organizationDescription"
            name="description"
            rows={3}
            value={values.description}
            onChange={(event) => setField('description', event.target.value)}
            placeholder="What does this organization do?"
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
