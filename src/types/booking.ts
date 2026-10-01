// Booking domain types (POST/GET /api/bookings).
// Statuses use the exact casing of the backend Booking model.

import type { RefWithName } from './event';

export type BookingStatus =
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'Cancelled'
  | 'Completed';

// Populated event reference inside a booking response.
export interface BookingEventRef {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  venue?: string | RefWithName | null;
  organization?: string | RefWithName;
  bookerId?: string | RefWithName;
}

// Populated booker reference inside a booking response.
export interface BookingBookerRef {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export interface BookingRecord {
  _id: string;
  eventId: string | BookingEventRef;
  bookerId: string | BookingBookerRef;
  status: BookingStatus;
  notes?: string;
  rejectionReason?: string;
  submittedAt?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BookingPayload {
  eventId: string;
  notes?: string;
}

// One entry of the 409 response of PUT /api/bookings/:id/approve.
export interface BookingConflict {
  type: 'VENUE_CONFLICT' | 'SCHEDULE_CONFLICT' | 'RESOURCE_SHORTAGE' | 'INVALID_SCHEDULE';
  message?: string;
  venue?: string;
  event?: string;
  resource?: string;
  resourceId?: string;
  required?: number;
  available?: number;
  shortage?: number;
  startDate?: string;
  endDate?: string;
}

// Error body of a rejected approval attempt.
export interface ApprovalConflictResponse {
  success: false;
  message: string;
  conflicts: BookingConflict[];
}
