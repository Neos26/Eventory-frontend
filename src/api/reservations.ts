import api from './client';
import type { RefWithName } from './events';

// ---------- Types (mirror the backend ResourceReservation model) ----------
//
// The backend does not expose reservation endpoints yet; this module defines
// the REST contract the Reservations page is built against:
//   GET    /api/reservations          -> list (event/resource populated)
//   POST   /api/reservations          -> create
//   PUT    /api/reservations/:id      -> update (status drives cancel/release)

export type ReservationStatus = 'reserved' | 'issued' | 'returned' | 'cancelled';

export interface ReservationRecord {
  _id: string;
  event: string | RefWithName;
  requirement?: string | null;
  resource: string | RefWithName;
  quantity: number;
  reservedFrom: string;
  reservedUntil: string;
  status: ReservationStatus;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReservationPayload {
  event: string;
  resource: string;
  quantity: number;
  reservedFrom: string;
  reservedUntil: string;
  notes?: string;
}

// ---------- Helpers ----------

const unwrap = <T>(response: { data: { data: T } }): T => response.data.data;

// Reservations that still hold stock.
export const ACTIVE_RESERVATION_STATUSES: ReservationStatus[] = ['reserved', 'issued'];

export function isActiveReservation(reservation: ReservationRecord): boolean {
  return ACTIVE_RESERVATION_STATUSES.includes(reservation.status);
}

// ---------- Reservations ----------

export const fetchReservations = async (): Promise<ReservationRecord[]> =>
  unwrap(await api.get('/reservations'));

export const createReservation = async (payload: ReservationPayload): Promise<ReservationRecord> =>
  unwrap(await api.post('/reservations', payload));

export const updateReservation = async (
  id: string,
  payload: Partial<ReservationPayload>,
): Promise<ReservationRecord> => unwrap(await api.put(`/reservations/${id}`, payload));

// Cancel releases the stock immediately (status -> cancelled).
export const cancelReservation = async (id: string): Promise<ReservationRecord> =>
  unwrap(await api.put(`/reservations/${id}`, { status: 'cancelled' }));

// Release marks issued stock as returned (status -> returned).
export const releaseReservation = async (id: string): Promise<ReservationRecord> =>
  unwrap(await api.put(`/reservations/${id}`, { status: 'returned' }));
