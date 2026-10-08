import { z } from 'zod';
import type { EventPayload, EventRecord } from '../types/event';
import { refId } from '../api/eventApi';
import { toInputDate, toInputTime } from '../utils/format';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

// Create/edit form schema for the booker side. The backend stores one ISO
// start and end date; the form splits them into date + start/end time.
export const bookerEventSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Event name is required')
      .max(200, 'Event name must be 200 characters or fewer'),
    description: z
      .string()
      .max(2000, 'Description must be 2000 characters or fewer')
      .optional()
      .or(z.literal('')),
    organization: z.string().min(1, 'Organization is required'),
    venue: z.string().min(1, 'Please select a venue'),
    date: z
      .string()
      .min(1, 'Date is required')
      .refine((value) => !Number.isNaN(Date.parse(value)), 'Enter a valid date'),
    startTime: z
      .string()
      .min(1, 'Start time is required')
      .regex(TIME_PATTERN, 'Enter a valid time (HH:MM)'),
    endTime: z
      .string()
      .min(1, 'End time is required')
      .regex(TIME_PATTERN, 'Enter a valid time (HH:MM)'),
  })
  .superRefine((values, ctx) => {
    // Both times are zero-padded 24h strings, so lexicographic comparison
    // matches chronological order.
    if (
      TIME_PATTERN.test(values.startTime) &&
      TIME_PATTERN.test(values.endTime) &&
      values.endTime <= values.startTime
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['endTime'],
        message: 'End time must be after start time',
      });
    }
  });

export type BookerEventFormValues = z.infer<typeof bookerEventSchema>;

export const emptyBookerEventForm: BookerEventFormValues = {
  name: '',
  description: '',
  organization: '',
  venue: '',
  date: '',
  startTime: '',
  endTime: '',
};

// Prefill the form from an API record (detail responses may populate refs).
export function eventToBookerFormValues(event: EventRecord): BookerEventFormValues {
  return {
    name: event.name,
    description: event.description ?? '',
    organization: refId(event.organization),
    venue: refId(event.venue),
    date: toInputDate(event.startDate),
    startTime: toInputTime(event.startDate),
    endTime: toInputTime(event.endDate),
  };
}

// Combine the date + time fields into ISO timestamps for the API.
// Status is not sent: the backend derives it from the booking.
export function bookerEventFormToPayload(values: BookerEventFormValues): EventPayload {
  const startDate = new Date(`${values.date}T${values.startTime}:00`);
  const endDate = new Date(`${values.date}T${values.endTime}:00`);

  return {
    name: values.name.trim(),
    organization: values.organization,
    venue: values.venue,
    ...(values.description?.trim() && { description: values.description.trim() }),
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
}
