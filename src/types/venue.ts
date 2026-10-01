// Venue domain types (GET /api/venues, /api/venues/:id/availability).

import type { RefWithName } from './event';

export interface VenueAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export type VenueType = 'indoor' | 'outdoor' | 'hybrid';

export interface VenueRecord {
  _id: string;
  organization?: string | RefWithName;
  name: string;
  address?: VenueAddress;
  capacity?: number;
  venueType?: VenueType;
  contactPhone?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Create/update payload (POST /api/venues, PUT /api/venues/:id).
export interface VenuePayload {
  name?: string;
  capacity?: number;
  venueType?: VenueType;
  address?: VenueAddress;
  contactPhone?: string;
  isActive?: boolean;
}

// GET /api/venues/:id/availability?start=...&end=... (or ?date=...)
export interface VenueAvailability {
  venue: { id: string; name: string; capacity: number; isActive: boolean };
  requested: { start: string; end: string };
  available: boolean;
  conflicts: {
    _id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
  }[];
}
