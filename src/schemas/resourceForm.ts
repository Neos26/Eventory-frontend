import type { ResourcePayload, ResourceRecord, ResourceCategory } from '../api/resources';

// Shape of the create/edit resource form. Quantities are kept as strings so
// the inputs stay controlled while the user types.
export interface ResourceFormValues {
  name: string;
  category: ResourceCategory | '';
  unit: string;
  quantityTotal: string;
  quantityAvailable: string; // '' = start fully available (create only)
  status: 'active' | 'inactive';
  description: string;
}

export type ResourceFormErrors = Partial<Record<keyof ResourceFormValues, string>>;

export const emptyResourceForm: ResourceFormValues = {
  name: '',
  category: '',
  unit: '',
  quantityTotal: '',
  quantityAvailable: '',
  status: 'active',
  description: '',
};

// Mirrors the enum on the backend Resource model.
export const RESOURCE_CATEGORIES: ResourceCategory[] = [
  'furniture',
  'audio_visual',
  'decoration',
  'catering',
  'IT',
  'transport',
  'other',
];

export const RESOURCE_CATEGORY_OPTIONS = [
  { value: '', label: 'Select a category' },
  ...RESOURCE_CATEGORIES.map((category) => ({ value: category, label: resourceCategoryLabel(category) })),
];

export function resourceCategoryLabel(category: ResourceCategory): string {
  const labels: Record<ResourceCategory, string> = {
    furniture: 'Furniture',
    audio_visual: 'Audio Visual',
    decoration: 'Decoration',
    catering: 'Catering',
    IT: 'IT',
    transport: 'Transport',
    other: 'Other',
  };
  return labels[category];
}

// Whole number, no negatives. Empty string is allowed (field is optional).
function parseQuantity(raw: string): number | null {
  if (raw.trim() === '') return null;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) return null;
  return value;
}

export function validateResourceForm(values: ResourceFormValues): ResourceFormErrors {
  const errors: ResourceFormErrors = {};

  if (!values.name.trim()) {
    errors.name = 'Resource name is required';
  } else if (values.name.trim().length > 200) {
    errors.name = 'Resource name must be 200 characters or fewer';
  }

  if (!values.category) {
    errors.category = 'Category is required';
  }

  const total = parseQuantity(values.quantityTotal);
  if (values.quantityTotal.trim() === '') {
    errors.quantityTotal = 'Total quantity is required';
  } else if (total === null || total < 0) {
    errors.quantityTotal = 'Total quantity must be a whole number of 0 or more';
  }

  if (values.quantityAvailable.trim() !== '') {
    const available = parseQuantity(values.quantityAvailable);
    if (available === null) {
      errors.quantityAvailable = 'Available quantity must be a whole number of 0 or more';
    } else if (total !== null && available > total) {
      errors.quantityAvailable = 'Available quantity cannot exceed total quantity';
    }
  }

  if (values.unit.length > 50) {
    errors.unit = 'Unit must be 50 characters or fewer';
  }

  if (values.description.length > 1000) {
    errors.description = 'Description must be 1000 characters or fewer';
  }

  return errors;
}

// Prefill the form from an API record.
export function resourceToFormValues(resource: ResourceRecord): ResourceFormValues {
  return {
    name: resource.name,
    category: resource.category,
    unit: resource.unit ?? '',
    quantityTotal: String(resource.quantityTotal),
    quantityAvailable: String(resource.quantityAvailable),
    status: resource.isAvailable ? 'active' : 'inactive',
    description: resource.description ?? '',
  };
}

export function resourceFormToPayload(values: ResourceFormValues): ResourcePayload {
  const quantityTotal = Number(values.quantityTotal);

  return {
    name: values.name.trim(),
    category: values.category as ResourceCategory,
    quantityTotal,
    isAvailable: values.status === 'active',
    ...(values.quantityAvailable.trim() !== '' && {
      quantityAvailable: Number(values.quantityAvailable),
    }),
    ...(values.unit.trim() && { unit: values.unit.trim() }),
    ...(values.description.trim() && { description: values.description.trim() }),
  };
}
