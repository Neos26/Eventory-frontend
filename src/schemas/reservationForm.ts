import type { ReservationPayload, ReservationRecord } from '../api/reservations';
import { toInputDate, toInputTime } from '../utils/format';

// Shape of the create/edit reservation form. The backend stores one ISO
// timestamp per boundary; the form splits them into date + start/end times.
export interface ReservationFormValues {
  eventId: string;
  resourceId: string;
  quantity: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  notes: string;
}

export type ReservationFormErrors = Partial<Record<keyof ReservationFormValues, string>>;

export const emptyReservationForm: ReservationFormValues = {
  eventId: '',
  resourceId: '',
  quantity: '1',
  date: '',
  startTime: '',
  endTime: '',
  notes: '',
};

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

// maxQuantity = units still available for this reservation. When editing, the
// page passes available + what this reservation already holds, so keeping the
// same quantity stays valid. null = availability unknown, skip the check.
export function validateReservationForm(
  values: ReservationFormValues,
  maxQuantity: number | null = null,
): ReservationFormErrors {
  const errors: ReservationFormErrors = {};

  if (!values.eventId) {
    errors.eventId = 'Select an event';
  }

  if (!values.resourceId) {
    errors.resourceId = 'Select a resource';
  }

  const quantity = Number(values.quantity);
  if (!Number.isInteger(quantity) || quantity < 1) {
    errors.quantity = 'Quantity must be a whole number of at least 1';
  } else if (maxQuantity !== null && quantity > maxQuantity) {
    errors.quantity =
      maxQuantity === 0
        ? 'No stock is available for this resource'
        : `Only ${maxQuantity} available for this period`;
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

  if (values.notes.length > 1000) {
    errors.notes = 'Notes must be 1000 characters or fewer';
  }

  return errors;
}

// Prefill the form from an API record (detail responses may populate refs).
export function reservationToFormValues(reservation: ReservationRecord): ReservationFormValues {
  return {
    eventId: typeof reservation.event === 'string' ? reservation.event : reservation.event._id,
    resourceId:
      typeof reservation.resource === 'string' ? reservation.resource : reservation.resource._id,
    quantity: String(reservation.quantity),
    date: toInputDate(reservation.reservedFrom),
    startTime: toInputTime(reservation.reservedFrom),
    endTime: toInputTime(reservation.reservedUntil),
    notes: reservation.notes ?? '',
  };
}

// Combine the date + time fields into ISO timestamps for the API.
export function reservationFormToPayload(values: ReservationFormValues): ReservationPayload {
  const reservedFrom = new Date(`${values.date}T${values.startTime}:00`);
  const reservedUntil = new Date(`${values.date}T${values.endTime}:00`);

  return {
    event: values.eventId,
    resource: values.resourceId,
    quantity: Number(values.quantity),
    reservedFrom: reservedFrom.toISOString(),
    reservedUntil: reservedUntil.toISOString(),
    ...(values.notes.trim() && { notes: values.notes.trim() }),
  };
}
