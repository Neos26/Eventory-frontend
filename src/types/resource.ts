// Resource domain types (GET /api/resources, /:id/availability, /utilization).

import type { RefWithName } from './event';

export type ResourceCategory =
  | 'furniture'
  | 'audio_visual'
  | 'decoration'
  | 'catering'
  | 'IT'
  | 'transport'
  | 'other';

export interface ResourceRecord {
  _id: string;
  organization?: string | RefWithName;
  name: string;
  category: ResourceCategory;
  description?: string;
  quantityTotal: number;
  quantityAvailable: number;
  unit?: string;
  costPerUnit?: number;
  isAvailable: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Response of GET /api/resources/:id/availability - computed from active
// reservations rather than the stored quantityAvailable field.
export interface ResourceAvailability {
  resource: { id: string; name: string; unit?: string };
  total: number;
  reserved: number;
  available: number;
  activeReservations: number;
}

export interface ResourcePayload {
  name: string;
  category: ResourceCategory;
  description?: string;
  quantityTotal: number;
  quantityAvailable?: number;
  unit?: string;
  isAvailable?: boolean;
}

export type ResourceStatusKey = 'active' | 'low_stock' | 'out_of_stock' | 'inactive';

export interface ResourceStatus {
  key: ResourceStatusKey;
  label: string;
  tone: 'green' | 'amber' | 'red' | 'gray';
}
