import { useState } from 'react';
import type { FormEvent } from 'react';
import Button from './Button';
import Input from './Input';
import Select from './Select';
import {
  emptyResourceForm,
  RESOURCE_CATEGORY_OPTIONS,
  resourceFormToPayload,
  validateResourceForm,
} from '../schemas/resourceForm';
import type { ResourceFormErrors, ResourceFormValues } from '../schemas/resourceForm';
import type { ResourcePayload } from '../api/resourceApi';

interface ResourceFormProps {
  submitLabel: string;
  submitting: boolean;
  error?: string | null;
  initialValues?: ResourceFormValues;
  onSubmit: (payload: ResourcePayload) => void;
  onCancel: () => void;
}

// Shared create/edit form. Validates before handing a payload to the page.
export default function ResourceForm({
  submitLabel,
  submitting,
  error,
  initialValues,
  onSubmit,
  onCancel,
}: ResourceFormProps) {
  const [values, setValues] = useState<ResourceFormValues>(initialValues ?? emptyResourceForm);
  const [errors, setErrors] = useState<ResourceFormErrors>({});

  const setField = (field: keyof ResourceFormValues, value: string) => {
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
    const validationErrors = validateResourceForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    onSubmit(resourceFormToPayload(values));
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
            label="Resource name"
            name="resourceName"
            value={values.name}
            onChange={(event) => setField('name', event.target.value)}
            error={errors.name}
            placeholder="e.g. Folding Chair"
            maxLength={200}
          />
        </div>

        <Select
          label="Category"
          name="resourceCategory"
          value={values.category}
          onChange={(event) => setField('category', event.target.value)}
          error={errors.category}
          options={RESOURCE_CATEGORY_OPTIONS}
        />

        <Input
          label="Unit"
          name="unit"
          value={values.unit}
          onChange={(event) => setField('unit', event.target.value)}
          error={errors.unit}
          placeholder="e.g. unit, set, hour"
        />

        <Input
          label="Total quantity"
          name="quantityTotal"
          type="number"
          min={0}
          step={1}
          value={values.quantityTotal}
          onChange={(event) => setField('quantityTotal', event.target.value)}
          error={errors.quantityTotal}
          placeholder="e.g. 50"
        />

        <Input
          label="Available quantity"
          name="quantityAvailable"
          type="number"
          min={0}
          step={1}
          value={values.quantityAvailable}
          onChange={(event) => setField('quantityAvailable', event.target.value)}
          error={errors.quantityAvailable}
          placeholder="Defaults to total"
        />

        <Select
          label="Status"
          name="resourceStatus"
          value={values.status}
          onChange={(event) => setField('status', event.target.value)}
          error={errors.status}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ]}
        />

        <div className="sm:col-span-2">
          <label htmlFor="resourceDescription" className="mb-1 block text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            id="resourceDescription"
            name="description"
            rows={3}
            value={values.description}
            onChange={(event) => setField('description', event.target.value)}
            placeholder="What is this resource?"
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
