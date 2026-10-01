import type { VenuePayload, VenueRecord, VenueType } from '../types/venue';

// Shape of the create/edit venue form. Capacity stays a string so the
// controlled input stays in sync while the user types.
export interface VenueFormValues {
  name: string;
  capacity: string;
  venueType: VenueType | '';
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  contactPhone: string;
}

export type VenueFormErrors = Partial<Record<keyof VenueFormValues, string>>;

export const emptyVenueForm: VenueFormValues = {
  name: '',
  capacity: '',
  venueType: '',
  street: '',
  city: '',
  state: '',
  zipCode: '',
  country: '',
  contactPhone: '',
};

// Mirrors the enum on the backend Venue model.
export const VENUE_TYPE_OPTIONS = [
  { value: '', label: 'Select a venue type' },
  { value: 'indoor', label: 'Indoor' },
  { value: 'outdoor', label: 'Outdoor' },
  { value: 'hybrid', label: 'Hybrid' },
];

// Whole number, no negatives.
function parseCapacity(raw: string): number | null {
  if (raw.trim() === '') return null;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) return null;
  return value;
}

export function validateVenueForm(values: VenueFormValues): VenueFormErrors {
  const errors: VenueFormErrors = {};

  if (!values.name.trim()) {
    errors.name = 'Venue name is required';
  } else if (values.name.trim().length > 200) {
    errors.name = 'Venue name must be 200 characters or fewer';
  }

  const capacity = parseCapacity(values.capacity);
  if (values.capacity.trim() === '') {
    errors.capacity = 'Capacity is required';
  } else if (capacity === null) {
    errors.capacity = 'Capacity must be a whole number of 0 or more';
  }

  if (!values.venueType) {
    errors.venueType = 'Venue type is required';
  }

  if (values.contactPhone.length > 30) {
    errors.contactPhone = 'Contact phone must be 30 characters or fewer';
  }

  return errors;
}

// Prefill the form from an API record.
export function venueToFormValues(venue: VenueRecord): VenueFormValues {
  return {
    name: venue.name,
    capacity: String(venue.capacity ?? 0),
    venueType: venue.venueType ?? 'indoor',
    street: venue.address?.street ?? '',
    city: venue.address?.city ?? '',
    state: venue.address?.state ?? '',
    zipCode: venue.address?.zipCode ?? '',
    country: venue.address?.country ?? '',
    contactPhone: venue.contactPhone ?? '',
  };
}

export function venueFormToPayload(values: VenueFormValues): VenuePayload {
  const address = {
    ...(values.street.trim() && { street: values.street.trim() }),
    ...(values.city.trim() && { city: values.city.trim() }),
    ...(values.state.trim() && { state: values.state.trim() }),
    ...(values.zipCode.trim() && { zipCode: values.zipCode.trim() }),
    ...(values.country.trim() && { country: values.country.trim() }),
  };

  return {
    name: values.name.trim(),
    capacity: Number(values.capacity),
    venueType: values.venueType as VenueType,
    ...(Object.keys(address).length > 0 && { address }),
    ...(values.contactPhone.trim() && { contactPhone: values.contactPhone.trim() }),
  };
}
