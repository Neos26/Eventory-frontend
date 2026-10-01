import type { EventPayload, EventRecord, EventStatus } from '../api/eventApi';
import { refId } from '../api/eventApi';
import { toInputDate, toInputTime } from '../utils/format';

// Shape of the create/edit form. The backend stores a single ISO start and
// end date; the form splits them into one date + start/end time fields.
export interface EventFormValues {
  name: string;
  organization: string;
  venue: string; // '' = no venue
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  description: string;
  status: EventStatus;
}

export type EventFormErrors = Partial<Record<keyof EventFormValues, string>>;

export const emptyEventForm: EventFormValues = {
  name: '',
  organization: '',
  venue: '',
  date: '',
  startTime: '',
  endTime: '',
  description: '',
  status: 'draft',
};

export const EVENT_STATUSES: EventStatus[] = [
  'draft',
  'planned',
  'ongoing',
  'completed',
  'cancelled',
];

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function validateEventForm(values: EventFormValues): EventFormErrors {
  const errors: EventFormErrors = {};

  if (!values.name.trim()) {
    errors.name = 'Event name is required';
  } else if (values.name.trim().length > 200) {
    errors.name = 'Event name must be 200 characters or fewer';
  }

  if (!values.organization) {
    errors.organization = 'Organization is required';
  }

  if (!values.date) {
    errors.date = 'Date is required';
  } else if (Number.isNaN(Date.parse(values.date))) {
    errors.date = 'Enter a valid date';
  }

  if (!values.startTime) {
    errors.startTime = 'Start time is required';
  } else if (!TIME_PATTERN.test(values.startTime)) {
    errors.startTime = 'Enter a valid time';
  }

  if (!values.endTime) {
    errors.endTime = 'End time is required';
  } else if (!TIME_PATTERN.test(values.endTime)) {
    errors.endTime = 'Enter a valid time';
  }

  // Both times are zero-padded 24h strings, so lexicographic order matches
  // chronological order.
  if (!errors.startTime && !errors.endTime && values.endTime <= values.startTime) {
    errors.endTime = 'End time must be after start time';
  }

  if (values.description.length > 2000) {
    errors.description = 'Description must be 2000 characters or fewer';
  }

  return errors;
}

// Prefill the form from an API record (detail responses may populate venue).
export function eventToFormValues(event: EventRecord): EventFormValues {
  return {
    name: event.name,
    organization: refId(event.organization),
    venue: refId(event.venue),
    date: toInputDate(event.startDate),
    startTime: toInputTime(event.startDate),
    endTime: toInputTime(event.endDate),
    description: event.description ?? '',
    status: event.status,
  };
}

// Combine the date + time fields into ISO timestamps for the API.
export function eventFormToPayload(values: EventFormValues): EventPayload {
  const startDate = new Date(`${values.date}T${values.startTime}:00`);
  const endDate = new Date(`${values.date}T${values.endTime}:00`);

  return {
    name: values.name.trim(),
    organization: values.organization,
    venue: values.venue || null,
    ...(values.description.trim() && { description: values.description.trim() }),
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    status: values.status,
  };
}
