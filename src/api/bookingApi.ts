import { isAxiosError } from 'axios';
import api from './client';
import type { BookingConflict, BookingPayload, BookingRecord, BookingStatus } from '../types/booking';
import type { BookingEventRef } from '../types/booking';

const unwrap = <T>(response: { data: { data: T } }): T => response.data.data;

export type * from '../types/booking';

// GET /api/bookings (bookers only receive their own bookings).
export const fetchBookings = async (status?: BookingStatus): Promise<BookingRecord[]> => {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return unwrap(await api.get(`/bookings${query}`));
};

// GET /api/bookings/:id
export const fetchBooking = async (id: string): Promise<BookingRecord> =>
  unwrap(await api.get(`/bookings/${id}`));

// POST /api/bookings - submits a booking request (starts as Pending).
export const createBooking = async (payload: BookingPayload): Promise<BookingRecord> =>
  unwrap(await api.post('/bookings', payload));

// PUT /api/bookings/:id/cancel - only Pending bookings can be cancelled.
export const cancelBooking = async (id: string): Promise<BookingRecord> =>
  unwrap(await api.put(`/bookings/${id}/cancel`, {}));

// PUT /api/bookings/:id/approve - verifies venue/resources, creates
// reservations and sets Approved. Conflicts answer with 409.
export const approveBooking = async (id: string): Promise<BookingRecord> =>
  unwrap(await api.put(`/bookings/${id}/approve`, {}));

// PUT /api/bookings/:id/reject - requires a non-empty rejection reason.
export const rejectBooking = async (id: string, rejectionReason: string): Promise<BookingRecord> =>
  unwrap(await api.put(`/bookings/${id}/reject`, { rejectionReason }));

// Reads the conflict list out of a 409 approve response so the review page
// can show exactly what blocked the approval.
export function approvalConflictsOf(error: unknown): BookingConflict[] | null {
  if (isAxiosError(error) && error.response?.status === 409) {
    const data = error.response.data as { conflicts?: BookingConflict[] } | undefined;
    if (data && Array.isArray(data.conflicts)) return data.conflicts;
  }
  return null;
}

// Bookings store a populated event; this reads it from either shape.
// Bookings whose event was deleted populate as null and are treated as unknown.
export function bookingEvent(booking: BookingRecord): BookingEventRef | null {
  if (typeof booking.eventId === 'string' || booking.eventId == null) return null;
  return booking.eventId;
}

export function bookingEventId(booking: BookingRecord): string {
  if (typeof booking.eventId === 'string') return booking.eventId;
  return booking.eventId?._id ?? '';
}

export function bookingEventName(booking: BookingRecord): string {
  return bookingEvent(booking)?.name ?? 'Unknown event';
}
